import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as path from 'path';
import * as fs from 'fs';

interface CheckResult {
  name: string;
  status: 'success' | 'failure' | 'skipped';
  error?: string;
  duration?: number;
}

async function run(): Promise<void> {
  try {
    const workspace = core.getInput('workspace') || process.env.GITHUB_WORKSPACE || process.cwd();
    const githubToken = core.getInput('github-token', { required: true });
    const registry = core.getInput('registry') || 'ghcr.io';
    const registryUsername = core.getInput('registry-username') || github.context.actor;
    const createRelease = core.getInput('create-release') === 'true';

    core.startGroup('Environment Setup');
    core.info(`Workspace: ${workspace}`);
    core.info(`Registry: ${registry}`);
    core.info(`Create Release: ${createRelease}`);
    core.endGroup();

    const results: CheckResult[] = [];

    // Run all feature branch checks first
    results.push(...await runAllChecks(workspace));

    // Check if any critical checks failed (builds and lints are critical, tests can be skipped)
    const criticalFailures = results.filter(r =>
      r.status === 'failure' && (r.name.includes('Build') || r.name.includes('Lint'))
    );

    if (criticalFailures.length > 0) {
      core.setFailed('Critical checks failed - skipping Docker build and release');
      await generateMergeSummary(results, '', '', '');
      return;
    }

    // Determine version/tag
    const version = await determineVersion();
    core.info(`Using version: ${version}`);

    // Docker login
    await dockerLogin(registry, registryUsername, githubToken);

    // Build and push images
    const frontendImage = await buildAndPushFrontendImage(
      workspace,
      registry,
      github.context.repo.owner,
      github.context.repo.repo,
      version
    );
    const backendImage = await buildAndPushBackendImage(
      workspace,
      registry,
      github.context.repo.owner,
      github.context.repo.repo,
      version
    );

    core.setOutput('frontend-image', frontendImage);
    core.setOutput('backend-image', backendImage);

    // Create release if requested
    let releaseUrl = '';
    if (createRelease) {
      const release = await createGitHubRelease(githubToken, version);
      core.setOutput('release-tag', release.tag);
      core.setOutput('release-url', release.url);
      releaseUrl = release.url;
    }

    // Generate final summary
    await generateMergeSummary(results, frontendImage, backendImage, version, releaseUrl);

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

async function runAllChecks(workspace: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const frontendPath = path.join(workspace, 'frontend');
  const backendPath = path.join(workspace, 'backend');

  // Run all checks from feature-branch-push action
  results.push(await runCheck('Frontend Lint', async () => {
    await exec.exec('npm', ['run', 'lint'], { cwd: frontendPath });
  }));

  results.push(await runCheck('Frontend Type Check', async () => {
    await exec.exec('npx', ['tsc', '--noEmit'], { cwd: frontendPath });
  }));

  results.push(await runCheck('Frontend Tests', async () => {
    await exec.exec('npm', ['test', '--', '--ci', '--coverage', '--maxWorkers=2'], {
      cwd: frontendPath,
      env: { ...process.env, CI: 'true' }
    });
  }, true)); // Allow skipping if no tests

  results.push(await runCheck('Frontend Build', async () => {
    await exec.exec('npm', ['run', 'build'], { cwd: frontendPath });
  }));

  results.push(await runCheck('Backend Lint', async () => {
    await exec.exec('golangci-lint', ['run', '--timeout=5m'], { cwd: backendPath });
  }));

  results.push(await runCheck('Backend Tests', async () => {
    await exec.exec('go', ['test', '-v', '-race', '-coverprofile=coverage.out', './...'], {
      cwd: backendPath
    });
  }, true)); // Allow skipping if no tests

  results.push(await runCheck('Backend Build', async () => {
    await exec.exec('go', ['build', '-v', '-o', 'server', '.'], { cwd: backendPath });
  }));

  return results;
}

async function runCheck(
  name: string,
  checkFn: () => Promise<void>,
  allowSkip: boolean = false
): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup(name);
    await checkFn();
    core.endGroup();
    return {
      name,
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Check if we should skip this check
    if (allowSkip && (errorMsg.includes('No tests found') || errorMsg.includes('no test') || errorMsg.includes('no Go files'))) {
      core.warning(`${name}: No tests found - skipping`);
      return {
        name,
        status: 'skipped',
        duration: (Date.now() - start) / 1000
      };
    }

    return {
      name,
      status: 'failure',
      error: errorMsg,
      duration: (Date.now() - start) / 1000
    };
  }
}

async function determineVersion(): Promise<string> {
  const sha = github.context.sha.substring(0, 7);
  const ref = github.context.ref;

  // If on main branch, use semantic version pattern
  if (ref === 'refs/heads/main') {
    // Try to get latest tag
    try {
      const { stdout, exitCode } = await exec.getExecOutput('git', [
        'describe',
        '--tags',
        '--abbrev=0'
      ], { ignoreReturnCode: true });

      if (exitCode === 0 && stdout.trim()) {
        const latestTag = stdout.trim();
        const match = latestTag.match(/v(\d+)\.(\d+)\.(\d+)/);
        if (match) {
          const [, major, minor, patch] = match;
          const newPatch = parseInt(patch, 10) + 1;
          return `v${major}.${minor}.${newPatch}`;
        }
      }
    } catch {
      core.info('No previous tags found, starting at v0.0.1');
    }
    return 'v0.0.1';
  }

  return `sha-${sha}`;
}

async function dockerLogin(
  registry: string,
  username: string,
  token: string
): Promise<void> {
  core.startGroup('Docker Login');
  try {
    await exec.exec('docker', ['login', registry, '-u', username, '--password-stdin'], {
      input: Buffer.from(token)
    });
    core.info('Successfully logged into container registry');
  } catch (error) {
    throw new Error(`Docker login failed: ${error}`);
  } finally {
    core.endGroup();
  }
}

async function buildAndPushFrontendImage(
  workspace: string,
  registry: string,
  owner: string,
  repo: string,
  version: string
): Promise<string> {
  core.startGroup('Build and Push Frontend Image');

  const imageName = `${registry}/${owner}/${repo}-frontend`;
  const tags = [
    `${imageName}:${version}`,
    `${imageName}:latest`
  ];

  try {
    const frontendPath = path.join(workspace, 'frontend');

    // Check if production Dockerfile exists
    const prodDockerfile = path.join(frontendPath, 'Dockerfile');
    if (!fs.existsSync(prodDockerfile)) {
      core.warning('Production Dockerfile not found at frontend/Dockerfile');
      throw new Error('Frontend Dockerfile missing - cannot build image');
    }

    // Build image
    await exec.exec('docker', [
      'build',
      '-t', tags[0],
      '-t', tags[1],
      '-f', prodDockerfile,
      '.'
    ], { cwd: frontendPath });

    // Push all tags
    for (const tag of tags) {
      await exec.exec('docker', ['push', tag]);
      core.info(`Pushed: ${tag}`);
    }

    return tags[0];
  } finally {
    core.endGroup();
  }
}

async function buildAndPushBackendImage(
  workspace: string,
  registry: string,
  owner: string,
  repo: string,
  version: string
): Promise<string> {
  core.startGroup('Build and Push Backend Image');

  const imageName = `${registry}/${owner}/${repo}-backend`;
  const tags = [
    `${imageName}:${version}`,
    `${imageName}:latest`
  ];

  try {
    const backendPath = path.join(workspace, 'backend');

    // Build image
    await exec.exec('docker', [
      'build',
      '-t', tags[0],
      '-t', tags[1],
      '.'
    ], { cwd: backendPath });

    // Push all tags
    for (const tag of tags) {
      await exec.exec('docker', ['push', tag]);
      core.info(`Pushed: ${tag}`);
    }

    return tags[0];
  } finally {
    core.endGroup();
  }
}

async function createGitHubRelease(
  token: string,
  version: string
): Promise<{ tag: string; url: string }> {
  core.startGroup('Create GitHub Release');

  try {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Generate changelog
    const changelog = await generateChangelog();

    // Create release
    const release = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: version,
      name: `Release ${version}`,
      body: changelog,
      draft: false,
      prerelease: false
    });

    core.info(`Created release: ${release.data.html_url}`);
    return {
      tag: version,
      url: release.data.html_url
    };
  } finally {
    core.endGroup();
  }
}

async function generateChangelog(): Promise<string> {
  try {
    const { stdout } = await exec.getExecOutput('git', [
      'log',
      '--pretty=format:- %s (%h)',
      'HEAD~10..HEAD'
    ], { ignoreReturnCode: true });

    if (stdout.trim()) {
      return `## Changes\n\n${stdout}\n\n---\n*Auto-generated by GitHub Actions*`;
    }
    return '## Changes\n\nNo changelog available\n';
  } catch {
    return '## Changes\n\nNo changelog available\n';
  }
}

async function generateMergeSummary(
  results: CheckResult[],
  frontendImage: string,
  backendImage: string,
  version: string,
  releaseUrl?: string
): Promise<void> {
  const summaryBuilder = core.summary
    .addHeading('Merge to Main - Build Summary');

  if (version) {
    summaryBuilder
      .addHeading('Version', 3)
      .addRaw(`\`${version}\``);
  }

  summaryBuilder
    .addHeading('Checks', 3)
    .addTable([
      [{data: 'Check', header: true}, {data: 'Status', header: true}],
      ...results.map(r => [
        r.name,
        r.status === 'success' ? '✅ Passed' : r.status === 'failure' ? '❌ Failed' : '⊘ Skipped'
      ])
    ]);

  if (frontendImage && backendImage) {
    summaryBuilder
      .addHeading('Docker Images', 3)
      .addList([
        `Frontend: \`${frontendImage}\``,
        `Backend: \`${backendImage}\``
      ]);
  }

  if (releaseUrl) {
    summaryBuilder
      .addHeading('Release', 3)
      .addRaw(`[View Release](${releaseUrl})`);
  }

  await summaryBuilder.write();

  // Set summary output
  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failure').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  core.setOutput('summary', `Checks: ${passed} passed, ${failed} failed, ${skipped} skipped`);
}

run();
