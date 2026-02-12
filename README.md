# Survey Dashboard

A full-stack survey data visualization application with Go backend, PostgreSQL database, and React/TypeScript frontend.

## Features

- **Data Visualization**: Pie, bar, line, and area charts via Recharts
- **Hierarchical Data**: Categories → Subcategories → Questions
- **Export**: CSV, JSON, formatted text report, summary statistics
- **Responsive**: Mobile, tablet, and desktop layouts
- **Containerized**: Docker Compose for one-command startup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)
- macOS, Linux, or Windows with WSL2

## Quick Start

```bash
# Clone/extract the project
cd survey-app

# Start all services
docker-compose up --build

# Access the app
open http://localhost:3000
```

The first startup will take a few minutes to build images and install dependencies.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React UI  │────▶│  Go API     │────▶│  PostgreSQL   │
│  :3000      │     │  :8080      │     │  :5432        │
│  TypeScript │     │  Gin        │     │  JSONB data   │
│  MUI + Charts│    │  Repository │     │  4 tables     │
└─────────────┘     └─────────────┘     └──────────────┘
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v2/surveys` | List all surveys |
| GET | `/api/v2/surveys/:id` | Get full survey with data |
| GET | `/api/v2/surveys/:id/export/csv` | Export as CSV |
| GET | `/api/v2/surveys/:id/export/json` | Export as JSON |
| GET | `/api/v2/surveys/:id/export/report` | Export as text report |
| GET | `/api/v2/surveys/:id/export/summary` | Export summary stats |

## Project Structure

```
survey-app/
├── docker-compose.yml          # Service orchestration
├── .gitignore
├── README.md
├── backend/
│   ├── main.go                 # Entry point, routes, CORS
│   ├── go.mod                  # Go dependencies
│   ├── Dockerfile              # Production image
│   ├── .env.example
│   ├── models/models.go        # Data structures
│   ├── repository/survey.go    # Database operations
│   ├── handlers/
│   │   ├── survey.go           # Survey endpoints
│   │   └── export.go           # Export endpoints
│   ├── services/export.go      # Export logic (CSV, JSON, report)
│   └── migrations/
│       ├── 001_init_schema.sql # Database schema
│       └── 002_sample_data.sql # Sample data
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile.dev
    ├── .env.example
    ├── public/index.html
    └── src/
        ├── index.tsx
        ├── App.tsx             # Routing, theme
        ├── types/survey.ts     # TypeScript interfaces
        ├── services/surveyAPI.ts
        ├── pages/
        │   ├── SurveyList.tsx
        │   └── SurveyDashboard.tsx
        └── components/
            ├── QuestionChart.tsx
            └── ExportMenu.tsx
```

## Development

### Without Docker

```bash
# Backend (requires Go 1.21+ and PostgreSQL running)
cd backend
cp .env.example .env
go run main.go

# Frontend (requires Node 18+)
cd frontend
cp .env.example .env
npm install
npm start
```

### Database Access

```bash
# Via Docker
docker-compose exec postgres psql -U postgres -d survey_db

# Direct
psql -U postgres -d survey_db
```

## Stopping

```bash
docker-compose down          # Stop services
docker-compose down -v       # Stop and remove data volumes
```
