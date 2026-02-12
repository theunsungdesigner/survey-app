-- 001_init_schema.sql
-- Survey Dashboard Database Schema

CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    qid VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    disciplines JSONB DEFAULT '[]',
    total_responses BIGINT DEFAULT 0,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'bar',
    unit VARCHAR(50) DEFAULT '',
    numeric_scale BOOLEAN DEFAULT false,
    stacked BOOLEAN DEFAULT false,
    group_id VARCHAR(50),
    question_text_grouped TEXT,
    answer_text_grouped TEXT,
    answer_order_grouped BIGINT,
    sort_order VARCHAR(50) DEFAULT '0',
    multi_select BOOLEAN DEFAULT false,
    question_data JSONB DEFAULT '[]'
);

CREATE INDEX idx_categories_survey ON categories(survey_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_questions_subcategory ON questions(subcategory_id);
