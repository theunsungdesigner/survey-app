import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'success' | 'failure' | 'skipped';
  error?: string;
  duration?: number;
}

async function run(): Promise<void> {
  try {
    const workspace = core.getInput('workspace') || process.env.GITHUB_WORKSPACE || process.cwd();
    const nodeVersion = core.getInput('node-version') || '18';
    const goVersion = core.getInput('go-version') || '1.21';

    core.startGroup('Environment Setup');
    core.info(`Workspace: ${workspace}`);
    core.info(`Node Version: ${nodeVersion}`);
    core.info(`Go Version: ${goVersion}`);
    core.endGroup();

    const results: CheckResult[] = [];

    // Frontend checks
    const frontendPath = path.join(workspace, 'frontend');
    results.push(await runFrontendLint(frontendPath));
    results.push(await runFrontendTypeCheck(frontendPath));
    results.push(await runFrontendTests(frontendPath));
    results.push(await runFrontendBuild(frontendPath));

    // Backend checks
    const backendPath = path.join(workspace, 'backend');
    results.push(await runBackendLint(backendPath));
    results.push(await runBackendTests(backendPath));
    results.push(await runBackendBuild(backendPath));

    // Set outputs
    for (const result of results) {
      const outputName = result.name.toLowerCase().replace(/ /g, '-');
      core.setOutput(outputName, result.status);
    }

    // Generate summary
    const summary = generateSummary(results);
    core.setOutput('summary', summary);

    // Write to GitHub Actions summary
    await core.summary
      .addHeading('Feature Branch Checks')
      .addTable([
        [{data: 'Check', header: true}, {data: 'Status', header: true}, {data: 'Duration', header: true}],
        ...results.map(r => [
          r.name,
          r.status === 'success' ? '✅ Passed' : r.status === 'failure' ? '❌ Failed' : '⊘ Skipped',
          r.duration ? `${r.duration.toFixed(2)}s` : 'N/A'
        ])
      ])
      .write();

    // Fail if any check failed
    const hasFailures = results.some(r => r.status === 'failure');
    if (hasFailures) {
      core.setFailed('One or more checks failed');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

async function runFrontendLint(frontendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Frontend: ESLint');
    await exec.exec('npm', ['run', 'lint'], { cwd: frontendPath });
    core.endGroup();
    return {
      name: 'Frontend Lint',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    return {
      name: 'Frontend Lint',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runFrontendTypeCheck(frontendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Frontend: TypeScript Check');
    await exec.exec('npx', ['tsc', '--noEmit'], { cwd: frontendPath });
    core.endGroup();
    return {
      name: 'Frontend Type Check',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    return {
      name: 'Frontend Type Check',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runFrontendTests(frontendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Frontend: Jest Tests');
    // CI=true ensures tests run in non-watch mode
    await exec.exec('npm', ['test', '--', '--ci', '--coverage', '--maxWorkers=2'], {
      cwd: frontendPath,
      env: { ...process.env, CI: 'true' }
    });
    core.endGroup();
    return {
      name: 'Frontend Tests',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    // If no tests exist yet, consider it skipped rather than failed
    const errorMsg = error instanceof Error ? error.message : '';
    if (errorMsg.includes('No tests found') || errorMsg.includes('no test')) {
      core.warning('No frontend tests found - skipping');
      return {
        name: 'Frontend Tests',
        status: 'skipped',
        duration: (Date.now() - start) / 1000
      };
    }
    return {
      name: 'Frontend Tests',
      status: 'failure',
      error: errorMsg,
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runFrontendBuild(frontendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Frontend: Production Build');
    await exec.exec('npm', ['run', 'build'], { cwd: frontendPath });
    core.endGroup();
    return {
      name: 'Frontend Build',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    return {
      name: 'Frontend Build',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runBackendLint(backendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Backend: golangci-lint');
    await exec.exec('golangci-lint', ['run', '--timeout=5m'], { cwd: backendPath });
    core.endGroup();
    return {
      name: 'Backend Lint',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    return {
      name: 'Backend Lint',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runBackendTests(backendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Backend: Go Tests');
    await exec.exec('go', ['test', '-v', '-race', '-coverprofile=coverage.out', './...'], {
      cwd: backendPath
    });
    core.endGroup();
    return {
      name: 'Backend Tests',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    const errorMsg = error instanceof Error ? error.message : '';
    if (errorMsg.includes('no test files') || errorMsg.includes('no Go files')) {
      core.warning('No backend tests found - skipping');
      return {
        name: 'Backend Tests',
        status: 'skipped',
        duration: (Date.now() - start) / 1000
      };
    }
    return {
      name: 'Backend Tests',
      status: 'failure',
      error: errorMsg,
      duration: (Date.now() - start) / 1000
    };
  }
}

async function runBackendBuild(backendPath: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    core.startGroup('Backend: Go Build');
    await exec.exec('go', ['build', '-v', '-o', 'server', '.'], { cwd: backendPath });
    core.endGroup();
    return {
      name: 'Backend Build',
      status: 'success',
      duration: (Date.now() - start) / 1000
    };
  } catch (error) {
    core.endGroup();
    return {
      name: 'Backend Build',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: (Date.now() - start) / 1000
    };
  }
}

function generateSummary(results: CheckResult[]): string {
  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failure').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return `Checks: ${passed} passed, ${failed} failed, ${skipped} skipped`;
}

run();
