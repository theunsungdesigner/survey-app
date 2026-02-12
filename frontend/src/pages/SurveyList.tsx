import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, CardContent, CardActionArea,
  Typography, CircularProgress, Alert, Box, Chip
} from '@mui/material';
import { QuestionAnswer } from '@mui/icons-material';
import { fetchSurveys } from '../services/surveyAPI';
import { SurveySummary } from '../types/survey';

export default function SurveyList() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveys()
      .then(setSurveys)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Surveys
      </Typography>
      <Grid container spacing={3}>
        {surveys.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.id}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(`/surveys/${survey.id}`)} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {survey.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {survey.description}
                  </Typography>
                  <Chip
                    icon={<QuestionAnswer />}
                    label={`${survey.question_count} questions`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
