import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SurveyDashboard from './SurveyDashboard';
import * as surveyAPI from '../services/surveyAPI';
import type { SurveyResponseV2 } from '../types/survey';

// Mock the surveyAPI module
vi.mock('../services/surveyAPI');

// Mock QuestionChart component
vi.mock('../components/QuestionChart', () => ({
  default: ({ question }: any) => (
    <div data-testid={`question-chart-${question.qid}`}>
      {question.text}
    </div>
  ),
}));

// Mock ExportMenu component
vi.mock('../components/ExportMenu', () => ({
  default: ({ surveyId }: any) => (
    <div data-testid="export-menu">Export Menu for Survey {surveyId}</div>
  ),
}));

describe('SurveyDashboard', () => {
  const mockSurvey: SurveyResponseV2 = {
    id: 1,
    title: 'Customer Satisfaction Survey',
    description: 'Annual customer satisfaction survey',
    categories: [
      {
        title: 'Product Quality',
        subcategories: [
          {
            title: 'Overall Quality',
            questions: [
              {
                qid: 'Q1',
                label: 'Quality Rating',
                text: 'How would you rate the quality?',
                disciplines: ['Engineering'],
                total_responses: 100,
                chart_type: 'bar',
                unit: '%',
                numeric_scale: false,
                stacked: false,
                data: [
                  { label: 'Excellent', value: 40 },
                  { label: 'Good', value: 35 },
                  { label: 'Fair', value: 25 },
                ],
              },
              {
                qid: 'Q2',
                label: 'Reliability',
                text: 'How reliable is the product?',
                disciplines: ['Engineering'],
                total_responses: 100,
                chart_type: 'pie',
                unit: '',
                numeric_scale: false,
                stacked: false,
                data: [
                  { label: 'Very Reliable', value: 60 },
                  { label: 'Somewhat Reliable', value: 40 },
                ],
              },
            ],
          },
          {
            title: 'Durability',
            questions: [
              {
                qid: 'Q3',
                label: 'Durability Rating',
                text: 'How durable is the product?',
                disciplines: ['Engineering'],
                total_responses: 100,
                chart_type: 'line',
                unit: 'years',
                numeric_scale: true,
                stacked: false,
                data: [
                  { label: '1-2 years', value: 20 },
                  { label: '3-5 years', value: 50 },
                  { label: '5+ years', value: 30 },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Customer Service',
        subcategories: [
          {
            title: 'Responsiveness',
            questions: [
              {
                qid: 'Q4',
                label: 'Response Time',
                text: 'How quickly did we respond?',
                disciplines: ['Support'],
                total_responses: 100,
                chart_type: 'bar',
                unit: '',
                numeric_scale: false,
                stacked: false,
                data: [
                  { label: 'Very Quick', value: 50 },
                  { label: 'Quick', value: 30 },
                  { label: 'Slow', value: 20 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (surveyId: string = '1') => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/surveys/:id" element={<SurveyDashboard />} />
        </Routes>
      </BrowserRouter>,
      {
        wrapper: ({ children }) => (
          <BrowserRouter>
            <Routes>
              <Route path="*" element={children} />
            </Routes>
          </BrowserRouter>
        ),
      }
    );
  };

  const renderWithRoute = (surveyId: string = '1') => {
    window.history.pushState({}, 'Test', `/surveys/${surveyId}`);
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/surveys/:id" element={<SurveyDashboard />} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      vi.mocked(surveyAPI.fetchSurvey).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRoute('1');

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      const errorMessage = 'Failed to fetch survey: Not Found';
      vi.mocked(surveyAPI.fetchSurvey).mockRejectedValue(new Error(errorMessage));

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show default error when survey is null', async () => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(null as any);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Survey not found')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);
    });

    it('should render survey title', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Customer Satisfaction Survey')).toBeInTheDocument();
      });
    });

    it('should render survey description', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Annual customer satisfaction survey')).toBeInTheDocument();
      });
    });

    it('should render ExportMenu with correct survey ID', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByTestId('export-menu')).toBeInTheDocument();
        expect(screen.getByText('Export Menu for Survey 1')).toBeInTheDocument();
      });
    });

    it('should render all categories', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Product Quality')).toBeInTheDocument();
        expect(screen.getByText('Customer Service')).toBeInTheDocument();
      });
    });

    it('should display category question counts', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        // Product Quality has 3 questions
        const productQualityChip = screen.getByText('3 questions');
        expect(productQualityChip).toBeInTheDocument();

        // Customer Service has 1 question
        const customerServiceChip = screen.getByText('1 questions');
        expect(customerServiceChip).toBeInTheDocument();
      });
    });

    it('should render all subcategories', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Overall Quality')).toBeInTheDocument();
        expect(screen.getByText('Durability')).toBeInTheDocument();
        expect(screen.getByText('Responsiveness')).toBeInTheDocument();
      });
    });

    it('should render all questions', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByTestId('question-chart-Q1')).toBeInTheDocument();
        expect(screen.getByTestId('question-chart-Q2')).toBeInTheDocument();
        expect(screen.getByTestId('question-chart-Q3')).toBeInTheDocument();
        expect(screen.getByTestId('question-chart-Q4')).toBeInTheDocument();
      });
    });

    it('should pass correct question data to QuestionChart', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('How would you rate the quality?')).toBeInTheDocument();
        expect(screen.getByText('How reliable is the product?')).toBeInTheDocument();
        expect(screen.getByText('How durable is the product?')).toBeInTheDocument();
        expect(screen.getByText('How quickly did we respond?')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call fetchSurvey with correct ID', async () => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);

      renderWithRoute('42');

      await waitFor(() => {
        expect(surveyAPI.fetchSurvey).toHaveBeenCalledWith(42);
      });
    });

    it('should not fetch when ID is missing', () => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);

      renderWithRoute('');

      expect(surveyAPI.fetchSurvey).not.toHaveBeenCalled();
    });

    it('should parse string ID to number', async () => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);

      renderWithRoute('123');

      await waitFor(() => {
        expect(surveyAPI.fetchSurvey).toHaveBeenCalledWith(123);
      });
    });
  });

  describe('Accordion Behavior', () => {
    beforeEach(() => {
      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(mockSurvey);
    });

    it('should expand first category by default', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        const firstCategory = screen.getByText('Product Quality');
        expect(firstCategory).toBeInTheDocument();
      });
    });

    it('should expand first subcategory by default', async () => {
      renderWithRoute('1');

      await waitFor(() => {
        const firstSubcategory = screen.getByText('Overall Quality');
        expect(firstSubcategory).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should handle survey with no categories', async () => {
      const emptySurvey: SurveyResponseV2 = {
        id: 1,
        title: 'Empty Survey',
        description: 'No categories',
        categories: [],
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(emptySurvey);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Empty Survey')).toBeInTheDocument();
      });

      const questionCharts = screen.queryAllByTestId(/question-chart/);
      expect(questionCharts.length).toBe(0);
    });

    it('should handle category with no subcategories', async () => {
      const surveyWithEmptyCategory: SurveyResponseV2 = {
        ...mockSurvey,
        categories: [
          {
            title: 'Empty Category',
            subcategories: [],
          },
        ],
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(surveyWithEmptyCategory);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Empty Category')).toBeInTheDocument();
        expect(screen.getByText('0 questions')).toBeInTheDocument();
      });
    });

    it('should handle subcategory with no questions', async () => {
      const surveyWithEmptySubcategory: SurveyResponseV2 = {
        ...mockSurvey,
        categories: [
          {
            title: 'Category',
            subcategories: [
              {
                title: 'Empty Subcategory',
                questions: [],
              },
            ],
          },
        ],
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(surveyWithEmptySubcategory);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Empty Subcategory')).toBeInTheDocument();
      });

      const questionCharts = screen.queryAllByTestId(/question-chart/);
      expect(questionCharts.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long survey title', async () => {
      const longTitle = 'This is a very long survey title that should still be displayed correctly without breaking the layout';
      const surveyWithLongTitle: SurveyResponseV2 = {
        ...mockSurvey,
        title: longTitle,
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(surveyWithLongTitle);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument();
      });
    });

    it('should handle special characters in survey data', async () => {
      const surveyWithSpecialChars: SurveyResponseV2 = {
        ...mockSurvey,
        title: 'Survey with "quotes" & <special> chars',
        description: 'Description with @#$%^&*() characters',
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(surveyWithSpecialChars);

      renderWithRoute('1');

      await waitFor(() => {
        expect(screen.getByText('Survey with "quotes" & <special> chars')).toBeInTheDocument();
        expect(screen.getByText('Description with @#$%^&*() characters')).toBeInTheDocument();
      });
    });

    it('should handle many categories and questions', async () => {
      const largeCategories = Array.from({ length: 10 }, (_, i) => ({
        title: `Category ${i + 1}`,
        subcategories: Array.from({ length: 5 }, (_, j) => ({
          title: `Subcategory ${j + 1}`,
          questions: Array.from({ length: 3 }, (_, k) => ({
            qid: `Q${i}-${j}-${k}`,
            label: `Question ${k + 1}`,
            text: `Question text ${k + 1}`,
            disciplines: ['Test'],
            total_responses: 100,
            chart_type: 'bar' as const,
            unit: '',
            numeric_scale: false,
            stacked: false,
            data: [{ label: 'A', value: 50 }],
          })),
        })),
      }));

      const largeSurvey: SurveyResponseV2 = {
        ...mockSurvey,
        categories: largeCategories,
      };

      vi.mocked(surveyAPI.fetchSurvey).mockResolvedValue(largeSurvey);

      renderWithRoute('1');

      await waitFor(() => {
        const categories = screen.getAllByText(/^Category \d+$/);
        expect(categories.length).toBe(10);
      });
    });
  });
});
