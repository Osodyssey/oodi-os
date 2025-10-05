# Oodi — Secure Starter Kit (v0.3.0)

این بسته یک نسخهٔ ارتقا یافته و کامل از پروتوتایپ زبان **Oodi** است — زبانی که با هدف ساده‌سازی و افزایش امنیت در استفاده از secretها (مثل API keys) ساخته شده است.

نسخهٔ حاضر شامل:
- گرامر ساده‌ی Oodi (PEG.js)
- Transpiler ساده (Oodi -> JavaScript)
- Runtime برای درخواست توکن و کال امن (`__getSecret`, `__call`, `setAuthToken`)
- سرور نمونه: احراز هویت کاربر، تولید توکن کوتاه‌مدت، پراکسی امن (`/api/proxy/ai`)
- Mock AI external endpoint برای تست
- مثال‌ها: `ai_full.oodi`, `todo.oodi`
- صفحات وب نمونه برای تست در مرورگر
- اسکریپت‌های npm برای build و اجرا

---

## شروع سریع (Quick Start)

1. اکسترکت بسته و وارد پوشه شو:
```bash
cd oodi-starter-secure-v2
npm install
```

2. یک فایل `.env` در فولدر `server/` بساز (از `.env.example` کپی کن) و مقادیر را وارد کن:
```
SERVER_JWT_SECRET=your_server_secret_here
AI_KEY=sk_ai_demo_value
ALLOWED_ORIGIN=http://localhost:5000
ALICE_PW=password
BOB_PW=hunter2
```

3. سرور را اجرا کن:
```bash
npm run start-server
```

4. در پنجرهٔ دیگری کدهای Oodi را کامپایل کن (مثال AI):
```bash
npm run build
```

5. صفحهٔ وب نمونه را باز کن:
- ساده‌ترین راه: اجرا `npx serve web` یا باز کردن فایل `web/ai.html` در مرورگر.
- آدرس پیش‌فرض سرور: `http://localhost:3000`

6. لاگین کن (مثال): username=`alice`, password=`password`  
سپس `Ask` را امتحان کن.

---

## فایل‌های مهم

- `src/grammar.pegjs` — گرامر زبان Oodi
- `src/compiler.js` — Transpiler ساده
- `src/cli.js` — CLI برای build
- `src/runtime/oodi-runtime.js` — runtime client
- `src/examples/ai_full.oodi` — مثال AI
- `src/examples/todo.oodi` — مثال ToDo
- `out-ai.js` / `out-todo.js` — خروجی کامپایل‌شده (برای اجرا بدون نیاز به کامپایل)
- `server/index.js` — سرور نمونه با احراز هویت و پراکسی
- `web/ai.html` / `web/todo.html` — صفحات نمونه

---

## مدل امنیتی بدیهی

- کلیدهای حقیقی (`AI_KEY`, ...) فقط روی سرور ذخیره می‌شوند.
- کلاینت هیچ‌گاه کلید اصلی را نمی‌بیند. به جای آن توکن‌های کوتاه‌مدت (JWT) صادر می‌شود.
- توکن‌ها دارای `jti`, `scope`, `exp` هستند و می‌توانند یک‌بار مصرف شوند.
- برای production از HTTPS، Vault و cache/DB (مثل Redis) برای jti و rate-limit استفاده کن.

---

## چگونه Oodi کار می‌کند (خلاصه تکنیکی)

1. کاربر login می‌کند و JWT کاربر را دریافت می‌کند.
2. runtime با `setAuthToken(jwt)` هدر Authorization را برای درخواست‌های بعدی قرار می‌دهد.
3. وقتی در کد Oodi `secret ai` فراخوانی می‌شود، runtime `/api/get-secret-token` را صدا می‌زند تا توکن کوتاه‌مدت بگیرد.
4. کد خروجی JS توکن را همراه با `call "/api/proxy/ai"` به پراکسی می‌فرستد.
5. سرور پراکسی توکن را verify کرده و با کلید داخلی به سرویس خارجی (در این نسخه یک Mock) متصل می‌شود.

---
# Oodi — Secure Starter Kit (Updated Files)

این بسته شامل فایل‌های به‌روزرسانی شده برای نسخهٔ Secure Oodi است.  
فقط فایل‌هایی که تغییر کرده‌اند داخل این ZIP قرار دارند — برای به‌روزرسانی پروژهٔ اصلی، این فایل‌ها را با فایل‌های مشابه در پروژه جایگزین کنید.

----
## Included files (فایل‌های موجود)
- server/index.js         — اضافه شدن DEMO_MODE، endpoint `/api/status` و پشتیبانی از حالت دمو
- server/.env.example     — متغیر محیطی جدید: DEMO_MODE
- web/ai.html             — شناسایی خودکار حالت دمو، رابط کاربری که در دمو نیازی به login ندارد
- README.md               — این فایل — راهنمای انگلیسی و فارسی برای روش استفاده و نکات امنیتی

----
## Quick explanation (English)
This update makes it easier to demo Oodi without going through the full login/token flow:
- `DEMO_MODE=true` in the server `.env` enables demo behavior.
- When demo mode is enabled, `/api/status` returns `{ demo: true }`.
- The web client (`web/ai.html`) queries `/api/status` and if demo is enabled it will hide the login UI and allow asking AI directly.
- The server will **only for demo** allow `/api/proxy/ai` calls without a short-lived token (still uses server-side AI key).
- **Security note:** Demo mode is for local testing only. DO NOT enable DEMO_MODE in production or any public environment.

----
## توضیحات کامل (فارسی)
این به‌روزرسانی‌ها برای راحتیِ دمو و توسعه محلی اضافه شده‌اند:
- متغیر محیطی `DEMO_MODE` اضافه شد. اگر مقدار آن `true` باشد، سرور حالت دمو را فعال می‌کند.
- `/api/status` به کلاینت امکان می‌دهد تا بداند سرور در حالت دمو است یا خیر.
- اگر دمو فعال باشد، صفحهٔ `web/ai.html` لاگین را پنهان کرده و امکان ارسال prompt به AI را بدون لاگین فراهم می‌کند (برای تست سریع).
- در حالت دمو، سرور به `/api/proxy/ai` اجازه می‌دهد بدون توکن کوتاه‌مدت درخواست کند — این فقط برای تسهیل دمو است و امنیت کمتری دارد.

----
## How to apply (چگونه استفاده کنیم)
1. unzip this archive into your project root (replace files if prompted).
2. edit `server/.env` and set `DEMO_MODE=true` for local testing.
3. start the server: `npm run start-server`
4. build oodi examples if you need: `npm run build`
5. serve `web/` directory (e.g. `npx serve web`) and open `web/ai.html`
6. In demo mode you can immediately enter a prompt and press Ask; in non-demo mode you must login first.

----
## Security reminder / هشدار امنیتی
- Demo mode bypasses normal token checks. Do not set `DEMO_MODE=true` on public servers.
- Always keep real API keys (AI_KEY) in server environment and never commit them.
- For production, use HTTPS, strong auth, and store jti / token state in Redis or DB.

----
## Contact / ارتباط
- Project: Oodi — Secure starter
- If you want, I can apply these updates directly into your full project ZIP or run the server locally on your machine step-by-step.
