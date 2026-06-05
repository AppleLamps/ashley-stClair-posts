import { loadFeaturedPicks, loadPosts, resolveFeaturedPosts } from "./modules/api.js";
import { computeStats, filterPosts, sortPosts } from "./modules/filters.js";
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

const PAGE_SIZE = 50;

const elements = {
  stats: {
    total: document.getElementById("stat-total"),
    direct: document.getElementById("stat-direct"),
    span: document.getElementById("stat-span"),
    showing: document.getElementById("stat-showing"),
  },
  search: document.getElementById("search-input"),
  sort: document.getElementById("sort-select"),
  type: document.getElementById("type-select"),
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
  const filtersActive = hasActiveFilters(state);
  const featured = filtersActive ? [] : state.featured;
  const featuredIds = featured.map((post) => post.post_id);

  const filtered = sortPosts(
    filterPosts(state.posts, {
      query: state.query,
      type: state.type,
      excludeIds: featuredIds,
    }),
    state.sort,
  );

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
  const { filtered, featured, visibleCount, posts, filtersActive, query, sort, type } =
    store.get();

  const totalMatching = filtered.length + featured.length;
  const displayedInFeed = Math.min(visibleCount, filtered.length);
  const displayedTotal = displayedInFeed + (filtersActive ? 0 : featured.length);

  renderStats(elements.stats, {
    ...computeStats(posts, {
      filteredCount: totalMatching,
      visibleCount: displayedTotal,
    }),
  });

  if (featured.length && !filtersActive) {
    elements.featured.hidden = false;
    renderFeatured(elements.featuredGrid, featured);
  } else {
    elements.featured.hidden = true;
    elements.featuredGrid.replaceChildren();
  }

  renderActiveFilters(elements.activeFilters, { query, sort, type }, clearFilter);

  if (elements.feedCount) {
    elements.feedCount.textContent = filtersActive
      ? `${displayedTotal} of ${totalMatching} matching posts`
      : `${displayedTotal} of ${totalMatching} posts`;
  }

  if (!totalMatching) {
    elements.postList.replaceChildren();
    elements.emptyState.textContent = "No posts match your search.";
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
      "No other posts match your search. See the highlighted posts above.";
    elements.emptyState.hidden = false;
  }

  updateLoadMore(elements.loadMore, visibleCount, filtered.length);
}

function syncControls(values) {
  if (values.query !== undefined) elements.search.value = values.query;
  if (values.sort) elements.sort.value = values.sort;
  if (values.type) elements.type.value = values.type;
}

function clearFilter(key) {
  const resets = {
    query: { query: "" },
    type: { type: "all" },
    sort: { sort: "engagement" },
    all: { query: "", type: "all", sort: "engagement" },
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

    if (quick === "direct") {
      syncControls({ query: "@elonmusk", sort: "engagement", type: "all" });
      updateFilters({ query: "@elonmusk", sort: "engagement", type: "all" });
    } else if (quick === "reset") {
      clearFilter("all");
    }
  });

  store.subscribe(render);
}

async function init() {
  showLoading(elements.postList);

  try {
    const [{ posts, generated }, picks] = await Promise.all([
      loadPosts(),
      loadFeaturedPicks(),
    ]);

    const featured = resolveFeaturedPosts(picks, posts);

    if (generated) {
      const date = new Date(generated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      elements.dataGenerated.textContent = `Last updated ${date}. Every post links to its original on X.`;
    }

    bindControls();
    updateFilters({ posts, featured });
  } catch (error) {
    elements.postList.innerHTML = `
      <p class="empty-state">
        Posts could not be loaded. Please refresh the page.
      </p>
    `;
    console.error(error);
  }
}

init();
