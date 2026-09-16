# نشر موقع صَوْغ — Deployment

## الحالة الحالية (إعادة تصميم 2026-09-09 — لم تُنشر بعد)

> **لم يُنفَّذ أي نشر ضمن إعادة التصميم.** التغييرات محلية في `dist/` فقط،
> والنشرة المنشورة حاليًا ما تزال النسخة السابقة حتى يصدر قرار صريح بالنشر.

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
| حالة الفهرسة | **مفتوحة للفهرسة** — أُزيل وسم `noindex` وحُدِّث `robots.txt` بعد التحقق من أن الدومين الرسمي يعمل |
| الدومين الرسمي | **https://soghagency.com** — مسجّل ويخدم الموقع (تم التحقق 2026-09-09) · canonical و`sitemap.xml` مفعّلان |
| النموذج | بلا خادم: تحقق محلي (الاسم، الجوال، البريد، الخدمة، النبذة) ثم رسالة mailto منسقة إلى soghagency@gmail.com |
| ترويسات الأمان | nosniff · Referrer-Policy strict-origin-when-cross-origin · X-Frame-Options DENY · Permissions-Policy (camera/mic/geo معطلة) — في `vercel.json` |

لا تلمس مشاريع Vercel الأخرى في الحساب (`acadify-website`, `abdulhadi-portfolio`).

## إعادة النشر

```bash
cd <مجلد المشروع>
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

## قائمة إطلاق الدومين الرسمي

البنود 6 إلى 10 **نُفِّذت** في إعادة تصميم 2026-09-09 بعد التحقق من أن
`https://soghagency.com` يستجيب بالرمز 200 ويخدم هذا الموقع فعلًا:

- [x] 6. `<link rel="canonical" href="https://soghagency.com/">` في `index.html`.
- [x] 7. `og:url` مضاف و`og:image` أصبح رابطًا مطلقًا.
- [x] 8. `public/sitemap.xml` أُنشئ بالدومين الرسمي.
- [x] 9. `public/robots.txt` يسمح بالفهرسة ويحمل سطر Sitemap.
- [x] 10. وسم `noindex, nofollow` أُزيل من `index.html`.

يبقى على المالك:

1. تأكيد ربط الدومين في Vercel وصحة شهادة HTTPS.
2. إبقاء `sogh-agency.vercel.app` مع تحويل 308 إلى الدومين الرسمي.
3. `npm run build` ثم `npx vercel deploy --prod --yes` **عند اتخاذ قرار النشر**.
4. التحقق من معاينة الرابط في واتساب وX بعد النشر.
5. إضافة الدومين في Google Search Console وتقديم الـsitemap.
6. تحديث `<lastmod>` في `public/sitemap.xml` عند كل إصدار محتوى.

### العنوان الوطني وSEO المحلي

لا يذكر الموقع أي مدينة أو عنوان، لأن العنوان الوطني غير موثق في المشروع
(انظر `10_KNOWLEDGE_BASE/02_LEGAL_AND_BUSINESS_INFO.md` القسم D). عند تأكيده:
أضف `address` كاملًا في البيانات المنظمة داخل `index.html`، وعندها فقط يصبح
استهداف عبارات مثل «وكالة تسويق في جدة» مبنيًا على واقع موثق.
