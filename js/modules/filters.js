const SORTERS = {
  contradiction: (a, b) =>
    b.score - a.score ||
    b.favorites - a.favorites ||
    b.views - a.views,
  "date-desc": (a, b) => new Date(b.posted) - new Date(a.posted),
  "date-asc": (a, b) => new Date(a.posted) - new Date(b.posted),
  engagement: (a, b) => b.favorites - a.favorites || b.views - a.views,
  views: (a, b) => b.views - a.views || b.favorites - a.favorites,
};

export function filterPosts(posts, { query, type, minScore, sort, excludeIds = [] }) {
  const normalizedQuery = query.trim().toLowerCase();
  const excluded = new Set(excludeIds);

  let filtered = posts.filter((post) => {
    if (excluded.has(post.post_id)) {
      return false;
    }

    if (type !== "all" && post.type !== type) {
      return false;
    }

    if (post.score < minScore) {
      return false;
    }

    if (normalizedQuery && !post.content.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    return true;
  });

  const sorter = SORTERS[sort] ?? SORTERS.contradiction;
  return [...filtered].sort(sorter);
}

export function getFeaturedPosts(posts, limit = 3, minScore = 8) {
  return posts
    .filter((post) => post.score >= minScore)
    .sort((a, b) => b.score - a.score || b.favorites - a.favorites)
    .slice(0, limit);
}

export function computeStats(posts, { filteredCount, visibleCount }) {
  if (!posts.length) {
    return {
      total: 0,
      directElon: 0,
      dateRange: "—",
      showing: "0",
      strong: 0,
    };
  }

  const timestamps = posts.map((post) => new Date(post.posted).getTime());
  const minYear = new Date(Math.min(...timestamps)).getFullYear();
  const maxYear = new Date(Math.max(...timestamps)).getFullYear();

  const directElon = posts.filter((post) => /@elonmusk/i.test(post.content)).length;
  const strong = posts.filter((post) => post.score >= 8).length;
  const displayed = Math.min(visibleCount, filteredCount);

  return {
    total: posts.length,
    directElon,
    dateRange: minYear === maxYear ? String(minYear) : `${minYear}–${maxYear}`,
    showing: filteredCount ? `${displayed} of ${filteredCount}` : "0 of 0",
    strong,
  };
}
