package services

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"survey-app/models"
)

// ExportService handles all export operations
type ExportService struct{}

// NewExportService creates a new export service
func NewExportService() *ExportService {
	return &ExportService{}
}

// ExportAsCSV exports survey data as CSV
func (s *ExportService) ExportAsCSV(survey *models.SurveyResponseV2) ([]byte, error) {
	var buf strings.Builder
	writer := csv.NewWriter(&buf)

	// Header
	writer.Write([]string{"Category", "Subcategory", "QID", "Question", "Chart Type", "Label", "Value", "Total Responses"})

	for _, cat := range survey.Categories {
		for _, sub := range cat.Subcategories {
			for _, q := range sub.Questions {
				for _, d := range q.Data {
					writer.Write([]string{
						cat.Title,
						sub.Title,
						q.QID,
						q.Text,
						q.ChartType,
						d.Label,
						fmt.Sprintf("%.2f", d.Value),
						fmt.Sprintf("%d", q.TotalResponses),
					})
				}
			}
		}
	}

	writer.Flush()
	return []byte(buf.String()), nil
}

// ExportAsJSON exports survey data as formatted JSON
func (s *ExportService) ExportAsJSON(survey *models.SurveyResponseV2) ([]byte, error) {
	return json.MarshalIndent(survey, "", "  ")
}

// ExportAsReport exports a formatted text report
func (s *ExportService) ExportAsReport(survey *models.SurveyResponseV2) ([]byte, error) {
	var buf strings.Builder

	buf.WriteString(fmt.Sprintf("SURVEY REPORT: %s\n", survey.Title))
	buf.WriteString(fmt.Sprintf("%s\n", strings.Repeat("=", 60)))
	buf.WriteString(fmt.Sprintf("%s\n\n", survey.Description))

	for _, cat := range survey.Categories {
		buf.WriteString(fmt.Sprintf("\n## %s\n", cat.Title))
		buf.WriteString(fmt.Sprintf("%s\n", strings.Repeat("-", 40)))

		for _, sub := range cat.Subcategories {
			buf.WriteString(fmt.Sprintf("\n### %s\n\n", sub.Title))

			for _, q := range sub.Questions {
				buf.WriteString(fmt.Sprintf("  Q: %s\n", q.Text))
				buf.WriteString(fmt.Sprintf("     Chart Type: %s | Responses: %d\n", q.ChartType, q.TotalResponses))
				for _, d := range q.Data {
					buf.WriteString(fmt.Sprintf("     - %s: %.2f\n", d.Label, d.Value))
				}
				buf.WriteString("\n")
			}
		}
	}

	return []byte(buf.String()), nil
}

// ExportSummary exports summary statistics
func (s *ExportService) ExportSummary(survey *models.SurveyResponseV2) ([]byte, error) {
	totalQuestions := 0
	totalResponses := int64(0)
	chartTypes := make(map[string]int)

	for _, cat := range survey.Categories {
		for _, sub := range cat.Subcategories {
			for _, q := range sub.Questions {
				totalQuestions++
				totalResponses += q.TotalResponses
				chartTypes[q.ChartType]++
			}
		}
	}

	summary := map[string]interface{}{
		"survey_title":    survey.Title,
		"total_questions": totalQuestions,
		"total_responses": totalResponses,
		"categories":      len(survey.Categories),
		"chart_types":     chartTypes,
	}

	return json.MarshalIndent(summary, "", "  ")
}
