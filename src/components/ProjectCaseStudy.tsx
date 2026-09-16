import type { CaseStudy, WorkMedia } from "../data/work";
import { ArrowIcon } from "./glyphs";

/**
 * One case study: an editorial spread, not a card.
 *
 * The parts are flat children of the article rather than a text column plus a
 * media column, so the stacked layout needs no `order` juggling: DOM order IS
 * the mobile reading order, and the desktop spread is made purely by grid
 * placement. That matters because some of this media contains focusable
 * controls — visual, reading and focus order have to agree.
 *
 * Where the media sits in that order is a per-study decision, not a global one.
 * A campaign ecosystem reads best as statement -> evidence -> explanation, so
 * its media follows the title. An engagement whose point is the SYSTEM reads
 * better as claim -> explanation -> evidence, so its media follows the
 * capabilities. Both are expressed by moving one block, not by reordering
 * anything visually.
 */
export function ProjectCaseStudy({ study, flip }: { study: CaseStudy; flip: boolean }) {
  const hasMedia = study.media.length > 0;
  const titleId = `work-${study.id}-title`;
  const dossier = study.layout === "dossier";
  const mosaic = study.layout === "mosaic";

  const renderMedia = (media: WorkMedia, i: number) =>
    media.video ? (
      /*
       * A video the visitor starts. No autoplay, so there is nothing for
       * reduced-motion to suppress, and `preload="none"` means the file is not
       * fetched until they press play — the poster carries the slot until then.
       */
      <video
        key={media.src}
        className="case__shot case__shot--video"
        poster={media.src}
        width={media.width}
        height={media.height}
        controls
        muted
        playsInline
        preload="none"
        aria-label={media.videoLabel ?? media.alt}
      >
        <source src={media.video} type="video/mp4" />
      </video>
    ) : (
      <img
        key={media.src}
        className="case__shot"
        src={media.src}
        srcSet={media.src900 ? `${media.src900} 760w, ${media.src} ${media.width}w` : undefined}
        sizes={
          media.src900
            ? mosaic && i === 0
              ? /* the mosaic lead spans the whole container, not a column */
                "(min-width: 1360px) 1240px, 92vw"
              : "(min-width: 1000px) 56vw, 92vw"
            : undefined
        }
        width={media.width}
        height={media.height}
        alt={media.alt}
        loading="lazy"
        decoding="async"
        /* the mosaic's first item is its dominant visual */
        data-lead={mosaic && i === 0 ? "" : undefined}
      />
    );

  const mediaBlock = hasMedia ? (
    <div
      className={`case__media${mosaic ? " case__media--mosaic" : ""}${
        dossier ? " case__media--stack" : ""
      }`}
    >
      {dossier ? (
        <>
          {renderMedia(study.media[0], 0)}
          {study.media.length > 1 && (
            <div className="case__media-pair">
              {study.media.slice(1).map((media, i) => renderMedia(media, i + 1))}
            </div>
          )}
        </>
      ) : (
        study.media.map(renderMedia)
      )}
    </div>
  ) : null;

  const recordBlock = study.record ? (
    <div className={`case__record${hasMedia ? "" : " case__media"}`}>
      <p className="case__record-label">ما نُفِّذ</p>
      <ul>
        {study.record.map((row) => (
          <li key={row.label}>{row.label}</li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <article
      className={`case${hasMedia ? "" : " case--record"}${flip ? " case--flip" : ""}${
        !mosaic && !dossier && study.media.length > 1 ? " case--pair" : ""
      }${mosaic ? " case--mosaic" : ""}${dossier ? " case--dossier" : ""}`}
      aria-labelledby={titleId}
    >
      <p className="case__index">
        <span className="num ltr">{study.index}</span>
      </p>

      <h3 className="case__title" id={titleId}>
        {study.latinName ? (
          <span className="case__name ltr">{study.name}</span>
        ) : (
          <span className="case__name">{study.name}</span>
        )}
        <span className="case__statement">{study.statement}</span>
      </h3>

      {/* evidence before the explanation, except where the system IS the story */}
      {!dossier && mediaBlock}
      {!dossier && recordBlock}

      <p className="case__desc">{study.description}</p>

      <ul className="case__caps">
        {study.capabilities.map((capability) => (
          <li key={capability}>{capability}</li>
        ))}
      </ul>

      {dossier && mediaBlock}
      {dossier && recordBlock}

      {/*
        Verified campaign figures, quoted from a client report. The note is not
        decoration: it is what stops "403" from being read as 403 bookings, so
        it renders whenever the figures do.
      */}
      {study.metrics && (
        <div className="case__metrics">
          <dl>
            {study.metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="case__metric-value">{metric.value}</dt>
                <dd className="case__metric-label">{metric.label}</dd>
              </div>
            ))}
          </dl>
          {study.metricsNote && <p className="case__metrics-note">{study.metricsNote}</p>}
        </div>
      )}

      {/* rendered only when a real destination exists — see data/work.ts */}
      {study.href && (
        <a className="case__link" href={study.href} target="_blank" rel="noopener noreferrer">
          عرض المشروع
          <ArrowIcon />
        </a>
      )}
    </article>
  );
}
