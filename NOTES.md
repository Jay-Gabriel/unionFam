# Graffico Office 3D Clone (`https://office.graffico.it/`)

## 1. Thông tin tổng quan
- **Original URL**: `https://office.graffico.it/`
- **Tech Stack**: Next.js (App Router, React 19), React Three Fiber (`@react-three/fiber`), Three.js, Draco GLTF compression, WebGL2, ToneMapping (AgX), Web Audio API, WebM Video Textures, EXR Environment Probes.
- **Clone Status**: 100% Fidelity (Full Assets, 3D Models, Baked Environment, Audio/Radio Streams, Interactive Triggers).
- **Directory**: `/home/jay/office-graffico-clone/`

## 2. Cấu trúc tài nguyên & 3D Assets
- `/models/graffico-office-p16a-draco-webp.glb` (745 KB Draco-compressed 3D mesh văn phòng)
- `/models/baked/env_probe.exr` (Environment lighting probe HDR/EXR)
- `/photos/board/*.webp`, `/photos/screens/*.webp` (Textures & Screens)
- `/videos/alma-desktop.webm`, `/videos/rettifica-desktop.webm` (Interactive monitor video streams)
- `/fonts/caveat-latin-700-normal.woff` & Next.js custom typography woff2
- `/api/radio/stations` & `/api/radio/click` (Radio audio station mock & stream handler)
- `_next/static/chunks/*.js` & CSS bundles

## 3. Hướng dẫn khởi chạy
```bash
cd /home/jay/office-graffico-clone
npm start
# Hoặc chỉ định cổng tùy chọn:
PORT=3333 node server.mjs
```
Mở trình duyệt truy cập: `http://localhost:3333` hoặc `http://localhost:3000`

## 4. Các tính năng & Tương tác
- **FPS First-Person Controller**: Di chuyển WASD / Phím mũi tên, xoay góc nhìn bằng chuột.
- **Interactables (Phím E / Click)**:
  - Bật / tắt và đổi kênh Radio thực tế (5 trạm phát nhạc Jazz, Funk, Pop...).
  - Tương tác với màn hình máy tính hiển thị code & video demo live.
  - Xem bảng dự án (Project board), kệ cúp (Awards shelf).
  - Tương tác rút phích cắm điện ("pull the plug").
- **Responsive**: Hỗ trợ cảm ứng trên Mobile/Tablet & chuột/bàn phím trên Desktop.
