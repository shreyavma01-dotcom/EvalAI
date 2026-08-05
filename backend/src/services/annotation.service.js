const sharp = require('sharp');
const logger = require('../utils/logger');

// Teacher pen colors — green (correct), red (wrong), orange (partial), blue (teacher notes).
const PALETTE = {
  green: '#16a34a',
  red: '#dc2626',
  orange: '#f59e0b',
  blue: '#2563eb',
  ink: '#1f2937',
};

const STATUS_STYLES = {
  correct: { color: PALETTE.green, label: 'Correct', marker: 'tick' },
  partial: { color: PALETTE.orange, label: 'Partial', marker: 'tick' },
  incorrect: { color: PALETTE.red, label: 'Wrong', marker: 'cross' },
  unattempted: { color: PALETTE.orange, label: 'Unattempted', marker: 'unattempted' },
};

const CIRCLED_NUMBERS = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465', '\u2466', '\u2467', '\u2468', '\u2469'];
const HAND_FONT = "'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive";
const SANS_FONT = "Arial, sans-serif";

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
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Builds a zig-zag "squiggly underline" path (teacher pen for spelling/grammar).
 */
function squigglePath(x, y, w, amplitude, step) {
  const parts = [`M ${x} ${y}`];
  let curX = x;
  let i = 0;
  while (curX < x + w) {
    curX = Math.min(x + w, curX + step);
    i += 1;
    parts.push(`L ${curX} ${y + (i % 2 === 0 ? amplitude : -amplitude)}`);
  }
  return parts.join(' ');
}

/**
 * Draws the status marker (tick / cross / ring) as a teacher would in the margin.
 */
function drawMarker(color, marker, x, y, size) {
  const sw = Math.max(4, Math.round(size * 0.13));
  switch (marker) {
    case 'tick':
      return `<polyline points="${x + size * 0.06},${y + size * 0.52} ${x + size * 0.34},${y + size * 0.8} ${x + size * 0.94},${y + size * 0.14}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'cross':
      return `<line x1="${x + size * 0.1}" y1="${y + size * 0.1}" x2="${x + size * 0.9}" y2="${y + size * 0.9}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>` +
        `<line x1="${x + size * 0.9}" y1="${y + size * 0.1}" x2="${x + size * 0.1}" y2="${y + size * 0.9}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case 'unattempted':
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.3}" fill="none" stroke="${color}" stroke-width="${Math.max(3, Math.round(size * 0.09))}"/>` +
        `<text x="${x + size / 2}" y="${y + size * 0.88}" font-family="${SANS_FONT}" font-size="${size * 0.5}" font-weight="bold" fill="${color}" text-anchor="middle">?</text>`;
    default:
      return '';
  }
}

/**
 * Builds an SVG overlay for one page. Draws teacher-style marks that never
 * cover the handwriting: status markers and small labels live in the page
 * margin, fine pen marks (underline / strike / squiggle / circle / highlight)
 * target only the wrong phrase, comments and corrections are written in the
 * margin and connected with dotted leader lines. A per-page summary strip is
 * drawn at the bottom of the page. Original pixels are untouched.
 */
function buildOverlaySvg({ width, height, questions, statusStyles }) {
  const parts = [];
  const W = width;
  const H = height;
  const pad = Math.max(8, Math.round(W * 0.008));
  const marginW = clampPx(Math.round(W * 0.14), 110, 250);
  const markerSize = Math.max(20, Math.round(H * 0.032));
  const labelFont = Math.max(11, Math.round(H * 0.018));
  const noteFont = Math.max(13, Math.round(H * 0.022));
  const thin = Math.max(2.5, Math.round(H * 0.0045));
  const gap = Math.max(6, Math.round(noteFont * 0.6));

  // Simple column allocator so stacked margin notes never overlap each other.
  const sideBlocks = { right: [], left: [] };
  function placeBlock(side, top, blockHeight) {
    let t = top;
    for (let i = 0; i < 10; i += 1) {
      const hit = sideBlocks[side].find((b) => t < b.bottom + gap && t + blockHeight > b.top - gap);
      if (!hit) break;
      t = hit.bottom + gap;
    }
    sideBlocks[side].push({ top: t, bottom: t + blockHeight });
    return t;
  }

  // Per-page summary tallied from the questions on THIS page only.
  const counts = { correct: 0, partial: 0, incorrect: 0, unattempted: 0 };
  let obtained = 0;
  let total = 0;
  for (const q of questions) {
    const key = STATUS_STYLES[q.status] ? q.status : 'incorrect';
    counts[key] += 1;
    obtained += Number(q.obtainedMarks) || 0;
    total += Number(q.maxMarks) || 0;
  }

  for (const q of questions) {
    const bbox = q.bbox;
    if (!bbox) continue;
    const x = clampPx(bbox.left * W, 0, W);
    const y = clampPx(bbox.top * H, 0, H);
    const w = clampPx(bbox.width * W, pad * 2, W - x);
    const h = clampPx(bbox.height * H, pad * 1.5, H - y);
    const style = statusStyles[q.status] || statusStyles.incorrect;
    const color = style.color;

    // Margin column: right by default, left when the answer reaches the right edge.
    const side = x + w + marginW + pad * 2 <= W ? 'right' : 'left';
    const colX = side === 'right' ? W - marginW - pad : pad;
    const anchorX = side === 'right' ? x + w : x;
    const anchorY = clampPx(y + h * 0.5, 0, H);

    // --- Assemble margin block (marker + label + comments + note + callouts) ---
    const rows = [];
    rows.push({ kind: 'marker', marker: style.marker, color, label: style.label });

    const comment = q.teacherComment && q.teacherComment !== style.label ? q.teacherComment : '';
    if (comment) rows.push({ kind: 'comment', text: comment, color });

    if (q.teacherNote && (q.status === 'incorrect' || q.status === 'partial')) {
      rows.push({ kind: 'note', text: q.teacherNote, color: PALETTE.blue });
    }

    for (const [i, pt] of (q.missingPoints || []).slice(0, 10).entries()) {
      rows.push({ kind: 'callout', text: pt, num: i + 1, color: PALETTE.orange });
    }

    const maxChars = Math.max(10, Math.round((marginW - 10) / (noteFont * 0.52)));
    const rowHeights = rows.map((r) => {
      if (r.kind === 'marker') return markerSize + labelFont * 1.5;
      const lines = wrapText(r.kind === 'callout' ? `${CIRCLED_NUMBERS[r.num - 1] || `(${r.num})`} ${r.text}` : r.text, maxChars);
      return lines.length * noteFont * 1.3 + 8;
    });
    const blockHeight = rowHeights.reduce((s, rh) => s + rh + gap, 0) - gap;
    const blockTop = placeBlock(side, clampPx(anchorY - blockHeight / 2, pad, Math.max(pad, H - blockHeight - pad)), blockHeight);

    // Dotted leader from the answer edge into the margin column.
    parts.push(
      `<line x1="${anchorX}" y1="${anchorY}" x2="${side === 'right' ? colX + 4 : colX + marginW - 4}" y2="${clampPx(blockTop + Math.min(rowHeights[0], blockHeight) / 2, 0, H)}" stroke="${color}" stroke-width="${Math.max(1.5, thin * 0.7)}" stroke-dasharray="3 4" opacity="0.6"/>`
    );

    // --- Row content ---
    let ry = blockTop;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (r.kind === 'marker') {
        const mx = colX + (marginW - markerSize) / 2;
        parts.push(drawMarker(r.color, r.marker, mx, ry, markerSize));
        parts.push(
          `<text x="${colX + marginW / 2}" y="${ry + markerSize + labelFont}" font-family="${SANS_FONT}" font-size="${labelFont}" font-weight="700" fill="${r.color}" text-anchor="middle">${escapeXml(r.label)}</text>`
        );
      } else {
        const text = r.kind === 'callout' ? `${CIRCLED_NUMBERS[r.num - 1] || `(${r.num})`} ${r.text}` : r.text;
        const lines = wrapText(text, maxChars);
        const textX = colX + noteFont * 0.5;
        if (r.kind === 'note') {
          // Handwritten correction in blue.
          parts.push(
            `<text x="${textX}" y="${ry + noteFont}" font-family="${HAND_FONT}" font-style="italic" font-size="${noteFont}" font-weight="bold" fill="${r.color}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`
          );
        } else {
          // Comment bubble / numbered callout.
          const cw = marginW - noteFont;
          const ch = lines.length * noteFont * 1.3 + 8;
          parts.push(
            `<rect x="${colX}" y="${ry}" width="${cw}" height="${ch}" rx="6" fill="#ffffff" opacity="0.88" stroke="${r.color}" stroke-width="1.5"/>`,
            `<text x="${textX}" y="${ry + noteFont + 2}" font-family="${SANS_FONT}" font-size="${noteFont}" font-weight="600" fill="${r.color}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`
          );
        }
      }
      ry += rowHeights[i] + gap;
    }

    // --- Fine pen marks on the handwriting itself (only the wrong phrase) ---
    for (const m of q.markups || []) {
      const mb = m.bbox || {};
      if (mb.left === undefined || mb.top === undefined || mb.width === undefined || mb.height === undefined) continue;
      const mx = clampPx(mb.left * W, 0, W);
      const my = clampPx(mb.top * H, 0, H);
      const mw = clampPx(mb.width * W, pad, W - mx);
      const mh = clampPx(mb.height * H, pad, H - my);
      const markColor = q.status === 'partial' ? PALETTE.orange : q.status === 'correct' ? PALETTE.green : PALETTE.red;
      const mText = m.text || '';
      const combined = `${mText} ${comment} ${q.teacherComment || ''}`.toLowerCase();
      const isSpelling = /\bspelling\b|spelling mistake|misspelt|misspelled|spell/i.test(combined);
      const isGrammar = /grammar|grammatical|grammatically/i.test(combined);

      switch (m.type) {
        case 'circle':
          parts.push(
            `<ellipse cx="${mx + mw / 2}" cy="${my + mh / 2}" rx="${mw / 2 + pad * 0.4}" ry="${mh / 2 + pad * 0.5}" fill="none" stroke="${markColor}" stroke-width="${thin}" stroke-dasharray="4 3"/>`
          );
          break;
        case 'underline':
          if (isSpelling) {
            parts.push(
              `<path d="${squigglePath(mx, my + mh + 3, mw, Math.max(3, noteFont * 0.22), Math.max(6, noteFont * 0.65))}" fill="none" stroke="${PALETTE.red}" stroke-width="${thin}" stroke-linecap="round"/>`,
              `<text x="${clampPx(mx + mw + 4, 0, W - 40)}" y="${clampPx(my + mh + 3, 0, H - 4)}" font-family="${SANS_FONT}" font-size="${labelFont}" font-weight="700" fill="${PALETTE.red}">Spelling</text>`
            );
          } else if (isGrammar) {
            parts.push(
              `<path d="${squigglePath(mx, my + mh + 3, mw, Math.max(3, noteFont * 0.22), Math.max(6, noteFont * 0.65))}" fill="none" stroke="${PALETTE.blue}" stroke-width="${thin}" stroke-linecap="round"/>`,
              `<text x="${clampPx(mx + mw + 4, 0, W - 40)}" y="${clampPx(my + mh + 3, 0, H - 4)}" font-family="${SANS_FONT}" font-size="${labelFont}" font-weight="700" fill="${PALETTE.blue}">Grammar</text>`
            );
          } else if (q.status === 'incorrect') {
            // Strike through only the wrong phrase.
            parts.push(
              `<line x1="${mx}" y1="${clampPx(my + mh * 0.5, 0, H)}" x2="${mx + mw}" y2="${clampPx(my + mh * 0.5, 0, H)}" stroke="${PALETTE.red}" stroke-width="${thin}" stroke-linecap="round"/>`
            );
          } else {
            // Thin single underline for partial / correct status.
            parts.push(
              `<line x1="${mx}" y1="${my + mh + 2}" x2="${mx + mw}" y2="${my + mh + 2}" stroke="${markColor}" stroke-width="${thin}" stroke-linecap="round"/>`
            );
          }
          break;
        case 'highlight':
          parts.push(
            `<rect x="${mx - 1}" y="${my - 1}" width="${mw + 2}" height="${mh + 2}" rx="3" fill="#fde04733"/>`
          );
          break;
        case 'text':
        default: {
          if (!mText) break;
          const maxChars = Math.max(8, Math.round((W * 0.35) / (noteFont * 0.55)));
          const lines = wrapText(mText, maxChars);
          const tw = Math.max(...lines.map((l) => l.length)) * noteFont * 0.6 + noteFont;
          const th = lines.length * noteFont * 1.25 + 6;
          const tx = clampPx(mx + mw + 4, 0, W - tw);
          const ty = clampPx(my, 0, H - th);
          parts.push(
            `<text x="${tx + noteFont * 0.5}" y="${ty + noteFont + 2}" font-family="${SANS_FONT}" font-size="${noteFont}" font-weight="bold" fill="${markColor}">${lines.map((l) => escapeXml(l)).join('&#10;')}</text>`,
            `<line x1="${clampPx(mx + mw, 0, W)}" y1="${clampPx(my + mh * 0.5, 0, H)}" x2="${clampPx(tx, 0, W)}" y2="${clampPx(ty + th * 0.5, 0, H)}" stroke="${markColor}" stroke-width="${Math.max(1.5, thin * 0.7)}" stroke-dasharray="3 4" opacity="0.6"/>`
          );
          break;
        }
      }
    }
  }

  // --- Per-page summary strip at the bottom of the page ---
  if (questions.length > 0) {
    const footerFont = Math.max(13, Math.round(H * 0.022));
    const parts_ = [];
    const add = (txt, color) => {
      parts_.push(`<tspan fill="${color}">${escapeXml(txt)}</tspan>`);
    };
    add(`\u2713 Correct: ${counts.correct}   `, PALETTE.green);
    add(`\u2717 Wrong: ${counts.incorrect}   `, PALETTE.red);
    add(`\u26A0 Partial: ${counts.partial}   `, PALETTE.orange);
    add(`Unattempted: ${counts.unattempted}   `, PALETTE.ink);
    add(`\u00B7   Page Score: ${obtained}/${total}`, PALETTE.ink);
    const raw = parts_.join('');
    const approxWidth = raw.length * footerFont * 0.56;
    const fw = Math.min(W - pad * 2, approxWidth + footerFont * 2);
    const fx = (W - fw) / 2;
    const fy = H - footerFont * 2.8;
    parts.push(
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${footerFont * 2.2}" rx="${footerFont}" fill="#ffffff" opacity="0.85" stroke="#d1d5db" stroke-width="1"/>`,
      `<text x="${W / 2}" y="${fy + footerFont * 1.45}" font-family="${SANS_FONT}" font-size="${footerFont}" font-weight="600" text-anchor="middle">${raw}</text>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
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
