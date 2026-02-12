package services_test

import (
	"encoding/json"
	"strings"
	"survey-app/models"
	"survey-app/services"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("ExportService", func() {
	var (
		exportService *services.ExportService
		mockSurvey    *models.SurveyResponseV2
	)

	BeforeEach(func() {
		exportService = services.NewExportService()

		// Create mock survey data
		mockSurvey = &models.SurveyResponseV2{
			ID:          1,
			Title:       "Test Survey",
			Description: "A test survey for unit testing",
			Categories: []models.CategoryV2{
				{
					Title: "Category 1",
					Subcategories: []models.SubcategoryV2{
						{
							Title: "Subcategory 1",
							Questions: []models.QuestionDataV2{
								{
									QID:            "Q1",
									Label:          "Question 1",
									Text:           "What is your name?",
									Disciplines:    []string{"General"},
									TotalResponses: 100,
									ChartType:      "bar",
									Unit:           "",
									Data: []models.Datum{
										{Label: "John", Value: 40},
										{Label: "Jane", Value: 60},
									},
								},
							},
						},
					},
				},
			},
		}
	})

	Describe("ExportAsCSV", func() {
		It("should export survey data as valid CSV", func() {
			result, err := exportService.ExportAsCSV(mockSurvey)

			Expect(err).NotTo(HaveOccurred())
			Expect(result).NotTo(BeEmpty())

			csvString := string(result)
			lines := strings.Split(strings.TrimSpace(csvString), "\n")

			// Check header
			Expect(lines[0]).To(ContainSubstring("Category"))
			Expect(lines[0]).To(ContainSubstring("Subcategory"))
			Expect(lines[0]).To(ContainSubstring("QID"))
			Expect(lines[0]).To(ContainSubstring("Question"))
		})

		It("should include all data rows", func() {
			result, err := exportService.ExportAsCSV(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			csvString := string(result)
			lines := strings.Split(strings.TrimSpace(csvString), "\n")

			// Header + 2 data rows (John and Jane)
			Expect(len(lines)).To(Equal(3))
		})

		It("should include category and subcategory in each row", func() {
			result, err := exportService.ExportAsCSV(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			csvString := string(result)
			Expect(csvString).To(ContainSubstring("Category 1"))
			Expect(csvString).To(ContainSubstring("Subcategory 1"))
		})

		It("should format values with 2 decimal places", func() {
			result, err := exportService.ExportAsCSV(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			csvString := string(result)
			Expect(csvString).To(ContainSubstring("40.00"))
			Expect(csvString).To(ContainSubstring("60.00"))
		})

		Context("with empty survey", func() {
			It("should return only header for survey with no data", func() {
				emptySurvey := &models.SurveyResponseV2{
					ID:          1,
					Title:       "Empty Survey",
					Description: "No data",
					Categories:  []models.CategoryV2{},
				}

				result, err := exportService.ExportAsCSV(emptySurvey)

				Expect(err).NotTo(HaveOccurred())

				csvString := strings.TrimSpace(string(result))
				lines := strings.Split(csvString, "\n")
				Expect(len(lines)).To(Equal(1)) // Only header
			})
		})

		Context("with multiple categories", func() {
			It("should handle multiple categories and questions", func() {
				largeSurvey := &models.SurveyResponseV2{
					ID:    1,
					Title: "Large Survey",
					Categories: []models.CategoryV2{
						{
							Title: "Cat1",
							Subcategories: []models.SubcategoryV2{
								{
									Title: "Sub1",
									Questions: []models.QuestionDataV2{
										{
											QID:            "Q1",
											Text:           "Q1 Text",
											ChartType:      "bar",
											TotalResponses: 50,
											Data: []models.Datum{
												{Label: "A", Value: 25},
												{Label: "B", Value: 25},
											},
										},
									},
								},
							},
						},
						{
							Title: "Cat2",
							Subcategories: []models.SubcategoryV2{
								{
									Title: "Sub2",
									Questions: []models.QuestionDataV2{
										{
											QID:            "Q2",
											Text:           "Q2 Text",
											ChartType:      "pie",
											TotalResponses: 100,
											Data: []models.Datum{
												{Label: "C", Value: 75},
												{Label: "D", Value: 25},
											},
										},
									},
								},
							},
						},
					},
				}

				result, err := exportService.ExportAsCSV(largeSurvey)

				Expect(err).NotTo(HaveOccurred())

				csvString := string(result)
				lines := strings.Split(strings.TrimSpace(csvString), "\n")

				// Header + 4 data rows (2 questions × 2 data points each)
				Expect(len(lines)).To(Equal(5))
				Expect(csvString).To(ContainSubstring("Cat1"))
				Expect(csvString).To(ContainSubstring("Cat2"))
			})
		})
	})

	Describe("ExportAsJSON", func() {
		It("should export survey data as valid JSON", func() {
			result, err := exportService.ExportAsJSON(mockSurvey)

			Expect(err).NotTo(HaveOccurred())
			Expect(result).NotTo(BeEmpty())

			// Verify it's valid JSON by unmarshaling
			var unmarshaled models.SurveyResponseV2
			err = json.Unmarshal(result, &unmarshaled)
			Expect(err).NotTo(HaveOccurred())
		})

		It("should preserve all survey data", func() {
			result, err := exportService.ExportAsJSON(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var unmarshaled models.SurveyResponseV2
			json.Unmarshal(result, &unmarshaled)

			Expect(unmarshaled.ID).To(Equal(mockSurvey.ID))
			Expect(unmarshaled.Title).To(Equal(mockSurvey.Title))
			Expect(unmarshaled.Description).To(Equal(mockSurvey.Description))
			Expect(len(unmarshaled.Categories)).To(Equal(len(mockSurvey.Categories)))
		})

		It("should format JSON with indentation", func() {
			result, err := exportService.ExportAsJSON(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			jsonString := string(result)
			// Indented JSON should have newlines and spaces
			Expect(jsonString).To(ContainSubstring("\n"))
			Expect(jsonString).To(ContainSubstring("  "))
		})

		Context("with nested data", func() {
			It("should preserve nested structure", func() {
				result, err := exportService.ExportAsJSON(mockSurvey)

				Expect(err).NotTo(HaveOccurred())

				var unmarshaled models.SurveyResponseV2
				json.Unmarshal(result, &unmarshaled)

				cat := unmarshaled.Categories[0]
				sub := cat.Subcategories[0]
				question := sub.Questions[0]

				Expect(cat.Title).To(Equal("Category 1"))
				Expect(sub.Title).To(Equal("Subcategory 1"))
				Expect(question.QID).To(Equal("Q1"))
				Expect(len(question.Data)).To(Equal(2))
			})
		})
	})

	Describe("ExportAsReport", func() {
		It("should generate a formatted text report", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())
			Expect(result).NotTo(BeEmpty())

			report := string(result)
			Expect(report).To(ContainSubstring("SURVEY REPORT"))
			Expect(report).To(ContainSubstring(mockSurvey.Title))
		})

		It("should include survey description", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			report := string(result)
			Expect(report).To(ContainSubstring(mockSurvey.Description))
		})

		It("should include category headers", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			report := string(result)
			Expect(report).To(ContainSubstring("## Category 1"))
		})

		It("should include subcategory headers", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			report := string(result)
			Expect(report).To(ContainSubstring("### Subcategory 1"))
		})

		It("should include question details", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			report := string(result)
			Expect(report).To(ContainSubstring("Q: What is your name?"))
			Expect(report).To(ContainSubstring("Chart Type: bar"))
			Expect(report).To(ContainSubstring("Responses: 100"))
		})

		It("should include data points with formatted values", func() {
			result, err := exportService.ExportAsReport(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			report := string(result)
			Expect(report).To(ContainSubstring("John: 40.00"))
			Expect(report).To(ContainSubstring("Jane: 60.00"))
		})

		Context("with formatting", func() {
			It("should use separators for sections", func() {
				result, err := exportService.ExportAsReport(mockSurvey)

				Expect(err).NotTo(HaveOccurred())

				report := string(result)
				Expect(report).To(ContainSubstring(strings.Repeat("=", 60)))
				Expect(report).To(ContainSubstring(strings.Repeat("-", 40)))
			})
		})
	})

	Describe("ExportSummary", func() {
		It("should export summary statistics as JSON", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())
			Expect(result).NotTo(BeEmpty())

			var summary map[string]interface{}
			err = json.Unmarshal(result, &summary)
			Expect(err).NotTo(HaveOccurred())
		})

		It("should include survey title", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var summary map[string]interface{}
			json.Unmarshal(result, &summary)

			Expect(summary["survey_title"]).To(Equal("Test Survey"))
		})

		It("should calculate total questions", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var summary map[string]interface{}
			json.Unmarshal(result, &summary)

			Expect(summary["total_questions"]).To(BeNumerically("==", 1))
		})

		It("should calculate total responses", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var summary map[string]interface{}
			json.Unmarshal(result, &summary)

			Expect(summary["total_responses"]).To(BeNumerically("==", 100))
		})

		It("should count categories", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var summary map[string]interface{}
			json.Unmarshal(result, &summary)

			Expect(summary["categories"]).To(BeNumerically("==", 1))
		})

		It("should group questions by chart type", func() {
			result, err := exportService.ExportSummary(mockSurvey)

			Expect(err).NotTo(HaveOccurred())

			var summary map[string]interface{}
			json.Unmarshal(result, &summary)

			chartTypes := summary["chart_types"].(map[string]interface{})
			Expect(chartTypes["bar"]).To(BeNumerically("==", 1))
		})

		Context("with multiple questions", func() {
			It("should calculate correct totals", func() {
				largeSurvey := &models.SurveyResponseV2{
					ID:    1,
					Title: "Large Survey",
					Categories: []models.CategoryV2{
						{
							Title: "Cat1",
							Subcategories: []models.SubcategoryV2{
								{
									Title: "Sub1",
									Questions: []models.QuestionDataV2{
										{
											QID:            "Q1",
											ChartType:      "bar",
											TotalResponses: 50,
											Data:           []models.Datum{},
										},
										{
											QID:            "Q2",
											ChartType:      "pie",
											TotalResponses: 30,
											Data:           []models.Datum{},
										},
									},
								},
							},
						},
						{
							Title: "Cat2",
							Subcategories: []models.SubcategoryV2{
								{
									Title: "Sub2",
									Questions: []models.QuestionDataV2{
										{
											QID:            "Q3",
											ChartType:      "line",
											TotalResponses: 20,
											Data:           []models.Datum{},
										},
									},
								},
							},
						},
					},
				}

				result, err := exportService.ExportSummary(largeSurvey)

				Expect(err).NotTo(HaveOccurred())

				var summary map[string]interface{}
				json.Unmarshal(result, &summary)

				Expect(summary["total_questions"]).To(BeNumerically("==", 3))
				Expect(summary["total_responses"]).To(BeNumerically("==", 100))
				Expect(summary["categories"]).To(BeNumerically("==", 2))

				chartTypes := summary["chart_types"].(map[string]interface{})
				Expect(chartTypes["bar"]).To(BeNumerically("==", 1))
				Expect(chartTypes["pie"]).To(BeNumerically("==", 1))
				Expect(chartTypes["line"]).To(BeNumerically("==", 1))
			})
		})
	})
})
