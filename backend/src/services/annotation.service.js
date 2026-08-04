const sharp = require('sharp');
const logger = require('../utils/logger');

// Teacher pen colors — green (correct), red (wrong), orange (partial), blue (teacher notes).
const PALETTE = {
  green: '#16a34a',
  red: '#dc2626',
  orange: '#f59e0b',
  blue: '#2563eb',
};

const STATUS_STYLES = {
  correct: { color: PALETTE.green, label: 'Correct', marker: 'tick' },
  partial: { color: PALETTE.orange, label: 'Partial', marker: 'partial' },
  incorrect: { color: PALETTE.red, label: 'Wrong', marker: 'cross' },
  unattempted: { color: PALETTE.orange, label: 'Unattempted', marker: 'unattempted' },
};

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.length ? lines : [''];
}

function clampPx(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Draws the status flag (tick / cross / partial dash / unattempted ring) in
 * the top-right corner of the answer region, like a teacher marking the page.
 */
function drawFlag(color, marker, x, y, flagSize) {
  const sw = Math.max(4, Math.round(flagSize * 0.14));
  switch (marker) {
    case 'tick':
      return `<polyline points="${x + flagSize * 0.08},${y + flagSize * 0.5} ${x + flagSize * 0.35},${y + flagSize * 0.78} ${x + flagSize * 0.92},${y + flagSize * 0.16}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'cross':
      return `<line x1="${x + flagSize * 0.12}" y1="${y + flagSize * 0.12}" x2="${x + flagSize * 0.88}" y2="${y + flagSize * 0.88}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>` +
        `<line x1="${x + flagSize * 0.88}" y1="${y + flagSize * 0.12}" x2="${x + flagSize * 0.12}" y2="${y + flagSize * 0.88}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case 'partial':
      // Small "P" in a rounded badge.
      return `<rect x="${x}" y="${y}" width="${flagSize}" height="${flagSize}" rx="${flagSize * 0.3}" fill="${color}" opacity="0.14"/>` +
        `<text x="${x + flagSize / 2}" y="${y + flagSize * 0.74}" font-family="Arial, sans-serif" font-size="${flagSize * 0.72}" font-weight="bold" fill="${color}" text-anchor="middle">P</text>`;
    case 'unattempted':
      return `<circle cx="${x + flagSize / 2}" cy="${y + flagSize / 2}" r="${flagSize * 0.32}" fill="none" stroke="${color}" stroke-width="${Math.max(3, Math.round(flagSize * 0.1))}"/>` +
        `<text x="${x + flagSize / 2}" y="${y + flagSize * 0.86}" font-family="Arial, sans-serif" font-size="${flagSize * 0.5}" font-weight="bold" fill="${color}" text-anchor="middle">?</text>`;
    default:
      return '';
  }
}

/**
 * Builds an SVG overlay for one page. Draws, like a teacher's red/green pen:
 * status flags, circles/underlines/highlights around specific mistakes, and
 * corrected-answer notes written beside the answer. Original pixels untouched.
 */
function buildOverlaySvg({ width, height, questions, statusStyles }) {
  const parts = [];
  const W = width;
  const H = height;
  const pad = Math.max(8, Math.round(W * 0.01));
  const flagSize = Math.max(22, Math.round(H * 0.038));
  const noteFont = Math.max(13, Math.round(H * 0.024));
  const thin = Math.max(3, Math.round(H * 0.005));

  for (const q of questions) {
    const bbox = q.bbox;
    if (!bbox) continue;
    const x = clampPx(bbox.left * W, 0, W);
    const y = clampPx(bbox.top * H, 0, H);
    const w = clampPx(bbox.width * W, pad * 2, W - x);
    const h = clampPx(bbox.height * H, pad * 1.5, H - y);
    const style = statusStyles[q.status] || statusStyles.incorrect;
    const color = style.color;
    const marker = style.marker;
    const flagX = clampPx(x + w - flagSize, 0, W - flagSize);
    const flagY = clampPx(Math.max(y - flagSize - 6, 0), 0, H - flagSize);

    // Subtle wash behind the whole answer region so markings stand out.
    parts.push(`<rect x="${x - pad * 0.6}" y="${y - pad * 0.8}" width="${w + pad * 1.2}" height="${h + pad * 1.6}" rx="8" fill="${color}" opacity="0.05"/>`);

    // Status flag (tick / cross / P / ?)
    parts.push(drawFlag(color, marker, flagX, flagY, flagSize));

    // Short teacher comment chip near the answer.
    const comment = q.teacherComment || style.label;
    if (comment) {
      const maxChars = Math.max(8, Math.round(w / (noteFont * 0.52)));
      const lines = wrapText(comment, maxChars);
      const cw = Math.max(...lines.map((l) => l.length)) * noteFont * 0.56 + noteFont * 0.9;
      const ch = lines.length * noteFont * 1.2 + 6;
      let cx = clampPx(x, 0, W - cw);
      let cy = Math.min(y + h + 6, H - ch);
      parts.push(
        `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="5" fill="#ffffff" opacity="0.9"/>`,
        `<text x="${cx + noteFont * 0.45}" y="${cy + noteFont + 3}" font-family="Arial, sans-serif" font-size="${noteFont}" font-weight="600" fill="${color}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`
      );
      const textY = cy + ch * 0.5;
      parts.push(`<line x1="${clampPx(x + w, 0, W)}" y1="${clampPx(y + h * 0.5, 0, H)}" x2="${clampPx(cx, 0, W)}" y2="${textY}" stroke="${color}" stroke-width="${thin}" stroke-dasharray="4 3" opacity="0.7"/>`);
    }

    // Corrected text a teacher writes on the page (e.g. "Charles Babbage", "70004 → 70003").
    const teacherNote = q.teacherNote;
    if (teacherNote && (q.status === 'incorrect' || q.status === 'partial' || q.status === 'unattempted')) {
      const maxChars = Math.max(8, Math.round(w / (noteFont * 0.5)));
      const lines = wrapText(teacherNote, maxChars);
      const nw = Math.max(...lines.map((l) => l.length)) * noteFont * 0.6 + noteFont;
      const nh = lines.length * noteFont * 1.25 + 8;
      const nx = clampPx(x + w + 8, 0, W - nw);
      const ny = clampPx(Math.min(y, H - nh), 0, H - nh);
      const noteColor = q.status === 'incorrect' ? PALETTE.blue : PALETTE.blue;
      parts.push(
        `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="6" fill="${noteColor}" opacity="0.1"/>`,
        `<text x="${nx + noteFont * 0.5}" y="${ny + noteFont + 4}" font-family="Arial, sans-serif" font-size="${noteFont}" font-weight="bold" fill="${noteColor}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`
      );
      const leader = Math.min(Math.abs(nx - (x + w)), Math.max(30, W * 0.03));
      parts.push(`<line x1="${clampPx(x + w, 0, W)}" y1="${clampPx(y + h * 0.5, 0, H)}" x2="${clampPx(nx, 0, W)}" y2="${clampPx(ny + nh * 0.5, 0, H)}" stroke="${PALETTE.red}" stroke-width="${thin}" opacity="0.6"/>`);
    }

    // Specific teacher pen marks (circles around wrong answers, underlines, highlights).
    for (const m of q.markups || []) {
      const mb = m.bbox || {};
      if (mb.left === undefined || mb.top === undefined || mb.width === undefined || mb.height === undefined) continue;
      const mx = clampPx(mb.left * W, 0, W);
      const my = clampPx(mb.top * H, 0, H);
      const mw = clampPx(mb.width * W, pad, W - mx);
      const mh = clampPx(mb.height * H, pad, H - my);
      const markColor = q.status === 'partial' ? PALETTE.orange : PALETTE.red;
      const mText = m.text || '';

      switch (m.type) {
        case 'circle':
          parts.push(
            `<ellipse cx="${mx + mw / 2}" cy="${my + mh / 2}" rx="${mw / 2 + pad * 0.5}" ry="${mh / 2 + pad * 0.6}" fill="none" stroke="${markColor}" stroke-width="${thin}" stroke-dasharray="5 4"/>`
          );
          break;
        case 'underline':
          parts.push(
            `<line x1="${mx}" y1="${my + mh + 2}" x2="${mx + mw}" y2="${my + mh + 2}" stroke="${markColor}" stroke-width="${thin}" stroke-linecap="round"/>`,
            `<line x1="${mx}" y1="${my + mh + 2}" x2="${mx + mw}" y2="${my + mh + 2}" stroke="${markColor}" stroke-width="1" opacity="0.5" transform="translate(0 2)"/>`
          );
          break;
        case 'highlight':
          parts.push(
            `<rect x="${mx - 1}" y="${my - 1}" width="${mw + 2}" height="${mh + 2}" rx="3" fill="#fde04755"/>`
          );
          break;
        case 'text':
        default: {
          if (!mText) break;
          const maxChars = Math.max(8, Math.round(W / (noteFont * 0.55)));
          const lines = wrapText(mText, maxChars);
          const tw = Math.max(...lines.map((l) => l.length)) * noteFont * 0.6 + noteFont;
          const th = lines.length * noteFont * 1.25 + 6;
          const tx = clampPx(mx + mw + 4, 0, W - tw);
          const ty = clampPx(my, 0, H - th);
          parts.push(
            `<text x="${tx + noteFont * 0.5}" y="${ty + noteFont + 2}" font-family="Arial, sans-serif" font-size="${noteFont}" font-weight="bold" fill="${noteColorFor(statusOr(q), markColor)}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`,
            `<line x1="${clampPx(mx + mw, 0, W)}" y1="${clampPx(my + mh * 0.5, 0, H)}" x2="${clampPx(tx, 0, W)}" y2="${clampPx(ty + th * 0.5, 0, H)}" stroke="${markColor}" stroke-width="${thin}" opacity="0.6"/>`
          );
          break;
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

function statusOr(q) {
  return q.status || 'incorrect';
}

function noteColorFor(status, fallback) {
  if (status === 'partial') return PALETTE.orange;
  if (status === 'correct') return PALETTE.green;
  if (status === 'unattempted') return PALETTE.orange;
  return fallback || PALETTE.blue;
}

/**
 * Produces an annotated PNG for one page image. The original pixels are kept;
 * only a vector overlay is composited on top — real drawing on the real sheet.
 */
async function annotatePage({ imageBuffer, questions, mimeType = 'image/png' }) {
  const meta = await sharp(imageBuffer, { failOn: 'none' }).metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;

  const svg = buildOverlaySvg({ width, height, questions, statusStyles: STATUS_STYLES });

  const annotated = await sharp(imageBuffer, { failOn: 'none' })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return { buffer: annotated, width, height, statusStyles: STATUS_STYLES };
}

/**
 * Annotates every page image. Returns an array aligned with the input pages.
 */
async function annotatePages({ pageBuffers, questions, mimeTypes }) {
  const results = [];
  for (let i = 0; i < pageBuffers.length; i++) {
    const pageQuestions = (questions || []).filter((q) => Number(q.page) === i + 1);
    logger.debug(`Annotating page ${i + 1} with ${pageQuestions.length} question marks.`);
    results.push(
      await annotatePage({
        imageBuffer: pageBuffers[i],
        questions: pageQuestions,
        mimeType: mimeTypes?.[i] || 'image/png',
      })
    );
  }
  return results;
}

module.exports = { annotatePages, annotatePage, buildOverlaySvg, STATUS_STYLES, PALETTE };