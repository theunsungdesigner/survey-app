-- 002_sample_data.sql
-- Sample survey data for development

INSERT INTO surveys (id, title, description) VALUES
(1, 'Customer Satisfaction Survey', 'Annual customer satisfaction and feedback survey covering product quality, service, and overall experience.');

-- Categories
INSERT INTO categories (id, survey_id, title, sort_order) VALUES
(1, 1, 'Product Experience', 1),
(2, 1, 'Service Quality', 2);

-- Subcategories
INSERT INTO subcategories (id, category_id, title, sort_order) VALUES
(1, 1, 'Overall Satisfaction', 1),
(2, 1, 'Feature Usage', 2),
(3, 2, 'Support Experience', 1);

-- Questions with chart data
INSERT INTO questions (subcategory_id, qid, label, text, disciplines, total_responses, chart_type, unit, numeric_scale, stacked, sort_order, question_data) VALUES
(1, 'Q1', 'Overall Rating', 'How would you rate your overall experience?',
 '["All Respondents"]', 1250, 'pie', '', false, false, '1.1.1',
 '[{"label":"Very Satisfied","value":45,"color":"#4CAF50"},{"label":"Satisfied","value":30,"color":"#8BC34A"},{"label":"Neutral","value":15,"color":"#FFC107"},{"label":"Dissatisfied","value":7,"color":"#FF9800"},{"label":"Very Dissatisfied","value":3,"color":"#F44336"}]'
),
(1, 'Q2', 'NPS Score', 'How likely are you to recommend us to a friend or colleague?',
 '["All Respondents"]', 1180, 'bar', 'score', true, false, '1.1.2',
 '[{"label":"0","value":2},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":8},{"label":"6","value":12},{"label":"7","value":18},{"label":"8","value":22},{"label":"9","value":15},{"label":"10","value":13}]'
),
(2, 'Q3', 'Feature Importance', 'Which features do you use most frequently?',
 '["Power Users", "Regular Users"]', 980, 'bar', '', false, false, '1.2.1',
 '[{"label":"Dashboard","value":78},{"label":"Reports","value":65},{"label":"Analytics","value":52},{"label":"Export","value":45},{"label":"API","value":32},{"label":"Integrations","value":28}]'
),
(2, 'Q4', 'Usage Trend', 'Monthly active usage over the past year',
 '["All Respondents"]', 1100, 'line', 'users', false, false, '1.2.2',
 '[{"label":"Jan","value":450},{"label":"Feb","value":520},{"label":"Mar","value":580},{"label":"Apr","value":610},{"label":"May","value":670},{"label":"Jun","value":720},{"label":"Jul","value":690},{"label":"Aug","value":750},{"label":"Sep","value":810},{"label":"Oct","value":880},{"label":"Nov","value":920},{"label":"Dec","value":1050}]'
),
(3, 'Q5', 'Support Rating', 'How would you rate the support you received?',
 '["Support Users"]', 640, 'area', '', false, false, '2.1.1',
 '[{"label":"Q1 2023","value":3.2},{"label":"Q2 2023","value":3.5},{"label":"Q3 2023","value":3.8},{"label":"Q4 2023","value":4.1},{"label":"Q1 2024","value":4.3},{"label":"Q2 2024","value":4.5}]'
),
(3, 'Q6', 'Response Time', 'Average support response time satisfaction',
 '["Support Users"]', 580, 'pie', '', false, false, '2.1.2',
 '[{"label":"Under 1 hour","value":35,"color":"#2196F3"},{"label":"1-4 hours","value":28,"color":"#03A9F4"},{"label":"4-8 hours","value":20,"color":"#00BCD4"},{"label":"8-24 hours","value":12,"color":"#FF9800"},{"label":"Over 24 hours","value":5,"color":"#F44336"}]'
);
