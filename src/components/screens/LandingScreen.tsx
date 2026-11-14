import React from 'react';

export const LandingScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-12 max-w-4xl mx-auto flex flex-col gap-8">
      <header className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#254B3D]">
          Đang mắc kẹt trước một lựa chọn?
        </h1>
        <p className="text-lg text-[#182D26]/80 max-w-2xl mx-auto leading-relaxed">
          Cùng làm rõ điều quan trọng và chọn một bước nhỏ để thử trước khi quyết định.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <button
            onClick={onStart}
            className="min-h-[44px] px-8 py-3 bg-[#254B3D] text-[#F7F5EF] font-medium rounded-full hover:bg-[#182D26] transition shadow-sm"
          >
            Làm rõ một lựa chọn
          </button>
        </div>
      </header>

      {/* Thẻ ví dụ minh họa */}
      <section className="bg-[#E8EDE5] border border-[#BBC7BC] p-6 rounded-2xl space-y-3">
        <span className="text-xs uppercase font-semibold text-[#254B3D] px-2.5 py-1 bg-white/70 rounded-md">
          Ví dụ minh họa
        </span>
        <h3 className="font-semibold text-lg text-[#254B3D]">
          Nên ở lại và điều chỉnh công việc hay chuẩn bị chuyển việc?
        </h3>
        <p className="text-sm text-[#182D26]/80 leading-relaxed">
          Điều quan trọng: Sức khỏe tinh thần, đảm bảo thu nhập tối thiểu để chi trả sinh hoạt gia đình, không làm ngoài giờ kéo dài.
        </p>
        <div className="pt-2 flex gap-4 text-xs text-[#182D26]/70">
          <span>• Bước thử: 3 ngày trao đổi với quản lý</span>
          <span>• Nhìn lại: Sau 3 ngày</span>
        </div>
      </section>

      {/* 3 Bước giải thích đời thường */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl border border-[#BBC7BC] bg-white">
          <span className="text-xs font-bold text-[#254B3D]">01. LÀM RÕ</span>
          <p className="text-xs text-[#182D26]/80 mt-1">
            Xác định điều gì thực sự quan trọng và các giới hạn không thể đánh đổi.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#BBC7BC] bg-white">
          <span className="text-xs font-bold text-[#254B3D]">02. THỬ NHỎ</span>
          <p className="text-xs text-[#182D26]/80 mt-1">
            Chọn một hành động đảo ngược được trong 1-7 ngày để kiểm chứng.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#BBC7BC] bg-white">
          <span className="text-xs font-bold text-[#254B3D]">03. NHÌN LẠI</span>
          <p className="text-xs text-[#182D26]/80 mt-1">
            Quan sát điều thực tế đã xảy ra trước khi quyết định tiếp tục hay dừng.
          </p>
        </div>
      </section>
    </div>
  );
};
