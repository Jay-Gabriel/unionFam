import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

describe('App Router Integration', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders LandingScreen when route is /', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText(/Đang mắc kẹt trước một lựa chọn\?/i)).toBeInTheDocument();
  });

  it('renders StartScreen when route is /start', () => {
    window.history.pushState({}, '', '/start');
    render(<App />);
    expect(screen.getByText(/Bắt đầu một lựa chọn/i)).toBeInTheDocument();
  });

  it('renders TodayScreen when route is /today', () => {
    window.history.pushState({}, '', '/today');
    render(<App />);
    expect(screen.getByRole('heading', { name: /Hôm nay/i })).toBeInTheDocument();
  });

  it('renders PrivacySettingsScreen when route is /settings/privacy', () => {
    window.history.pushState({}, '', '/settings/privacy');
    render(<App />);
    expect(screen.getByText(/Lựa chọn lưu trữ dữ liệu/i)).toBeInTheDocument();
  });
});
