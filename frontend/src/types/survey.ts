export interface SurveySummary {
  id: number;
  title: string;
  description: string;
  question_count: number;
}

export interface SurveyResponseV2 {
  id: number;
  title: string;
  description: string;
  categories: CategoryV2[];
}

export interface CategoryV2 {
  title: string;
  subcategories: SubcategoryV2[];
}

export interface SubcategoryV2 {
  title: string;
  questions: QuestionDataV2[];
}

export interface QuestionDataV2 {
  qid: string;
  label: string;
  text: string;
  disciplines: string[];
  total_responses: number;
  chart_type: string;
  unit: string;
  numeric_scale: boolean;
  stacked: boolean;
  groupid?: string;
  question_text_grouped?: string;
  answer_text_grouped?: string;
  answer_order_grouped?: number;
  order?: string;
  multi_select?: boolean;
  data: Datum[];
}

export interface Datum {
  label: string;
  value: number;
  color?: string;
}
