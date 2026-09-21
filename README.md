# 🏢 UnionFam · 3D Life Lab & Living Life Map Studio

> Không gian 3D tương tác sống động kết hợp Trợ lý AI Đồng Hành (Blueprint 7.0), Bảng tiến độ Thử nghiệm 7 ngày (Life Experiments) và Đài phát thanh tĩnh tâm (Mindful Radio).

---

## 🌟 Tính Năng Nổi Bật

1. **Phòng làm việc 3D tương tác (First-Person 3D Studio)**:
   - Đi bộ khám phá không gian bằng phím `W A S D` và chuột, chạy nhanh với `Shift`.
   - Chiếu sáng Baked Lighting và bóng đổ thời gian thực công nghệ WebGL / React Three Fiber.
2. **🤖 Bàn AI Đồng Hành (AI Companion Interactive Terminal)**:
   - Tích hợp chuẩn **Blueprint 7.0**: Lắng nghe và phản chiếu bám sát hiện trạng cuộc sống của người dùng.
   - Nhập tin nhắn hoặc chọn nhanh câu hỏi trắc nghiệm từ bộ *10-Question Catalog*.
   - AI tự động phân tích và khởi tạo *Thử Nghiệm 7 Ngày (Life Experiments)* phù hợp.
3. **🗺️ Bảng Điều Khiển Thời Gian Thực (Living Life Map 8 Constellations)**:
   - Check-in tiến độ 7 ngày (Ngày 1 → Ngày 7) với thanh đo % tăng trực tiếp.
   - Thanh trượt đo lường Năng lượng & Tự chủ (Q6 Energy Scale 1-10).
   - Đúc kết Bài học (Insights) & Khoảng cách thực tế (02. The Gap).
4. **📻 Đài Radio Tâm Trí (UnionFam Mindful Radio)**:
   - 5 kênh âm nhạc thư giãn, Lo-Fi, Deep Ambient và Smooth Jazz giúp tĩnh tâm khi làm việc.
5. **🔌 Thử nghiệm an toàn**:
   - Rút phích cắm điện để trải nghiệm hiệu ứng bóng tối bất ngờ và cắm lại để hồi sinh năng lượng.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu Cầu
- Node.js >= 18.0.0

### Khởi Chạy
```bash
# 1. Build & tối ưu hóa mã nguồn
npm run build

# 2. Khởi động server
npm start
```
Truy cập: `http://localhost:3000/`

---

## ☁️ Triển Khai (Deployment) & CI/CD

- Dự án tích hợp sẵn quy trình **GitHub Actions CI/CD** (`.github/workflows/ci-cd.yml`) tự động kiểm thử toàn bộ bundle WebGL, model GLB và smoke test HTTP server trước khi phát hành.
- Được cấu hình sẵn sàng cho **Vercel** (`vercel.json`) và triển khai Serverless / Container độc lập.

---

© 2026 UnionFam. All rights reserved.
