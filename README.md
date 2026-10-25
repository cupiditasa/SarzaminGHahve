# SarzaminGHahve

سایت استاتیک سرزمین قهوه روی GitHub Pages میزبانی می‌شود.

## شمارنده بازدید

شمارندهٔ فوتر از API یک Cloudflare Worker استفاده می‌کند و مقدار تجمیعی را در D1 ذخیره می‌کند. دادهٔ شخصی یا شناسهٔ بازدیدکننده نگهداری نمی‌شود. هر زبانهٔ مرورگر در هر نشست یک بازدید ثبت می‌کند؛ بارگذاری دوبارهٔ همان زبانه فقط عدد را می‌خواند.

### راه‌اندازی یا انتشار Worker

1. برای راه‌اندازی نخستین‌بار، یک D1 با نام sarzamin-visits بسازید و binding با نام DB را به فایل Worker اضافه کنید:

   npx wrangler d1 create sarzamin-visits --binding DB --update-config --config worker/wrangler.jsonc

2. جدول شمارنده را در D1 ایجاد کنید:

   npx wrangler d1 migrations apply sarzamin-visits --remote --config worker/wrangler.jsonc

3. Worker را منتشر کنید:

   npx wrangler deploy --config worker/wrangler.jsonc

4. مقدار visitEndpoint در script.js باید به نشانی https://sarzamin-visit-counter.cupiditasa.workers.dev/api/visits اشاره کند.

سایت اصلی و DNS روی GitHub Pages باقی می‌مانند؛ Worker فقط API شمارنده را ارائه می‌دهد.
