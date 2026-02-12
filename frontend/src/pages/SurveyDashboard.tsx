import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Alert, Box,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { fetchSurvey } from '../services/surveyAPI';
import { SurveyResponseV2 } from '../types/survey';
import QuestionChart from '../components/QuestionChart';
import ExportMenu from '../components/ExportMenu';

export default function SurveyDashboard() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<SurveyResponseV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchSurvey(parseInt(id))
      .then(setSurvey)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !survey) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Survey not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">{survey.title}</Typography>
          <Typography variant="body1" color="text.secondary">
            {survey.description}
          </Typography>
        </Box>
        <ExportMenu surveyId={survey.id} />
      </Box>

      {survey.categories.map((category, catIdx) => (
        <Accordion key={catIdx} defaultExpanded={catIdx === 0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">{category.title}</Typography>
            <Chip
              label={`${category.subcategories.reduce((acc, sub) => acc + sub.questions.length, 0)} questions`}
              size="small"
              sx={{ ml: 2 }}
            />
          </AccordionSummary>
          <AccordionDetails>
            {category.subcategories.map((sub, subIdx) => (
              <Accordion key={subIdx} defaultExpanded={subIdx === 0} variant="outlined" sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {sub.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {sub.questions.map((question) => (
                    <QuestionChart key={question.qid} question={question} />
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
}
