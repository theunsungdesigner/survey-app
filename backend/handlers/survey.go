package handlers

import (
	"net/http"
	"strconv"
	"survey-app/repository"

	"github.com/gin-gonic/gin"
)

// ListSurveys returns all surveys
func ListSurveys(repo *repository.SurveyRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		surveys, err := repo.ListSurveys()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, surveys)
	}
}

// GetSurvey returns a full survey by ID
func GetSurvey(repo *repository.SurveyRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid survey id"})
			return
		}

		survey, err := repo.GetSurvey(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if survey == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "survey not found"})
			return
		}

		c.JSON(http.StatusOK, survey)
	}
}
