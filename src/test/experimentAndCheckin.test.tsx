import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExperimentDesignScreen } from '../components/screens/ExperimentDesignScreen';
import { CheckinScreen } from '../components/screens/CheckinScreen';

describe('S04 Experiment Design and S06 Daily Checkin', () => {
  it('enforces duration selection of 1, 3 or 7 days (default 3)', () => {
    const onStart = vi.fn();
    render(<ExperimentDesignScreen onStartExperiment={onStart} />);

    expect(screen.getByDisplayValue('3 ngày (Mặc định)')).toBeInTheDocument();
  });

  it('allows daily check-in submission with status, note, and optional energy', () => {
    const onSubmit = vi.fn();
    render(<CheckinScreen onSubmitCheckin={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Đã thử/i }));
    fireEvent.change(screen.getByPlaceholderText(/Điều gì đã xảy ra\?/i), {
      target: { value: 'Hôm nay mình đã từ chối nhận thêm việc ngoài giờ' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu ghi nhận/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      status: 'TRIED',
      note: 'Hôm nay mình đã từ chối nhận thêm việc ngoài giờ',
      energy: null
    });
  });
});
