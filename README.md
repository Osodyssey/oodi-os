# Oodi — Secure Starter (Beta) — راهنمای کامل (فارسی)

**تذکر مهم:** این نسخه در مرحلهٔ **Beta** است. پروژه نمونه و پروتوتایپ بوده و هنوز روی بخش‌های امنیتی، تست و performance کار کامل نشده.  
استفاده در production بدون بازبینی و تقویت امنیتی **توصیه نمی‌شود**.

---

## معرفی کوتاه
Oodi یک زبان/DSL سبک است که روی JavaScript ساخته شده — هدفش ساده‌سازی و امن‌کردن الگوهای استفاده از `secret` (مثل API keys) در فرانت‌اند است.  
این بسته شامل یک پیاده‌سازی نمونه (گرامر ساده، transpiler، runtime) و یک **سرور نمونه امن** (تولید توکن کوتاه‌مدت و پراکسی) و صفحات وب دمو می‌باشد.

---

## وضعیت نسخه
- نسخه: **v0.3.0 (Beta)**
- وضعیت: **نمونهٔ کاری** — مناسب برای یادگیری، تست محلی و پروتوتایپ.  
- موارد مهم: ممکن است APIها تغییر کنند، گرامر کامل نیست، و ویژگی‌های production مانند ذخیرهٔ jti در Redis، HTTPS خودکار، و auditها هنوز اضافه نشده‌اند.

---

## آنچه در این بسته می‌یابید
- `src/` — گرامر (PEG.js)، compiler و runtime
- `src/examples/` — مثال‌های Oodi (`ai_full.oodi`, `todo.oodi`)
- `out-*.js` — خروجی‌های کامپایل‌شده آماده (برای اجرا بدون کامپایل)
- `server/` — سرور نمونه (login, get-secret-token, proxy, mock AI)
- `web/` — صفحات دمو (`ai.html`, `todo.html`)
- `README.md` — همین فایل
- اسکریپت‌های npm: `npm run build`, `npm run start-server`

---

## پیش‌نیازها (Prerequisites)
1. Node.js >= 18 (تست شده با Node 20)  
2. npm (همراه Node)  
3. Git (برای کلون کردن اگر لازم)  
4. (اختیاری) `npx serve` برای سرو کردن پوشهٔ `web/` یا هر static server

---

## نصب و راه‌اندازی (Step-by-step)
1. مخزن را کلون یا ZIP را استخراج کن:
```bash
git clone https://github.com/Osodyssey/oodi-os.git
cd oodi-os
```

2. نصب وابستگی‌ها:
```bash
npm install
```

3. تنظیم متغیرهای محیطی:
```bash
cd server
cp .env.example .env
# ویرایش .env در صورت نیاز؛ برای دمو از مقادیر پیش‌فرض استفاده کن
```

مقدار پیشنهادی `.env` برای تست سریع:
```
SERVER_JWT_SECRET=dev-secret
AI_KEY=sk_ai_demo
ALLOWED_ORIGIN=http://localhost:5000
ALICE_PW=password
BOB_PW=hunter2
DEMO_MODE=true
```

4. اجرای سرور:
```bash
cd ..
npm run start-server
```
- خروجی باید شبیه باشد: `Secure Oodi server running on 3000 DEMO_MODE=true`

5. کامپایل مثال‌ها (Oodi → JS):
```bash
# AI example
node src/cli.js build src/examples/ai_full.oodi -o web/out-ai.js

# ToDo example
node src/cli.js build src/examples/todo.oodi -o web/out-todo.js
```

6. سرو کردن صفحه‌های وب و تست:
```bash
npx serve web
# سپس در مرورگر برو به http://localhost:5000/ai.html
```

- اگر `DEMO_MODE=true` باشد، صفحه AI بدون نیاز به لاگین کار می‌کند (فقط برای دمو).
- اگر `DEMO_MODE=false` باید با کاربر `alice/password` لاگین کنی.

---

## چطور از زبان Oodi استفاده کنم؟ (Short)
1. یک فایل `.oodi` بنویس (مثال: `src/examples/ai_full.oodi`).
2. با CLI کامپایل کن:
```bash
node src/cli.js build path/to/file.oodi -o out-file.js
```
3. فایل JS خروجی را در HTML وارد کن یا در Node اجرا کن.  
4. در runtime با `setAuthToken(jwt)` توکن کاربر را ست کن تا `__getSecret` اجازه بگیرد.

---

## ارورهای شایع و راه‌حل‌ها (Troubleshooting)
> اگر خطا دیدی اول این بخش را چک کن — ۹۹٪ مشکل راه‌حلش اینجا هست.

### 1) `Error: ENOENT: no such file or directory, open 'src/grammar.pegjs'`
- دلیل: فایل گرامر پیدا نشد.
- راه‌حل:
  - مطمئن شو کل فایل‌ها را از ZIP یا گیت استخراج کردی. فایل `src/grammar.pegjs` باید وجود داشته باشد.
  - اگر از repo دیگری clone کردی و این فایل نبود، از نسخه‌ی ZIP ما استفاده کن.

### 2) `404 Not Found` برای `out-ai.js` یا `out-todo.js`
- دلیل: فایل‌های خروجی JS تولید نشده یا در مسیر درست نیستند.
- راه‌حل:
  - مطمئن شو دستور build را اجرا کردی (نمونه در بالا).
  - یا خروجی را مستقیم در پوشهٔ `web/` بگذار: `-o web/out-ai.js`.

### 3) CORS یا درخواست‌ها در مرورگر بلاک میشه
- دلیل: درخواست‌های cross-origin یا هدرها مشکل دارند.
- راه‌حل:
  - فایل `server/.env` مقدار `ALLOWED_ORIGIN` را برای آدرسی که `npx serve` استفاده می‌کند قرار بده.
  - یا برای تست محلی `ALLOWED_ORIGIN=*` (فقط تست).

### 4) `token expired or replayed` یا خطای JWT
- دلیل: توکن کوتاه‌مدت (jti) یا توکن کاربر منقضی شده یا دوباره استفاده شده.
- راه‌حل:
  - دوباره لاگین کن و عملیات را تکرار کن.
  - زمان سیستم را بررسی کن؛ اگر ساعت سیستم اشتباه باشه توکن‌ها ممکنه فوراً expire شوند.

### 5) `port already in use` یا سرور استارت نمیشه
- راه‌حل:
  - فرایند دیگری روی پورت 3000 اجرا شده؛ یا از `PORT` محیطی دیگر استفاده کن:
  ```bash
  PORT=4000 npm run start-server
  ```

### 6) `npm install` خطا داد یا پکیج نصب نشد
- راه‌حل:
  - مطمئن شو Node.js نسخه >= 18 دارید (`node -v`).
  - `npm cache clean --force` و دوباره `npm install`.
  - در صورت خطاهای native build، متن ارور را ذخیره کن و ارسال کن تا راهنمایی کنم.

---

## نکات امنیتی مهم (Security)
- **هرگز** `DEMO_MODE=true` را در محیط عمومی یا سرور تولیدی قرار نده.
- کلیدهای واقعی (`AI_KEY`) را در repo قرار نده؛ از `.env` یا Vault استفاده کن.
- برای production:
  - HTTPS را فعال کن (Let's Encrypt یا certs محلی برای تست).
  - jtiها و sessionها را در Redis یا DB ذخیره کن (نه در حافظهٔ محلی).
  - rate-limit تنظیم کن و logging/alert اضافه کن.
  - بررسی و Audit امنیتی قبل از انتشار.

---

## اگر باز هم خطا داشتی چی کار کنی؟
1. لاگ‌ها را کپی کن (هم terminal سرور و هم کنسول مرورگر).  
2. `node -v` و `npm -v` را بفرست.  
3. بگو چه فرمانی زدی و چه پیغامی آمد.  
4. من دقیقاً خط به خط می‌گم چه تغییری بدی.

---

## چک‌لیست قبل از انتشار (Quick checklist)
- [ ] غیرفعال کردن `DEMO_MODE`
- [ ] استفاده از HTTPS
- [ ] انتقال jti/session به Redis
- [ ] بررسی لاگ‌ها و حذف اطلاعات حساس
- [ ] اجرای تست‌های نفوذ و بررسی rate-limit

---

## لیسانس و مشارکت
این پروژه تحت **MIT** یا هر لیسانسی که در repo قرار دارد منتشر می‌شود. مشارکت خوش‌آمد است — Pull Request بده و ویژگی‌ها یا باگ‌ها را گزارش کن.
