const HIGHLIGHT_PATTERNS = [
  /@elonmusk/gi,
  /\belon musk\b/gi,
  /\belon\b/gi,
  /\bmusk\b/gi,
  /\bthank you\b/gi,
  /\bsaving america\b/gi,
  /\bgenius\b/gi,
  /\bgreatest\b/gi,
  /\bhero\b/gi,
  /\bmodern tea party\b/gi,
  /\bone of my favorites\b/gi,
  /\bawesome\b/gi,
  /\bamazing\b/gi,
  /\bgrok\b/gi,
  /\bxai\b/gi,
  /\bdoge\b/gi,
  /\btesla\b/gi,
  /\bspacex\b/gi,
  /\bstarlink\b/gi,
  /\bfree speech\b/gi,
  /\busaid\b/gi,
];

const TRUNCATE_LENGTH = 320;

export function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function highlightContent(text) {
  const ranges = [];

  for (const pattern of HIGHLIGHT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  if (!ranges.length) {
    return escapeHtml(text);
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged = [ranges[0]];

  for (let i = 1; i < ranges.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = ranges[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  let result = "";
  let cursor = 0;

  for (const { start, end } of merged) {
    result += escapeHtml(text.slice(cursor, start));
    result += `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
    cursor = end;
  }

  result += escapeHtml(text.slice(cursor));
  return result;
}

export function shouldTruncate(text, maxLength = TRUNCATE_LENGTH) {
  return text.length > maxLength;
}

export function truncateText(text, maxLength = TRUNCATE_LENGTH) {
  if (text.length <= maxLength) {
    return text;
  }

  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const end = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  return `${text.slice(0, end).trim()}…`;
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function hasActiveFilters({ query, type, minScore, sort }) {
  return Boolean(
    query.trim() ||
      type !== "all" ||
      Number(minScore) > 0 ||
      sort !== "contradiction",
  );
}
