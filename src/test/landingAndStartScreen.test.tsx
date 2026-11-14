import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingScreen } from '../components/screens/LandingScreen';
import { StartScreen } from '../components/screens/StartScreen';

describe('S01 Landing and S02 Start Screens', () => {
  it('renders landing with sample card and clear CTA without requiring auth', () => {
    const onStart = vi.fn();
    render(<LandingScreen onStart={onStart} />);

    expect(screen.getByText(/Đang mắc kẹt trước một lựa chọn\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Ví dụ minh họa/i)).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Làm rõ một lựa chọn/i });
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalled();
  });

  it('requires explicit consent checkbox before proceeding to AI chat in StartScreen', () => {
    const onSubmit = vi.fn();
    render(<StartScreen onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Điều gì đang khiến bạn phân vân\?/i);
    fireEvent.change(textarea, { target: { value: 'Tôi muốn đổi việc' } });

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu làm rõ/i });

    // Phải bị disable khi chưa tick checkbox đồng ý xử lý dữ liệu
    expect(submitBtn).toBeDisabled();

    // Tick checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith({
      scenarioId: expect.any(String),
      problemText: 'Tôi muốn đổi việc',
      consented: true
    });
  });
});
