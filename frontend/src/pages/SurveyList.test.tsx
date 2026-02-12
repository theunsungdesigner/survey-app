import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SurveyList from './SurveyList';
import * as surveyAPI from '../services/surveyAPI';
import type { SurveySummary } from '../types/survey';

// Mock the surveyAPI module
vi.mock('../services/surveyAPI');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SurveyList', () => {
  const mockSurveys: SurveySummary[] = [
    {
      id: 1,
      title: 'Customer Satisfaction Survey',
      description: 'Annual customer satisfaction survey',
      question_count: 15,
    },
    {
      id: 2,
      title: 'Employee Engagement Survey',
      description: 'Quarterly employee engagement survey',
      question_count: 20,
    },
    {
      id: 3,
      title: 'Product Feedback Survey',
      description: 'Collect feedback on our new product',
      question_count: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SurveyList />
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      vi.mocked(surveyAPI.fetchSurveys).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(mockSurveys);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      const errorMessage = 'Failed to fetch surveys: Server Error';
      vi.mocked(surveyAPI.fetchSurveys).mockRejectedValue(new Error(errorMessage));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should not show loading spinner in error state', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockRejectedValue(new Error('Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(mockSurveys);
    });

    it('should render page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Surveys')).toBeInTheDocument();
      });
    });

    it('should render all surveys', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Customer Satisfaction Survey')).toBeInTheDocument();
        expect(screen.getByText('Employee Engagement Survey')).toBeInTheDocument();
        expect(screen.getByText('Product Feedback Survey')).toBeInTheDocument();
      });
    });

    it('should display survey descriptions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Annual customer satisfaction survey')).toBeInTheDocument();
        expect(screen.getByText('Quarterly employee engagement survey')).toBeInTheDocument();
        expect(screen.getByText('Collect feedback on our new product')).toBeInTheDocument();
      });
    });

    it('should display question counts', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('15 questions')).toBeInTheDocument();
        expect(screen.getByText('20 questions')).toBeInTheDocument();
        expect(screen.getByText('10 questions')).toBeInTheDocument();
      });
    });

    it('should render surveys in grid layout', async () => {
      renderComponent();

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards.length).toBe(mockSurveys.length);
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(mockSurveys);
    });

    it('should navigate to survey detail when card is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Customer Satisfaction Survey')).toBeInTheDocument();
      });

      const firstCard = screen.getByText('Customer Satisfaction Survey').closest('button');
      if (firstCard) {
        await user.click(firstCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/surveys/1');
    });

    it('should navigate with correct survey ID', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Product Feedback Survey')).toBeInTheDocument();
      });

      const card = screen.getByText('Product Feedback Survey').closest('button');
      if (card) {
        await user.click(card);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/surveys/3');
    });
  });

  describe('Empty State', () => {
    it('should handle empty survey list', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Surveys')).toBeInTheDocument();
      });

      const cards = screen.queryAllByRole('button');
      expect(cards.length).toBe(0);
    });
  });

  describe('API Integration', () => {
    it('should call fetchSurveys on mount', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(mockSurveys);

      renderComponent();

      await waitFor(() => {
        expect(surveyAPI.fetchSurveys).toHaveBeenCalledTimes(1);
      });
    });

    it('should only fetch surveys once', async () => {
      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(mockSurveys);

      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Surveys')).toBeInTheDocument();
      });

      rerender(
        <BrowserRouter>
          <SurveyList />
        </BrowserRouter>
      );

      // Should still only be called once because of the empty dependency array
      expect(surveyAPI.fetchSurveys).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle survey with zero questions', async () => {
      const surveysWithZero: SurveySummary[] = [
        {
          id: 1,
          title: 'Empty Survey',
          description: 'No questions yet',
          question_count: 0,
        },
      ];

      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(surveysWithZero);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('0 questions')).toBeInTheDocument();
      });
    });

    it('should handle very long titles', async () => {
      const longTitle = 'This is a very long survey title that should still be displayed correctly without breaking the layout or causing any issues';
      const surveysWithLongTitle: SurveySummary[] = [
        {
          id: 1,
          title: longTitle,
          description: 'Description',
          question_count: 5,
        },
      ];

      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(surveysWithLongTitle);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument();
      });
    });

    it('should handle special characters in survey data', async () => {
      const specialSurveys: SurveySummary[] = [
        {
          id: 1,
          title: 'Survey with "quotes" & special <chars>',
          description: 'Description with special chars: @#$%^&*()',
          question_count: 5,
        },
      ];

      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(specialSurveys);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Survey with "quotes" & special <chars>')).toBeInTheDocument();
        expect(screen.getByText('Description with special chars: @#$%^&*()')).toBeInTheDocument();
      });
    });

    it('should handle single survey', async () => {
      const singleSurvey: SurveySummary[] = [mockSurveys[0]];

      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(singleSurvey);

      renderComponent();

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards.length).toBe(1);
      });
    });

    it('should handle many surveys', async () => {
      const manySurveys: SurveySummary[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Survey ${i + 1}`,
        description: `Description ${i + 1}`,
        question_count: i + 1,
      }));

      vi.mocked(surveyAPI.fetchSurveys).mockResolvedValue(manySurveys);

      renderComponent();

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards.length).toBe(50);
      });
    });
  });
});
