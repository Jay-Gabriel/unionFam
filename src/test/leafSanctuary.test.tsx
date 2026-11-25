import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeafIntroOverlay } from '../components/intro/LeafIntroOverlay';
import { LandingScreen } from '../components/screens/LandingScreen';
import { DecisionChatScreen } from '../components/screens/DecisionChatScreen';

describe('UnionFam 3D Leaf Sanctuary & Anti-ChatGPT Flow', () => {
  it('renders LeafIntroOverlay and allows skipping smoothly', () => {
    const onClose = vi.fn();
    render(<LeafIntroOverlay isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: /Video giới thiệu Chiếc Lá/i })).toBeInTheDocument();
    const skipBtn = screen.getByRole('button', { name: /Bỏ qua/i });
    fireEvent.click(skipBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders LandingScreen with 3D icons and intro replay trigger', () => {
    const onStart = vi.fn();
    const onReplayIntro = vi.fn();
    render(<LandingScreen onStart={onStart} onReplayIntro={onReplayIntro} />);

    expect(screen.getByText(/Đang mắc kẹt trước một lựa chọn/i)).toBeInTheDocument();
    expect(screen.getByAltText(/La bàn 3D làm rõ/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Mầm non 3D thử nhỏ/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Gương soi 3D nhìn lại/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xem video Chiếc Lá/i }));
    expect(onReplayIntro).toHaveBeenCalledTimes(1);
  });

  it('supports inline criteria editing and AI proposal acceptance on DecisionChatScreen', async () => {
    const onDesignExperiment = vi.fn();
    render(<DecisionChatScreen onDesignExperiment={onDesignExperiment} />);

    // Add a custom criterion directly on the 3D decision card
    const addInput = screen.getByPlaceholderText('+ Thêm điều bạn coi trọng...');
    fireEvent.change(addInput, { target: { value: 'Có thời gian cho gia đình' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm điều quan trọng' }));
    expect(screen.getByText(/Có thời gian cho gia đình/i)).toBeInTheDocument();
    expect(screen.getByText('r2')).toBeInTheDocument();

    // Click a mood stone to trigger AI reflection + proposal
    fireEvent.click(screen.getByRole('button', { name: /Mình sợ chọn sai/i }));

    await waitFor(() => {
      expect(screen.getByText(/ĐỀ XUẤT MỚI TỪ CHIẾC LÁ/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Đúng với tôi/i }));
    expect(screen.getByText('r3')).toBeInTheDocument();
  });

  it('locks chat input when crisis safety guardrail triggers', async () => {
    const onDesignExperiment = vi.fn();
    render(<DecisionChatScreen onDesignExperiment={onDesignExperiment} />);

    const chatInput = screen.getByPlaceholderText('Nhập chia sẻ của bạn...');
    fireEvent.change(chatInput, { target: { value: 'Mình thấy bế tắc quá và không muốn sống nữa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/1900 636 789/i);
    });

    const lockedInput = screen.getByPlaceholderText(/Phiên trò chuyện đã khóa/i);
    expect(lockedInput).toBeDisabled();
  });

  it('supports gentle Leaf voice toggle and mobile pane switcher on DecisionChatScreen', () => {
    const onDesignExperiment = vi.fn();
    render(<DecisionChatScreen onDesignExperiment={onDesignExperiment} />);

    // Voice toggle switches gently between Giọng lá and Tắt giọng
    const voiceBtn = screen.getByRole('button', { name: /Bật giọng lá/i });
    expect(voiceBtn).toHaveTextContent(/Giọng lá/i);
    fireEvent.click(voiceBtn);
    expect(screen.getByRole('button', { name: /Tắt giọng lá/i })).toHaveTextContent(/Tắt giọng/i);

    // Per-message gentle voice trigger renders
    expect(screen.getAllByRole('button', { name: /Nghe nhẹ đoạn này/i }).length).toBeGreaterThan(0);

    // Mobile tab switcher toggles active pressed state cleanly
    const chatTab = screen.getByRole('button', { name: /^Phản chiếu$/i });
    const cardTab = screen.getByRole('button', { name: /Thẻ \(1\)/i });
    expect(chatTab).toHaveAttribute('aria-pressed', 'true');
    expect(cardTab).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(cardTab);
    expect(cardTab).toHaveAttribute('aria-pressed', 'true');
    expect(chatTab).toHaveAttribute('aria-pressed', 'false');
  });
});
