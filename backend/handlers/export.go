package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"survey-app/models"
	"survey-app/repository"
	"survey-app/services"

	"github.com/gin-gonic/gin"
)

func ExportSurveyCSV(repo *repository.SurveyRepository, svc *services.ExportService) gin.HandlerFunc {
	return func(c *gin.Context) {
		survey, err := getSurveyForExport(c, repo)
		if err != nil || survey == nil {
			return
		}
		data, err := svc.ExportAsCSV(survey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=survey_%d.csv", survey.ID))
		c.Data(http.StatusOK, "text/csv; charset=utf-8", data)
	}
}

func ExportSurveyJSON(repo *repository.SurveyRepository, svc *services.ExportService) gin.HandlerFunc {
	return func(c *gin.Context) {
		survey, err := getSurveyForExport(c, repo)
		if err != nil || survey == nil {
			return
		}
		data, err := svc.ExportAsJSON(survey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=survey_%d.json", survey.ID))
		c.Data(http.StatusOK, "application/json", data)
	}
}

func ExportSurveyReport(repo *repository.SurveyRepository, svc *services.ExportService) gin.HandlerFunc {
	return func(c *gin.Context) {
		survey, err := getSurveyForExport(c, repo)
		if err != nil || survey == nil {
			return
		}
		data, err := svc.ExportAsReport(survey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=survey_%d_report.txt", survey.ID))
		c.Data(http.StatusOK, "text/plain; charset=utf-8", data)
	}
}

func ExportSurveySummary(repo *repository.SurveyRepository, svc *services.ExportService) gin.HandlerFunc {
	return func(c *gin.Context) {
		survey, err := getSurveyForExport(c, repo)
		if err != nil || survey == nil {
			return
		}
		data, err := svc.ExportSummary(survey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=survey_%d_summary.json", survey.ID))
		c.Data(http.StatusOK, "application/json", data)
	}
}

func getSurveyForExport(c *gin.Context, repo *repository.SurveyRepository) (*models.SurveyResponseV2, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid survey id"})
		return nil, err
	}
	survey, err := repo.GetSurvey(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return nil, err
	}
	if survey == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "survey not found"})
		return nil, fmt.Errorf("not found")
	}
	return survey, nil
}
