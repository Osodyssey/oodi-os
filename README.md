# Oodi-os Starter Kit (Secure)

این نسخه به‌روزرسانی شدهٔ Oodi است با امکانات امنیتی نمونه:
- احراز هویت ساده (login -> user JWT)
- endpoint امن `/api/get-secret-token` که فقط به کاربران مجاز توکن می‌دهد
- rate limiting، helmet و CORS برای امنیت HTTP
- جلوگیری از replay توکن با jti و نگهداری jti ها (in-memory demo)
- runtime قابلیت ست کردن auth token در کلاینت
- نمونه web/index.html با فرم login

## اجرا
1. npm install
2. server/.env.example -> server/.env و مقادیر را بگذار
3. npm run start-server
4. npm run build
5. open web/index.html یا run `npx serve web`

## هشدار
این یک prototype است. برای production:
- از HTTPS استفاده کن
- از بانک اطلاعات یا cache (مثل Redis) برای jti و rate-limit استفاده کن
- کاربران و پسوردها را در DB امن نگهدار
- secrets را در Vault نگهدار (AWS Secrets Manager یا HashiCorp Vault)
