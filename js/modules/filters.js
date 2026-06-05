const SORTERS = {
  editorial: (a, b) => 0,
  "date-desc": (a, b) => new Date(b.posted) - new Date(a.posted),
  "date-asc": (a, b) => new Date(a.posted) - new Date(b.posted),
  engagement: (a, b) => b.favorites - a.favorites || b.views - a.views,
  views: (a, b) => b.views - a.views || b.favorites - a.favorites,
};

export function filterPosts(posts, { query, type, excludeIds = [] }) {
  const normalizedQuery = query.trim().toLowerCase();
  const excluded = new Set(excludeIds);

  const filtered = posts.filter((post) => {
    if (excluded.has(post.post_id)) {
      return false;
    }

    if (type !== "all" && post.type !== type) {
      return false;
    }

    if (normalizedQuery && !post.content.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    return true;
  });

  return filtered;
}

export function sortPosts(posts, sort) {
  const sorter = SORTERS[sort] ?? SORTERS.editorial;
  return [...posts].sort(sorter);
}

export function computeStats(posts, { filteredCount, visibleCount }) {
  if (!posts.length) {
    return {
      total: 0,
      directElon: 0,
      dateRange: "—",
      showing: "0 of 0",
    };
  }

  const timestamps = posts.map((post) => new Date(post.posted).getTime());
  const minYear = new Date(Math.min(...timestamps)).getFullYear();
  const maxYear = new Date(Math.max(...timestamps)).getFullYear();

  const directElon = posts.filter((post) => /@elonmusk/i.test(post.content)).length;
  const displayed = Math.min(visibleCount, filteredCount);

  return {
    total: posts.length,
    directElon,
    dateRange: minYear === maxYear ? String(minYear) : `${minYear}–${maxYear}`,
    showing: filteredCount ? `${displayed} of ${filteredCount}` : "0 of 0",
  };
}
