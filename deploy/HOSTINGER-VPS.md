# Hướng dẫn chi tiết: chạy WMS trên VPS Hostinger (`ql.thuanchay.vn`)

Tài liệu này giả định VPS **Ubuntu 22.04 hoặc 24.04**, bạn đăng nhập được bằng **SSH** (user `root` hoặc user có `sudo`).

---

## Phần A — Chuẩn bị trước khi vào VPS

### A1. DNS (Hostinger hoặc nơi quản tên miền)

- Thêm bản ghi kiểu **A**:
  - **Tên / Host:** `ql` (hoặc `ql.thuanchay.vn` tùy giao diện — kết quả cuối phải là tên `ql.thuanchay.vn`).
  - **Giá trị / Trỏ tới:** `148.230.103.227`
- Đợi DNS lan từ **vài phút đến vài giờ** (đôi khi tới 24–48h).

Kiểm tra từ máy bạn (Windows PowerShell hoặc máy Linux):

```bash
nslookup ql.thuanchay.vn
```

Khi thấy IP `148.230.103.227` là ổn.

### A2. Mã nguồn trên Git

VPS cần **clone được** repo (GitHub/GitLab/…). Chuẩn bị một trong hai cách:

- **Repo công khai:** chỉ cần URL HTTPS `git clone`.
- **Repo riêng tư:** tạo **Personal Access Token** (GitHub: Settings → Developer settings → Tokens) quyền `repo`, rồi clone dạng:
  `git clone https://USERNAME:TOKEN@github.com/USER/Ecomtc.git app`

(Không gửi token vào chat công khai; chỉ dán trên VPS.)

---

## Phần B — Đăng nhập VPS

Thay `root` bằng user Hostinger cấp nếu khác:

```bash
ssh root@148.230.103.227
```

Lần đầu có thể hỏi fingerprint — gõ `yes`.

---

## Phần C — Cập nhật hệ thống và cài gói cần thiết

### C1. Cập nhật apt

```bash
sudo apt update && sudo apt upgrade -y
```

### C2. Cài Git, Nginx, Certbot, công cụ mạng

```bash
sudo apt install -y curl git nginx certbot python3-certbot-nginx ca-certificates
```

### C3. Cài Node.js 20 LTS (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Kiểm tra:

```bash
node -v
npm -v
```

Bạn cần **Node v20** (hoặc mới hơn tương thích Next 15).

### C4. (Khuyến nghị nếu VPS 1 GB RAM) Tạo swap

Build Next.js có thể hết RAM. Kiểm tra RAM:

```bash
free -h
```

Nếu RAM ≤ 2 GB, có thể thêm swap 2 GB (chạy một lần):

```bash
sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Phần D — Thư mục triển khai và clone code

### D1. Tạo cây thư mục

Chúng ta dùng:

- `/var/www/ql-thuanchay-vn/app` — mã nguồn + build.
- `/var/www/ql-thuanchay-vn/data` — file SQLite `prod.db`.

```bash
sudo mkdir -p /var/www/ql-thuanchay-vn/data
sudo chown -R "$USER":"$USER" /var/www/ql-thuanchay-vn
cd /var/www/ql-thuanchay-vn
```

### D2. Clone repo vào thư mục `app`

**Sửa URL** cho đúng repo của bạn:

```bash
git clone https://github.com/YOUR_USER/Ecomtc.git app
cd app
```

Nếu lỗi xác thực với repo private, dùng token như mục A2 hoặc cấu hình **SSH key** trên VPS.

---

## Phần E — File `.env` và cơ sở dữ liệu

### E1. Tạo file `.env`

Trên VPS, bạn đang ở `/var/www/ql-thuanchay-vn/app`:

```bash
nano .env
```

Dán nội dung (đường dẫn file DB **phải khớp** thư mục `data`):

```env
NODE_ENV=production
DATABASE_URL="file:/var/www/ql-thuanchay-vn/data/prod.db"
```

Lưu: `Ctrl+O`, Enter, thoát: `Ctrl+X`.

### E2. Quyền thư mục `data`

User hiện tại cần ghi được DB khi chạy `prisma`; sau đó ta giao cho `www-data`:

```bash
sudo chown -R "$USER":"$USER" /var/www/ql-thuanchay-vn/data
```

### E3. Áp schema Prisma (SQLite)

```bash
cd /var/www/ql-thuanchay-vn/app
npx prisma db push
```

Thấy thông báo thành công, không lỗi đỏ là được.

### E4. (Tuỳ chọn) Dữ liệu mẫu

```bash
npm run db:seed
```

---

## Phần F — Build production (standalone)

### F1. Cho phép thực thi script

```bash
cd /var/www/ql-thuanchay-vn/app
chmod +x deploy/build-standalone.sh
```

### F2. Chạy build

```bash
./deploy/build-standalone.sh
```

Script sẽ: `npm ci` hoặc `npm install` → `prisma generate` → `next build` → copy ra thư mục **`/var/www/ql-thuanchay-vn/app/.deploy/`** (có file `server.js`).

**Nếu build bị kill / lỗi hết RAM:** đã có swap ở C4; hoặc build trên máy mạnh hơn rồi rsync/scp thư mục `.deploy` lên VPS (nâng cao).

---

## Phần G — Systemd (chạy nền, tự khởi động lại)

### G1. Giao quyền cho user `www-data`

Ứng dụng chạy dưới `www-data` để đồng bộ với Nginx (thông dụng trên Ubuntu):

```bash
sudo chown -R www-data:www-data /var/www/ql-thuanchay-vn/app/.deploy
sudo chown -R www-data:www-data /var/www/ql-thuanchay-vn/data
sudo chown www-data:www-data /var/www/ql-thuanchay-vn/app/.env
```

### G2. Cài unit systemd

```bash
sudo cp /var/www/ql-thuanchay-vn/app/deploy/ecomtc-wms.service /etc/systemd/system/ecomtc-wms.service
sudo nano /etc/systemd/system/ecomtc-wms.service
```

Kiểm tra các dòng sau **đúng đường dẫn** trên máy bạn:

- `WorkingDirectory=/var/www/ql-thuanchay-vn/app/.deploy`
- `EnvironmentFile=-/var/www/ql-thuanchay-vn/app/.env`
- `ExecStart=/usr/bin/node /var/www/ql-thuanchay-vn/app/.deploy/server.js`

Nếu bạn clone **không** vào `app` mà thẳng vào thư mục khác — sửa cả ba chỗ cho khớp.

### G3. Bật service

```bash
sudo systemctl daemon-reload
sudo systemctl enable ecomtc-wms
sudo systemctl start ecomtc-wms
sudo systemctl status ecomtc-wms
```

Trạng thái mong đợi: **active (running)**.

### G4. Kiểm tra app trên localhost

```bash
curl -sI http://127.0.0.1:3000 | head -n 5
```

Thấy `HTTP/1.1 200` hoặc `307` (redirect) là ổn.

**Nếu `Connection refused`:** xem log:

```bash
journalctl -u ecomtc-wms -n 80 --no-pager
```

Một số máy bị lỗi với `HOSTNAME=127.0.0.1`. Khi đó sửa service:

```bash
sudo nano /etc/systemd/system/ecomtc-wms.service
```

Xóa hoặc comment dòng `Environment=HOSTNAME=127.0.0.1`, rồi:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ecomtc-wms
```

Đảm bảo firewall **không** mở port `3000` ra internet (chỉ Nginx nói chuyện với app).

---

## Phần H — Nginx (HTTP trước, HTTPS sau)

### H1. Tắt site mặc định (nếu trùng `server_name` hoặc gây rối)

```bash
sudo unlink /etc/nginx/sites-enabled/default 2>/dev/null || true
```

### H2. Thêm site `ql.thuanchay.vn`

```bash
sudo cp /var/www/ql-thuanchay-vn/app/deploy/nginx-ql.thuanchay.vn.conf /etc/nginx/sites-available/ql.thuanchay.vn
sudo ln -sf /etc/nginx/sites-available/ql.thuanchay.vn /etc/nginx/sites-enabled/ql.thuanchay.vn
sudo nginx -t
```

Nếu `nginx -t` báo **syntax is ok**, nạp lại:

```bash
sudo systemctl reload nginx
```

### H3. Kiểm tra từ VPS (theo tên miền)

```bash
curl -sI -H "Host: ql.thuanchay.vn" http://127.0.0.1 | head -n 8
```

Trên trình duyệt (sau khi DNS đã trỏ đúng): mở `http://ql.thuanchay.vn` — phải thấy trang app.

---

## Phần I — HTTPS (Let’s Encrypt)

Chỉ chạy khi **DNS đã trỏ đúng** IP và port **80** từ internet tới VPS đang mở.

```bash
sudo certbot --nginx -d ql.thuanchay.vn
```

Làm theo hướng dẫn (email, đồng ý điều khoản). Certbot sửa file Nginx để thêm SSL.

Kiểm tra:

```bash
curl -sI https://ql.thuanchay.vn | head -n 5
```

---

## Phần J — Firewall (UFW)

Nên bật **sau** khi SSH và Nginx đã ổn định (tránh khóa mất SSH).

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status verbose
```

**Không** cần mở port `3000` ra ngoài.

---

## Phần K — Cập nhật bản mới sau này

```bash
cd /var/www/ql-thuanchay-vn/app
git pull
./deploy/build-standalone.sh
sudo chown -R www-data:www-data .deploy
sudo systemctl restart ecomtc-wms
```

Nếu đổi `schema.prisma`:

```bash
npx prisma db push
sudo systemctl restart ecomtc-wms
```

---

## Phần L — Xử lý sự cố (tóm tắt)

| Hiện tượng | Việc nên làm |
|-------------|----------------|
| `systemctl status` failed | `journalctl -u ecomtc-wms -n 100 --no-pager` |
| 502 Bad Gateway | App không chạy: kiểm tra `ecomtc-wms`, `curl 127.0.0.1:3000` |
| 404 / site khác | Kiểm tra `server_name`, `sites-enabled`, `nginx -t` |
| Certbot lỗi | DNS chưa tới IP; port 80 bị chặn; chạy `sudo ufw status` |
| Prisma / SQLite lỗi quyền | `sudo chown -R www-data:www-data /var/www/ql-thuanchay-vn/data` và `app/.env` |

---

## Phần M — Ghi nhớ vận hành

- **Backup:** định kỳ copy `/var/www/ql-thuanchay-vn/data/prod.db`.
- **Nhanh.vn:** sau khi site chạy, vào trang **Cài đặt** trên web nhập AppKey / BusinessId.
- **Bảo mật:** đổi SSH sang **key**, tắt đăng nhập root bằng mật khẩu nếu Hostinger cho phép cấu hình.

---

Khi làm xong, URL sử dụng: **`https://ql.thuanchay.vn`** (sau Certbot) hoặc tạm thời `http://` trước khi có SSL.
