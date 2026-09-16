import { contact, emailHref, phoneHref, socialLinks } from "../contact";
import { LEGAL_ENTITY_AR, NAV, SITE_NAME_EN } from "../data/site";
import { HAS_CASE_STUDIES } from "../data/work";

const LINKS = HAS_CASE_STUDIES
  ? [...NAV.slice(0, 3), { id: "work", label: "أعمالنا" }, ...NAV.slice(3)]
  : NAV;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer on-ink">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <img
            src="/brand/sogh-lockup-bilingual-horizontal-white.svg"
            alt="صَوْغ | SOGH"
            width={200}
            height={46}
            loading="lazy"
          />
          <p>وكالة تسويق ونمو سعودية.</p>
        </div>

        <nav className="site-footer__nav" aria-label="روابط الموقع">
          <h2 className="site-footer__heading">الموقع</h2>
          <ul>
            {LINKS.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__contact">
          <h2 className="site-footer__heading">تواصل</h2>
          <ul>
            <li>
              <a href={phoneHref}>
                <bdi>{contact.phone}</bdi>
              </a>
            </li>
            <li>
              <a href={emailHref}>
                <bdi>{contact.email}</bdi>
              </a>
            </li>
          </ul>
        </div>

        {socialLinks.length > 0 && (
          <div className="site-footer__social">
            <h2 className="site-footer__heading">تابعنا</h2>
            <ul>
              {socialLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.label} <bdi>{item.handle}</bdi>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="site-footer__legal">
          <small>
            جميع الحقوق محفوظة <bdi>© {year} {SITE_NAME_EN}</bdi> — صَوْغ.
          </small>
          <small>
            علامة تجارية تُشغَّل بواسطة <bdi>{LEGAL_ENTITY_AR}</bdi>.
          </small>
        </div>
      </div>
    </footer>
  );
}
