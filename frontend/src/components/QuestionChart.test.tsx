import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuestionChart from './QuestionChart';
import type { QuestionDataV2 } from '../types/survey';

// Mock recharts to avoid SVG rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('QuestionChart', () => {
  const baseQuestion: QuestionDataV2 = {
    qid: 'Q1',
    label: 'Test Question',
    text: 'What is your favorite color?',
    disciplines: ['Engineering'],
    total_responses: 100,
    chart_type: 'bar',
    unit: '%',
    numeric_scale: false,
    stacked: false,
    data: [
      { label: 'Red', value: 30 },
      { label: 'Blue', value: 50 },
      { label: 'Green', value: 20 },
    ],
  };

  it('should render question text', () => {
    render(<QuestionChart question={baseQuestion} />);
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('should display chart type chip', () => {
    render(<QuestionChart question={baseQuestion} />);
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('should display total responses chip', () => {
    render(<QuestionChart question={baseQuestion} />);
    expect(screen.getByText('100 responses')).toBeInTheDocument();
  });

  it('should display unit chip when provided', () => {
    render(<QuestionChart question={baseQuestion} />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('should not display unit chip when not provided', () => {
    const questionWithoutUnit = { ...baseQuestion, unit: '' };
    render(<QuestionChart question={questionWithoutUnit} />);

    // Check that the unit chip is not present by checking text content
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  describe('Chart Types', () => {
    it('should render bar chart when chart_type is bar', () => {
      const question = { ...baseQuestion, chart_type: 'bar' };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render pie chart when chart_type is pie', () => {
      const question = { ...baseQuestion, chart_type: 'pie' };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render line chart when chart_type is line', () => {
      const question = { ...baseQuestion, chart_type: 'line' };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render area chart when chart_type is area', () => {
      const question = { ...baseQuestion, chart_type: 'area' };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should show error message for unknown chart type', () => {
      const question = { ...baseQuestion, chart_type: 'unknown' };
      render(<QuestionChart question={question} />);
      expect(screen.getByText('Unknown chart type: unknown')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle empty data array', () => {
      const question = { ...baseQuestion, data: [] };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const question = {
        ...baseQuestion,
        data: [{ label: 'Only Option', value: 100 }],
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle many data points', () => {
      const question = {
        ...baseQuestion,
        data: Array.from({ length: 20 }, (_, i) => ({
          label: `Option ${i + 1}`,
          value: Math.random() * 100,
        })),
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle data with custom colors', () => {
      const question = {
        ...baseQuestion,
        chart_type: 'pie',
        data: [
          { label: 'Red', value: 30, color: '#ff0000' },
          { label: 'Blue', value: 50, color: '#0000ff' },
          { label: 'Green', value: 20, color: '#00ff00' },
        ],
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Question Properties', () => {
    it('should render with all optional properties', () => {
      const question: QuestionDataV2 = {
        ...baseQuestion,
        groupid: 'group1',
        question_text_grouped: 'Grouped question text',
        answer_text_grouped: 'Grouped answer text',
        answer_order_grouped: 1,
        order: '2',
        multi_select: true,
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByText(question.text)).toBeInTheDocument();
    });

    it('should handle numeric_scale true', () => {
      const question = { ...baseQuestion, numeric_scale: true };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle stacked true', () => {
      const question = { ...baseQuestion, stacked: true };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle multiple disciplines', () => {
      const question = {
        ...baseQuestion,
        disciplines: ['Engineering', 'Design', 'Marketing'],
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByText(question.text)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render ResponsiveContainer for all chart types', () => {
      const chartTypes = ['bar', 'pie', 'line', 'area'];

      chartTypes.forEach(type => {
        const { unmount } = render(
          <QuestionChart question={{ ...baseQuestion, chart_type: type }} />
        );
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero responses', () => {
      const question = { ...baseQuestion, total_responses: 0 };
      render(<QuestionChart question={question} />);
      expect(screen.getByText('0 responses')).toBeInTheDocument();
    });

    it('should handle very large response count', () => {
      const question = { ...baseQuestion, total_responses: 999999 };
      render(<QuestionChart question={question} />);
      expect(screen.getByText('999999 responses')).toBeInTheDocument();
    });

    it('should handle long question text', () => {
      const longText = 'This is a very long question text that should still be rendered correctly '.repeat(5);
      const question = { ...baseQuestion, text: longText };
      render(<QuestionChart question={question} />);
      // Use a partial match since the full text is very long
      expect(screen.getByText(/This is a very long question text that should still be rendered correctly/)).toBeInTheDocument();
    });

    it('should handle special characters in question text', () => {
      const question = {
        ...baseQuestion,
        text: 'What is your favorite "color" & how did you choose it?',
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByText(question.text)).toBeInTheDocument();
    });

    it('should handle data with zero values', () => {
      const question = {
        ...baseQuestion,
        data: [
          { label: 'Red', value: 0 },
          { label: 'Blue', value: 50 },
          { label: 'Green', value: 0 },
        ],
      };
      render(<QuestionChart question={question} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});
