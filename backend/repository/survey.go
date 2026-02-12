package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"survey-app/models"
)

// SurveyRepository handles all database operations for surveys
type SurveyRepository struct {
	DB *sql.DB
}

// NewSurveyRepository creates a new repository
func NewSurveyRepository(db *sql.DB) *SurveyRepository {
	return &SurveyRepository{DB: db}
}

// ListSurveys returns all surveys with question counts
func (r *SurveyRepository) ListSurveys() ([]models.SurveySummary, error) {
	query := `
		SELECT s.id, s.title, s.description, COUNT(q.id) as question_count
		FROM surveys s
		LEFT JOIN categories c ON c.survey_id = s.id
		LEFT JOIN subcategories sc ON sc.category_id = c.id
		LEFT JOIN questions q ON q.subcategory_id = sc.id
		GROUP BY s.id, s.title, s.description
		ORDER BY s.id
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("query surveys: %w", err)
	}
	defer rows.Close()

	var surveys []models.SurveySummary
	for rows.Next() {
		var s models.SurveySummary
		if err := rows.Scan(&s.ID, &s.Title, &s.Description, &s.QuestionCount); err != nil {
			return nil, fmt.Errorf("scan survey: %w", err)
		}
		surveys = append(surveys, s)
	}
	return surveys, nil
}

// GetSurvey returns the full survey with nested categories/subcategories/questions
func (r *SurveyRepository) GetSurvey(id int) (*models.SurveyResponseV2, error) {
	// Get survey
	var survey models.SurveyResponseV2
	err := r.DB.QueryRow("SELECT id, title, description FROM surveys WHERE id = $1", id).
		Scan(&survey.ID, &survey.Title, &survey.Description)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query survey: %w", err)
	}

	// Get categories
	catRows, err := r.DB.Query(
		"SELECT id, title FROM categories WHERE survey_id = $1 ORDER BY sort_order", id)
	if err != nil {
		return nil, fmt.Errorf("query categories: %w", err)
	}
	defer catRows.Close()

	for catRows.Next() {
		var catID int
		var cat models.CategoryV2
		if err := catRows.Scan(&catID, &cat.Title); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}

		// Get subcategories for this category
		subRows, err := r.DB.Query(
			"SELECT id, title FROM subcategories WHERE category_id = $1 ORDER BY sort_order", catID)
		if err != nil {
			return nil, fmt.Errorf("query subcategories: %w", err)
		}

		for subRows.Next() {
			var subID int
			var sub models.SubcategoryV2
			if err := subRows.Scan(&subID, &sub.Title); err != nil {
				subRows.Close()
				return nil, fmt.Errorf("scan subcategory: %w", err)
			}

			// Get questions for this subcategory
			qRows, err := r.DB.Query(`
				SELECT qid, label, text, disciplines, total_responses,
				       chart_type, unit, numeric_scale, stacked,
				       group_id, question_text_grouped, answer_text_grouped,
				       answer_order_grouped, sort_order, multi_select, question_data
				FROM questions
				WHERE subcategory_id = $1
				ORDER BY sort_order
			`, subID)
			if err != nil {
				subRows.Close()
				return nil, fmt.Errorf("query questions: %w", err)
			}

			for qRows.Next() {
				var q models.QuestionDataV2
				var disciplinesJSON, questionDataJSON []byte
				var groupID, questionTextGrouped, answerTextGrouped sql.NullString
				var answerOrderGrouped sql.NullInt64

				if err := qRows.Scan(
					&q.QID, &q.Label, &q.Text, &disciplinesJSON,
					&q.TotalResponses, &q.ChartType, &q.Unit,
					&q.Numeric, &q.Stacked,
					&groupID, &questionTextGrouped, &answerTextGrouped,
					&answerOrderGrouped, &q.Order, &q.MultSelect,
					&questionDataJSON,
				); err != nil {
					qRows.Close()
					subRows.Close()
					return nil, fmt.Errorf("scan question: %w", err)
				}

				// Unmarshal JSONB fields
				if err := json.Unmarshal(disciplinesJSON, &q.Disciplines); err != nil {
					q.Disciplines = []string{}
				}
				if err := json.Unmarshal(questionDataJSON, &q.Data); err != nil {
					q.Data = []models.Datum{}
				}

				// Handle nullable fields
				if groupID.Valid {
					q.GroupID = groupID.String
				}
				if questionTextGrouped.Valid {
					q.QuestionTextGrouped = questionTextGrouped.String
				}
				if answerTextGrouped.Valid {
					q.AnswerTextGrouped = answerTextGrouped.String
				}
				if answerOrderGrouped.Valid {
					q.AnswerOrderGrouped = answerOrderGrouped.Int64
				}

				sub.Questions = append(sub.Questions, q)
			}
			qRows.Close()

			cat.Subcategories = append(cat.Subcategories, sub)
		}
		subRows.Close()

		survey.Categories = append(survey.Categories, cat)
	}

	return &survey, nil
}
