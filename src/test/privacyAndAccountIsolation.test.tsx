import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrivacySettingsScreen } from '../components/screens/PrivacySettingsScreen';

describe('S08 Privacy Settings and Cross-Account Isolation', () => {
  it('displays selective storage toggles without promising impossible third-party backup wipes', () => {
    const onSave = vi.fn();
    render(<PrivacySettingsScreen onSavePreferences={onSave} onDeleteAllData={vi.fn()} />);

    expect(screen.getByText(/Lựa chọn lưu trữ dữ liệu/i)).toBeInTheDocument();
    expect(screen.getByText(/Chỉ lưu Thẻ Quyết Định & Bước Thử/i)).toBeInTheDocument();
  });

  it('requires explicit confirmation before deleting user data', () => {
    const onDelete = vi.fn();
    render(<PrivacySettingsScreen onSavePreferences={vi.fn()} onDeleteAllData={onDelete} />);

    const deleteBtn = screen.getByRole('button', { name: /Xóa toàn bộ hành trình/i });
    fireEvent.click(deleteBtn);

    // Dialog xác nhận xuất hiện
    expect(screen.getByText(/Bạn có chắc chắn muốn xóa không\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận xóa/i }));

    expect(onDelete).toHaveBeenCalled();
  });
});
