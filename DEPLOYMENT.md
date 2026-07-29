# نشر موقع صَوْغ — Deployment

## الحالة الحالية (إطلاق تجريبي عام — نسخة الحركة المعتمدة)

| البند | القيمة |
| --- | --- |
| مشروع Vercel | `sogh-agency` (الاسم المفضل — كان متاحًا) |
| الرابط العام للإنتاج | **https://sogh-agency.vercel.app** |
| النشرة الحالية | `dpl_8eLeUkJpyj8iPfYBXfFQsQx19bM3` (`sogh-agency-fv7i578m2…`) — نشر حركة الهوية 2026-07-17 |
| نشرة التراجع السابقة | `dpl_7Y1xdijdHVKHaXP9UhAX9BAYhvK8` (`sogh-agency-jo17druue…`) — ما تزال Ready |
| تاريخ النشر الأول | 2026-07-17 |
| Framework | Vite (static) |
| أمر التثبيت | `npm ci` |
| أمر البناء | `npm run build` |
| مجلد الإخراج | `dist/` |
| حالة الفهرسة | **noindex, nofollow مؤقتًا** (meta + robots.txt) — الزوار يتصفحون طبيعيًا |
| الدومين الرسمي | غير مسجل بعد — لا canonical ولا sitemap حتى التسجيل |
| النموذج | بلا خادم: تحقق محلي ثم رسالة mailto منسقة إلى soghagency@gmail.com |
| ترويسات الأمان | nosniff · Referrer-Policy strict-origin-when-cross-origin · X-Frame-Options DENY · Permissions-Policy (camera/mic/geo معطلة) — في `vercel.json` |

لا تلمس مشاريع Vercel الأخرى في الحساب (`acadify-website`, `abdulhadi-portfolio`).

## إعادة النشر

```bash
cd C:\Users\HP\sogh-agency-website-v1.0
npm run sync:brand      # عند تغيّر أصول العلامة أو بيانات التواصل
npm run build           # فحص TypeScript + بناء محلي للتأكد
npx vercel deploy --prod --yes
```

المشروع مربوط عبر `.vercel/` (لا يُرفع ولا يُشارك). ملف `.env.local`
اعتماد محلي من Vercel — لا يُرفع أبدًا (مستثنى في `.vercelignore`).

## التراجع (Rollback)

1. `npx vercel ls` لعرض النشرات السابقة.
2. `npx vercel rollback <deployment-url>` للعودة الفورية لنشرة سابقة،
   أو `npx vercel promote <deployment-url>` لترقية نشرة محددة.
3. تحقق من `https://sogh-agency.vercel.app` بعد التبديل.

## قائمة إطلاق الدومين الرسمي (عند التسجيل)

1. سجّل الدومين المعتمد (قرار المالك).
2. أضف الدومين في Vercel: Project `sogh-agency` → Settings → Domains.
3. اضبط DNS حسب تعليمات Vercel (A/CNAME).
4. تأكد من صدور شهادة HTTPS تلقائيًا.
5. أبقِ `sogh-agency.vercel.app` يعمل مع تحويل 308 إلى الدومين الرسمي (خيار Redirect في إعدادات الدومين).
6. أضف `<link rel="canonical" href="https://الدومين/">` في `index.html`.
7. أضف `<meta property="og:url" content="https://الدومين/">` واجعل `og:image` رابطًا مطلقًا.
8. أنشئ `public/sitemap.xml` بالدومين الرسمي.
9. حدّث `public/robots.txt`: اسمح بالفهرسة وأضف سطر Sitemap.
10. **احذف** وسم `<meta name="robots" content="noindex, nofollow">` من `index.html`.
11. `npm run build` ثم `npx vercel deploy --prod --yes`.
12. تحقق من المشاركة الاجتماعية (معاينة الرابط في واتساب/X) وصحة OG.
13. اختياري بقرار المالك: أضف الدومين في Google Search Console وقدّم الـsitemap.
