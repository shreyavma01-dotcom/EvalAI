const sharp = require('sharp');

/**
 * Deterministic page-quality observation built on the existing sharp
 * dependency. Plain image statistics only — every observation is cheap and
 * reproducible, no ML involved.
 */
const THRESHOLDS = {
  minWidth: 600, // px — below this handwriting detail is unreliable
  brightnessMin: 55, // 0-255 mean channel brightness
  brightnessMax: 245, // clean scans are often bright; only flag washed-out pages
  contrastMin: 35, // mean channel standard deviation
  contrastBlank: 25, // together with near-zero entropy: blank page
  entropyBlank: 1.0, // bits — together with low contrast: blank page
  sharpnessBlur: 1.0, // sharp's Laplacian-based sharpness estimate; below this: possible blur
};

function averageChannelStat(stats, key) {
  const channels = Array.isArray(stats?.channels) ? stats.channels : [];
  if (channels.length === 0) return 0;
  return channels.reduce((sum, c) => sum + (Number(c[key]) || 0), 0) / channels.length;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Analyzes one normalized page image and returns a quality observation:
 * { pageNumber, quality, issues[], metrics{width,height,brightness,contrast,entropy,sharpness} }
 */
async function observePageQuality(buffer, pageNumber) {
  const image = sharp(buffer, { failOn: 'none' });
  const [meta, stats] = await Promise.all([image.metadata(), image.stats()]);

  const metrics = {
    width: meta.width || 0,
    height: meta.height || 0,
    brightness: round(averageChannelStat(stats, 'mean')),
    contrast: round(averageChannelStat(stats, 'stdev')),
    entropy: round(Number(stats.entropy) || 0, 2),
    sharpness: round(Number(stats.sharpness) || 0, 2),
  };

  const issues = [];
  if (metrics.width > 0 && metrics.width < THRESHOLDS.minWidth) issues.push('low_resolution');
  if (metrics.brightness < THRESHOLDS.brightnessMin) issues.push('too_dark');
  if (metrics.brightness > THRESHOLDS.brightnessMax) issues.push('too_bright');
  if (metrics.contrast < THRESHOLDS.contrastMin) issues.push('low_contrast');
  const isBlank = metrics.contrast < THRESHOLDS.contrastBlank && metrics.entropy < THRESHOLDS.entropyBlank;
  if (isBlank) {
    issues.push('nearly_blank');
  } else if (metrics.sharpness < THRESHOLDS.sharpnessBlur) {
    issues.push('possible_blur');
  }

  const critical = ['nearly_blank', 'low_contrast', 'too_dark', 'too_bright', 'low_resolution'];
  const quality = issues.some((issue) => critical.includes(issue)) ? 'poor' : issues.length > 0 ? 'fair' : 'good';

  return { pageNumber, quality, issues, metrics };
}

function summarizeObservation(observation) {
  if (!observation) return '';
  if (!observation.issues || observation.issues.length === 0) {
    return `Page ${observation.pageNumber} looks clear (${observation.quality} quality) — no preprocessing needed.`;
  }
  return `Page ${observation.pageNumber} quality is ${observation.quality}: ${observation.issues.join(', ')}.`;
}

module.exports = { observePageQuality, summarizeObservation, THRESHOLDS };