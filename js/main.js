import { loadPosts } from "./modules/api.js";
import { filterPosts, getFeaturedPosts, computeStats } from "./modules/filters.js";
import {
  renderActiveFilters,
  renderFeatured,
  renderPostList,
  renderStats,
  showLoading,
  updateLoadMore,
} from "./modules/render.js";
import { createState } from "./modules/state.js";
import { debounce, hasActiveFilters } from "./modules/utils.js";

const PAGE_SIZE = 25;
const FEATURED_COUNT = 3;
const FEATURED_MIN_SCORE = 8;

const elements = {
  stats: {
    total: document.getElementById("stat-total"),
    direct: document.getElementById("stat-direct"),
    span: document.getElementById("stat-span"),
    showing: document.getElementById("stat-showing"),
    strong: document.getElementById("stat-strong"),
  },
  search: document.getElementById("search-input"),
  sort: document.getElementById("sort-select"),
  type: document.getElementById("type-select"),
  minScore: document.getElementById("min-score"),
  quickFilters: document.getElementById("quick-filters"),
  activeFilters: document.getElementById("active-filters"),
  featured: document.getElementById("featured"),
  featuredGrid: document.getElementById("featured-grid"),
  feed: document.getElementById("feed"),
  postList: document.getElementById("post-list"),
  emptyState: document.getElementById("empty-state"),
  loadMore: document.getElementById("load-more"),
  feedCount: document.getElementById("feed-count"),
  dataGenerated: document.getElementById("data-generated"),
};

const store = createState();

function deriveLists(state) {
  const filters = {
    posts: state.posts,
    query: state.query,
    sort: state.sort,
    type: state.type,
    minScore: Number(state.minScore),
  };

  const filtersActive = hasActiveFilters(state);
  const featured = filtersActive
    ? []
    : getFeaturedPosts(filters.posts, FEATURED_COUNT, FEATURED_MIN_SCORE);
  const featuredIds = featured.map((post) => post.post_id);
  const filtered = filterPosts(filters.posts, { ...filters, excludeIds: featuredIds });

  return { filtered, featured, filtersActive };
}

function updateFilters(partial, { resetVisible = true } = {}) {
  const state = { ...store.get(), ...partial };
  const { filtered, featured, filtersActive } = deriveLists(state);

  store.set({
    ...partial,
    filtered,
    featured,
    filtersActive,
    visibleCount: resetVisible
      ? PAGE_SIZE
      : Math.min(state.visibleCount, filtered.length),
  });
}

function render() {
  const { filtered, featured, visibleCount, posts, filtersActive, query, sort, type, minScore } =
    store.get();

  const totalMatching = filtered.length + featured.length;
  const displayedInFeed = Math.min(visibleCount, filtered.length);
  const displayedTotal = displayedInFeed + (filtersActive ? 0 : featured.length);

  const stats = computeStats(posts, {
    filteredCount: totalMatching,
    visibleCount: displayedTotal,
  });

  renderStats(elements.stats, stats);

  if (featured.length && !filtersActive) {
    elements.featured.hidden = false;
    renderFeatured(elements.featuredGrid, featured);
  } else {
    elements.featured.hidden = true;
    elements.featuredGrid.replaceChildren();
  }

  renderActiveFilters(
    elements.activeFilters,
    { query, sort, type, minScore },
    clearFilter,
  );

  if (elements.feedCount) {
    if (filtersActive) {
      elements.feedCount.textContent = `Showing ${displayedTotal} of ${totalMatching} matching posts`;
    } else {
      elements.feedCount.textContent = `Showing ${displayedTotal} of ${totalMatching} posts`;
    }
  }

  if (!totalMatching) {
    elements.postList.replaceChildren();
    elements.emptyState.textContent = "No posts match your search. Try different words or clear your filters.";
    elements.emptyState.hidden = false;
    elements.loadMore.hidden = true;
    return;
  }

  if (filtered.length) {
    elements.emptyState.hidden = true;
    renderPostList(elements.postList, filtered.slice(0, visibleCount));
  } else {
    elements.postList.replaceChildren();
    elements.emptyState.textContent =
      "No other posts match your search. The highlighted posts above are the only results.";
    elements.emptyState.hidden = false;
  }

  updateLoadMore(elements.loadMore, visibleCount, filtered.length);
}

function syncControls(values) {
  if (values.query !== undefined) elements.search.value = values.query;
  if (values.sort) elements.sort.value = values.sort;
  if (values.type) elements.type.value = values.type;
  if (values.minScore !== undefined) elements.minScore.value = String(values.minScore);
}

function clearFilter(key) {
  const resets = {
    query: { query: "" },
    type: { type: "all" },
    minScore: { minScore: 0 },
    sort: { sort: "contradiction" },
    all: { query: "", type: "all", minScore: 0, sort: "contradiction" },
  };

  const patch = resets[key] ?? resets.all;
  syncControls(patch);
  updateFilters(patch);
  elements.feed.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindControls() {
  const debouncedSearch = debounce((value) => {
    updateFilters({ query: value });
  });

  elements.search.addEventListener("input", (event) => {
    debouncedSearch(event.target.value);
  });

  elements.sort.addEventListener("change", (event) => {
    updateFilters({ sort: event.target.value });
  });

  elements.type.addEventListener("change", (event) => {
    updateFilters({ type: event.target.value });
  });

  elements.minScore.addEventListener("change", (event) => {
    updateFilters({ minScore: Number(event.target.value) });
  });

  elements.loadMore.addEventListener("click", () => {
    const { visibleCount, filtered } = store.get();
    store.set({
      visibleCount: Math.min(visibleCount + PAGE_SIZE, filtered.length),
    });
  });

  elements.quickFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick]");
    if (!button) return;

    const { quick } = button.dataset;

    if (quick === "strong") {
      syncControls({ query: "", minScore: 8, sort: "contradiction", type: "all" });
      updateFilters({ query: "", minScore: 8, sort: "contradiction", type: "all" });
    } else if (quick === "direct") {
      syncControls({
        query: "@elonmusk",
        minScore: 0,
        sort: "contradiction",
        type: "all",
      });
      updateFilters({
        query: "@elonmusk",
        minScore: 0,
        sort: "contradiction",
        type: "all",
      });
    } else if (quick === "reset") {
      clearFilter("all");
    }
  });

  store.subscribe(render);
}

async function init() {
  showLoading(elements.postList);

  try {
    const { posts, generated } = await loadPosts();

    if (generated) {
      const date = new Date(generated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      elements.dataGenerated.textContent = `Last updated ${date}. All posts link to their originals on X.`;
    }

    bindControls();
    updateFilters({ posts });
  } catch (error) {
    elements.postList.innerHTML = `
      <p class="empty-state">
        Posts could not be loaded. Please refresh the page. If the problem
        continues, try again later.
      </p>
    `;
    console.error(error);
  }
}

init();
