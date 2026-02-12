package models

// SurveySummary is returned in the list endpoint
type SurveySummary struct {
	ID            int    `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	QuestionCount int    `json:"question_count"`
}

// SurveyResponseV2 is the full survey payload for the detail endpoint
type SurveyResponseV2 struct {
	ID          int          `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Categories  []CategoryV2 `json:"categories"`
}

// CategoryV2 groups subcategories under a heading
type CategoryV2 struct {
	Title         string          `json:"title"`
	Subcategories []SubcategoryV2 `json:"subcategories"`
}

// SubcategoryV2 groups related questions
type SubcategoryV2 struct {
	Title     string           `json:"title"`
	Questions []QuestionDataV2 `json:"questions"`
}

// QuestionDataV2 is the public shape of each question
type QuestionDataV2 struct {
	QID                 string   `json:"qid"`
	Label               string   `json:"label"`
	Text                string   `json:"text"`
	Disciplines         []string `json:"disciplines"`
	TotalResponses      int64    `json:"total_responses"`
	ChartType           string   `json:"chart_type"`
	Unit                string   `json:"unit"`
	Numeric             bool     `json:"numeric_scale"`
	Stacked             bool     `json:"stacked"`
	GroupID             string   `json:"groupid,omitempty"`
	QuestionTextGrouped string   `json:"question_text_grouped,omitempty"`
	AnswerTextGrouped   string   `json:"answer_text_grouped,omitempty"`
	AnswerOrderGrouped  int64    `json:"answer_order_grouped,omitempty"`
	Order               string   `json:"order,omitempty"`
	MultSelect          bool     `json:"multi_select,omitempty"`
	Data                []Datum  `json:"data"`
}

// Datum is a single data point in a chart
type Datum struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Color string  `json:"color,omitempty"`
}
