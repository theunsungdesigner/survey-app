import { SurveySummary, SurveyResponseV2 } from '../types/survey';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export async function fetchSurveys(): Promise<SurveySummary[]> {
  const res = await fetch(`${API_URL}/api/v2/surveys`);
  if (!res.ok) throw new Error(`Failed to fetch surveys: ${res.statusText}`);
  return res.json();
}

export async function fetchSurvey(id: number): Promise<SurveyResponseV2> {
  const res = await fetch(`${API_URL}/api/v2/surveys/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch survey: ${res.statusText}`);
  return res.json();
}

export function getExportUrl(surveyId: number, format: string): string {
  return `${API_URL}/api/v2/surveys/${surveyId}/export/${format}`;
}
