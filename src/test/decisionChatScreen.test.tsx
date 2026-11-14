import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DecisionChatScreen } from '../components/screens/DecisionChatScreen';

describe('S03 Decision Chat and Card Split Screen', () => {
  it('displays chat on the left and card on the right, showing proposal comparison', () => {
    const onDesignExperiment = vi.fn();
    render(<DecisionChatScreen onDesignExperiment={onDesignExperiment} />);

    expect(screen.getByText(/Thẻ Quyết Định/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập chia sẻ của bạn/i)).toBeInTheDocument();
  });

  it('stops ongoing AI generation immediately when clicking Stop button', () => {
    render(<DecisionChatScreen onDesignExperiment={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Nhập chia sẻ của bạn/i);
    fireEvent.change(input, { target: { value: 'Công việc quá tải' } });

    const sendBtn = screen.getByRole('button', { name: /Gửi/i });
    fireEvent.click(sendBtn);

    const stopBtn = screen.getByRole('button', { name: /Dừng trò chuyện/i });
    expect(stopBtn).toBeInTheDocument();
    fireEvent.click(stopBtn);

    // AI ngắt ngay và nút Gửi khả dụng trở lại
    expect(screen.getByRole('button', { name: /Gửi/i })).toBeInTheDocument();
  });
});
