import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TodayScreen } from '../components/screens/TodayScreen';
import { ReviewScreen } from '../components/screens/ReviewScreen';

describe('S05 Today and S07 Review Screens', () => {
  it('displays active experiment on Today view with honest non-judgmental status', () => {
    const onGoCheckin = vi.fn();
    render(
      <TodayScreen
        activeExperiment={{
          action: 'Từ chối làm thêm giờ sau 18h',
          learningQuestion: 'Phản ứng của quản lý ra sao?',
          reviewDate: '2026-11-18'
        }}
        onGoCheckin={onGoCheckin}
      />
    );

    expect(screen.getByText(/Từ chối làm thêm giờ sau 18h/i)).toBeInTheDocument();
    const checkinBtn = screen.getByRole('button', { name: /Ghi nhận hôm nay/i });
    fireEvent.click(checkinBtn);
    expect(onGoCheckin).toHaveBeenCalled();
  });

  it('completes review with facts, learning and non-coercive next action', () => {
    const onFinish = vi.fn();
    render(<ReviewScreen onFinishReview={onFinish} />);

    fireEvent.change(screen.getByPlaceholderText(/Điều gì đã diễn ra trong những ngày thử\?/i), {
      target: { value: 'Quản lý không hài lòng lúc đầu nhưng công việc vẫn ổn' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu nhìn lại/i }));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
      facts: expect.any(String),
      nextAction: expect.any(String)
    }));
  });
});
