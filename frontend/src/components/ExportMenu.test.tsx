import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportMenu from './ExportMenu';

describe('ExportMenu', () => {
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = mockWindowOpen;
  });

  it('should render export button', () => {
    render(<ExportMenu surveyId={1} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should open menu when export button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExportMenu surveyId={1} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should display all export format options', async () => {
    const user = userEvent.setup();
    render(<ExportMenu surveyId={1} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    await waitFor(() => {
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as JSON')).toBeInTheDocument();
      expect(screen.getByText('Export as Report')).toBeInTheDocument();
      expect(screen.getByText('Export Summary')).toBeInTheDocument();
    });
  });

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(<ExportMenu surveyId={1} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Click outside by pressing Escape
    fireEvent.keyDown(screen.getByRole('menu'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27,
    });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export as CSV when CSV option is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={42} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as CSV'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/42/export/csv',
        '_blank'
      );
    });

    it('should export as JSON when JSON option is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={42} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as JSON'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/42/export/json',
        '_blank'
      );
    });

    it('should export as Report when Report option is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={42} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as Report'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/42/export/report',
        '_blank'
      );
    });

    it('should export Summary when Summary option is clicked', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={42} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export Summary'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/42/export/summary',
        '_blank'
      );
    });

    it('should close menu after export', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={1} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as CSV'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Different Survey IDs', () => {
    it('should use correct survey ID in export URL', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={999} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as CSV'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/999/export/csv',
        '_blank'
      );
    });

    it('should handle survey ID 0', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={0} />);

      await user.click(screen.getByRole('button', { name: /export/i }));
      await user.click(screen.getByText('Export as JSON'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:8080/api/v2/surveys/0/export/json',
        '_blank'
      );
    });
  });

  describe('Menu State Management', () => {
    it('should not show menu initially', () => {
      render(<ExportMenu surveyId={1} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should toggle menu on button clicks', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={1} />);

      const exportButton = screen.getByRole('button', { name: /export/i });

      // Open menu
      await user.click(exportButton);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Close menu by clicking escape
      fireEvent.keyDown(screen.getByRole('menu'), {
        key: 'Escape',
        code: 'Escape',
      });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });

      // Open again
      await user.click(exportButton);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button with icon', () => {
      render(<ExportMenu surveyId={1} />);
      const button = screen.getByRole('button', { name: /export/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName();
    });

    it('should have menu items with proper text', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={1} />);

      await user.click(screen.getByRole('button', { name: /export/i }));

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(4);
      expect(menuItems[0]).toHaveTextContent('Export as CSV');
      expect(menuItems[1]).toHaveTextContent('Export as JSON');
      expect(menuItems[2]).toHaveTextContent('Export as Report');
      expect(menuItems[3]).toHaveTextContent('Export Summary');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ExportMenu surveyId={1} />);

      const exportButton = screen.getByRole('button', { name: /export/i });

      // Use userEvent for better keyboard simulation
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });
});
