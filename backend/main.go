package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"survey-app/handlers"
	"survey-app/repository"
	"survey-app/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Database connection
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "survey_db")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to PostgreSQL")

	// Initialize repository and services
	surveyRepo := repository.NewSurveyRepository(db)
	exportService := services.NewExportService()

	// Setup Gin router
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api/v2")
	{
		api.GET("/surveys", handlers.ListSurveys(surveyRepo))
		api.GET("/surveys/:id", handlers.GetSurvey(surveyRepo))

		// Export routes
		api.GET("/surveys/:id/export/csv", handlers.ExportSurveyCSV(surveyRepo, exportService))
		api.GET("/surveys/:id/export/json", handlers.ExportSurveyJSON(surveyRepo, exportService))
		api.GET("/surveys/:id/export/report", handlers.ExportSurveyReport(surveyRepo, exportService))
		api.GET("/surveys/:id/export/summary", handlers.ExportSurveySummary(surveyRepo, exportService))
	}

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
