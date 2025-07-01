# Game Quiz Discord

Dự án game quiz hoạt động trên Discord, sử dụng React + Vite cho frontend và Node.js + Express cho backend.

## Cấu trúc Monorepo

Dự án sử dụng `pnpm` workspaces để quản lý monorepo.
- `packages/frontend`: Chứa code frontend (React + Vite)
- `packages/backend`: Chứa code backend (Node.js + Express)

## Hướng dẫn cài đặt

1. Cài đặt `pnpm` nếu chưa có: `npm install -g pnpm`
2. Clone repository này.
3. Chạy `pnpm install` ở thư mục gốc của dự án để cài đặt tất cả dependencies.

## Chạy dự án

### Frontend

1. Di chuyển vào thư mục frontend: `cd packages/frontend`
2. Chạy server dev: `pnpm dev`
3. Mở trình duyệt và truy cập `http://localhost:5173` (hoặc port được Vite chỉ định).

### Backend

1. Di chuyển vào thư mục backend: `cd packages/backend`
2. Chạy server: `pnpm start` (cần định nghĩa script 'start' trong package.json của backend)
3. Backend sẽ chạy trên port được cấu hình (mặc định là 3001 hoặc port trong server.js).
