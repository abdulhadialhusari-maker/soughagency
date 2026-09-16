# SOGH Public Website — Final QA

## v2.1 — 2026-09-09

الحكم: **PASS — تسليم محلي، لم يُنشر.**

بوابة الإصدار `npm run qa:release` نُفّذت على بناء الإنتاج عبر
`vite preview` (لا على خادم التطوير)، ومرّت بالكامل.

### مصفوفة الاستجابة

| العرض | التمرير الأفقي | عناصر تتجاوز الحافة | زر الإجراء فوق الطية |
| ---: | ---: | ---: | :---: |
| 320 | 0px | 0 | نعم |
| 360 | 0px | 0 | نعم |
| 390 | 0px | 0 | نعم |
| 430 | 0px | 0 | نعم |
| 560 | 0px | 0 | نعم |
| 768 | 0px | 0 | نعم |
| 1024 | 0px | 0 | نعم |
| 1280 | 0px | 0 | نعم |
| 1440 | 0px | 0 | نعم |

لقطات كاملة على 1440/1280/1024/768/390/360 في `qa-previews/` — بلا تمرير أفقي
وبلا أخطاء كونسول في وضعي الحركة العادي والمخفّض.

### الوظائف

- رابط تخطي المحتوى: أول محطة Tab، يظهر عند التركيز بحلقة تركيز واضحة.
- قائمة الجوال: تفتح، تغلق بـEscape مع إعادة التركيز إلى الزر، وتغلق عند اختيار
  رابط. أحجام اللمس: 58px للروابط، 46px للزر — فوق حد 44px.
- النموذج الفارغ: خمس رسائل خطأ، `aria-invalid` على كل حقل، والتركيز ينتقل إلى
  أول حقل ناقص.
- التنسيق الخاطئ: رقم جوال قصير وبريد غير صحيح يُرفضان قبل تجهيز الرسالة.
- الطلب المكتمل: رسالة `mailto` إلى `soghagency@gmail.com` تحمل الحقول الستة،
  مع حالة نجاح في `role="status"` ورابط مراجعة قبل الإرسال.

### إمكانية الوصول

- `lang="ar"` و`dir="rtl"`، عنوان `h1` واحد، بلا قفزات في ترتيب العناوين.
- كل عنصر تحكم له اسم، وكل حقل له `<label>` حقيقي، وكل صورة لها `alt`،
  وكل SVG ذي معنى له `role="img"` واسم.
- التباين: أدنى نسبة في النظام 4.5:1 (الكوبالت على العاجي). النص الثانوي
  7.0:1، والثالثي 5.2:1 على العاجي و4.6:1 على mist.
- حالة الخطأ تحمل لونًا وحلقة **ورسالة نصية** — لا اعتماد على اللون وحده.
- الحركة المخفّضة: لا قسم مخفي، ولا مسار غير مرسوم، ولا مسار مرحلي غير ممتلئ.

### الطباعة والإيقاع

- ارتفاع سطر العناوين العرضية 1.12 / 1.08 داخل النطاق المطلوب، مع فاصل
  `gap` بين الأسطر يمنع اصطدام الذيول والتشكيل. فُحصت العناوين بصريًا
  بالدقة الأصلية على 1440 و390 و360 — بلا قص وبلا تصادم.
- ارتفاع الصفحة: 1440px من 7138 إلى **6310** (−12٪)، و390px من 9943 إلى
  **9036** (−9٪).

### قواعد المحتوى (مفروضة في البوابة)

- ستة شعارات عملاء، غير قابلة للنقر، وبلا `cursor: pointer`، وبلا أي نص مرئي.
- لا قسم فريق ولا كيانات `Person` في البيانات المنظمة.
- لا قسم دراسات حالة ما دامت `data/work.ts` فارغة.
- لا رابط واتساب أو لينكدإن أو X — القنوات غير المؤكدة ممنوعة.
- النموذج بلا `action` وبلا كتابة في `localStorage`.

### بيانات الإطلاق

- `noindex` أُزيل بعد التحقق من أن `https://soghagency.com` يستجيب 200 ويخدم
  هذا الموقع.
- canonical وog:url على الدومين الرسمي، وog:image رابط مطلق، وtwitter:card
  من نوع `summary_large_image`.
- بيانات منظمة صالحة: `Organization` و`ProfessionalService` و`WebSite`.

### Lighthouse

على بناء الإنتاج عبر `vite preview` بمحاكاة جوال:

| الفئة | النتيجة |
| --- | ---: |
| الأداء | **87** |
| إمكانية الوصول | **100** |
| أفضل الممارسات | **100** |
| SEO | **100** |

| المؤشر | القيمة |
| --- | ---: |
| أول رسم للمحتوى | 2.4 ث |
| أكبر عنصر مرئي | 3.6 ث |
| زمن الحجب الكلي | **0 مللي ثانية** |
| انزياح التخطيط التراكمي | **0** |
| مؤشر السرعة | 2.4 ث |

نزلت النتيجة نقطتين عن 89 حين تضاعف عدد شعارات العملاء من ثلاثة إلى ستة
(132 كيلوبايت إجمالًا). الشعارات كسولة وأسفل الطية فلا تؤثر على أول رسم ولا
على أكبر عنصر مرئي، ويقيسها Lighthouse بكثافة بكسل 1 بينما هي مجهّزة لشاشات
3×. ما تبقى: ملف الأنماط الخاص بالموقع (7.1 كيلوبايت مضغوط) وهو معماريًا
في محله.

### البناء

```
tsc --noEmit   نظيف
vite build     50 وحدة
               index.html   6.09 kB (gzip 1.90)
               CSS         32.8 kB (gzip 7.13)
               JS         176.2 kB (gzip 55.7)
```

### لم يُنشر

لم يُنفَّذ أي أمر نشر. `dist/` محلي فقط.

---

## v1.0 r2 — Final QA

Date: 2026-07-18  
Verdict: **PASS — local production handoff; not deployed**

## Closed blocker

At a Windows Chrome window of `320×700`, the classic scrollbar reduces the
visible document width to `305px`. The former `body` rule enforced
`min-width: 320px` and masked the resulting overflow with `overflow-x: clip`.
This forced `body`, `#root`, the page sections, and `.public-footer` beyond the
visible document edge.

The final CSS removes the fixed body minimum and the overflow mask, constrains
`html`, `body`, and `#root` to the natural document width, allows layout items
to shrink, and keeps media intrinsically responsive. No approved visual,
content, typography, Hero, motion, contact, or section-structure decision was
changed.

## Windows classic-scrollbar measurement

| Item | Final value |
| --- | ---: |
| Window viewport | `320×700` |
| `documentElement.clientWidth` | `305px` |
| `documentElement.scrollWidth` | `305px` |
| Horizontal overflow | `0px` |
| Method heading bounds | `15px → 290px` (`275px`) |
| Method second line bounds | `28.125px → 290px` (`261.875px`) |
| Footer bounds | `0px → 305px` (`305px`) |
| Edge offenders | `0` |

## Responsive and visual QA

Production preview was checked at `280×700`, `300×700`, `305×700`,
`320×700`, `360×800`, `375×812`, `390×844`, `430×932`, `560×800`,
`768×900`, `1024×768`, `1280×800`, `1338×628`, and `1440×900`.
Every viewport returned `scrollWidth === clientWidth`, zero edge offenders,
loaded fonts, no broken image, and 100% browser zoom. Method, footer, form, and
sticky header remained inside the visible edge.

The full-page `320×700`, `375×812`, and `1338×628` previews plus the Method and
Footer `320×700` close-ups were opened and inspected. Arabic glyphs, dots, and
diacritics are not clipped. The Hero underline remains absent and the Hero
punctuation remains at the approved `60%` size.

## Regression QA

- Build: `npm run build` passed (`tsc --noEmit` + Vite, 30 modules).
- Output: `index-CsqcPn68.js` (`163.57 kB`) and
  `index-FJ0w4iAL.css` (`22.28 kB`) before gzip.
- Dependencies: `npm audit` reported zero vulnerabilities.
- Typography: full suite and pass 3 passed; no collision, clipping, horizontal
  overflow, or font-load layout shift beyond the documented negligible CLS.
- Motion: Hero runs once; AI starts once on viewport entry and does not replay.
  Reduced motion renders the same complete final state immediately.
- Console: zero errors and zero page errors.
- Mobile navigation: opens, closes on Escape, closes after an anchor selection,
  and hides links from focus when closed.
- Form: required name, telephone, service, and brief validation passed. A
  generic test prepares a structured email to `soghagency@gmail.com` containing
  every field while preserving entered data. No backend or browser storage is
  used.
- Accessibility: Arabic language and RTL direction, one H1, no heading-level
  skips, explicit labels and required states, named controls/SVGs, keyboard skip
  link, visible focus, and WCAG AA color contrast passed.
- Public contacts: telephone, email, Instagram, TikTok, and Snapchat only.
- Metadata: Arabic title/description, working favicon and OG image,
  `noindex, nofollow`, no canonical domain, and no `og:url`.
- Content scan: no WhatsApp, X, LinkedIn, Adam Mohammed, internal Sales Kit,
  brand-hub navigation, fake domain, environment file, or secret in `dist`.

## Evidence

- `03-qa-evidence/release-qa-report.json`
- `03-qa-evidence/contrast-report.json`
- `03-qa-evidence/windows-classic-320-metrics.json`
- `03-qa-evidence/full-page-320x700.png`
- `03-qa-evidence/method-320x700.png`
- `03-qa-evidence/footer-320x700.png`
- `03-qa-evidence/full-page-375x812.png`
- `03-qa-evidence/full-page-1338x628.png`
- `03-qa-evidence/hero-motion.webm`
- `03-qa-evidence/reduced-hero.png`
- `03-qa-evidence/reduced-ai.png`

No Vercel or other deployment action was performed.
