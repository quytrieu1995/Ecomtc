# Chạy WMS bằng Docker

Ứng dụng build **Next.js standalone** trong image, khởi động với **`prisma db push`** (SQLite trong volume `/app/data`).

## Yêu cầu

- Docker Engine **20.10+** và Docker Compose V2 (`docker compose`).
- Trên VPS Ubuntu: [cài Docker chính thức](https://docs.docker.com/engine/install/ubuntu/).

## Kiểm tra trước khi `docker compose build`

Chạy lệnh Compose **trong thư mục gốc project** (cùng cấp với `package.json`), nơi có `docker-compose.yml` và `Dockerfile`:

```bash
cd /var/www/ql-thuanchay-vn/app
pwd
ls -la docker-compose.yml Dockerfile docker-entrypoint.sh
```

Nếu **không** thấy `docker-compose.yml`, Docker báo:

`no configuration file provided: not found`

**Cách xử lý:**

1. Trên máy dev: **commit + push** lên Git các file `docker-compose.yml`, `Dockerfile`, `docker-entrypoint.sh`, `.dockerignore`.
2. Trên VPS: `git pull` (đúng nhánh, ví dụ `main`).
3. Chạy lại `ls` — đủ file rồi mới `docker compose build`.

Nếu vẫn thiếu file, kiểm tra thư mục clone có phải root repo (đôi khi clone lệch cấp thư mục).

## Máy dev — build & chạy thử

Trong thư mục gốc repo:

```bash
docker compose build
docker compose up -d
```

Mở: `http://localhost:3000` (Compose map **`127.0.0.1:3000`** — chỉ máy local/VPS, không public toàn mạng).

Xem log:

```bash
docker compose logs -f wms
```

Dừng:

```bash
docker compose down
```

Dữ liệu SQLite nằm trong **Docker volume** `wms_data` (không mất khi `down`, mất khi `docker compose down -v`).

## VPS (ví dụ Hostinger) + Nginx + domain `ql.thuanchay.vn`

1. Cài Docker + Compose, clone repo (ví dụ `/var/www/ql-thuanchay-vn/app`).
2. Trong thư mục repo:

   ```bash
   docker compose build
   docker compose up -d
   ```

3. Nginx trên **host** vẫn proxy tới **`127.0.0.1:3000`** (giống cấu hình cũ). File mẫu: `deploy/nginx-ql.thuanchay.vn.conf`.
4. HTTPS: `sudo certbot --nginx -d ql.thuanchay.vn`.

**Không** cần systemd `ecomtc-wms` nữa nếu chỉ dùng Docker — có thể tắt:

```bash
sudo systemctl disable --now ecomtc-wms 2>/dev/null || true
```

## Cập nhật phiên bản

```bash
cd /path/to/app
git pull
docker compose build --no-cache
docker compose up -d
```

## Biến môi trường

Mặc định Compose đặt `DATABASE_URL=file:/app/data/prod.db`. Đổi trong `docker-compose.yml` hoặc thêm file `.env` cạnh compose (Compose tự đọc) — ví dụ thêm secret Nhanh (nếu sau này app đọc từ env).

## Gỡ systemd / build cũ (tuỳ chọn)

Nếu trước đó cài `ecomtc-wms.service` và thư mục `.deploy`:

```bash
sudo systemctl disable --now ecomtc-wms
sudo rm -f /etc/systemd/system/ecomtc-wms.service
sudo systemctl daemon-reload
```

Thư mục `.deploy` có thể xóa để tiết kiệm dung lượng; Docker không dùng nó.

## Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|-------------|------------|
| `no configuration file provided: not found` | Thiếu `docker-compose.yml` trong thư mục hiện tại — xem mục **Kiểm tra trước khi build** ở trên (`git pull`, đúng thư mục). |
| Build fail ở `deps` / `npm ci` hoặc `npm install` (exit code 1) | Thường do **`postinstall` = `prisma generate`** chạy khi chưa có `prisma/` trong image — `Dockerfile` đã `COPY prisma` trước `npm install`. `git pull` rồi build lại. Nếu vẫn lỗi: đồng bộ `package-lock.json` với `package.json` hoặc tạm xóa lock để dùng `npm install`; xem log: `docker compose build --progress=plain --no-cache`. |
| Build hết RAM VPS | Build trên máy mạnh rồi `docker save` / `docker load`, hoặc tăng RAM/swap VPS. |
| 502 từ Nginx | `docker compose ps`, `docker compose logs wms` — container phải `healthy` / Up. |
| Prisma lỗi quyền | Volume `wms_data` gắn vào `/app/data`; entrypoint đã `chown` user `nextjs`. |
