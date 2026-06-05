import {
  escapeHtml,
  formatDate,
  formatNumber,
  highlightContent,
  shouldTruncate,
  truncateText,
} from "./utils.js";

const POST_TYPE_LABELS = {
  Tweet: "Post",
  Reply: "Reply",
  Retweet: "Repost",
};

function formatPostType(type) {
  return POST_TYPE_LABELS[type] ?? type;
}

function buildPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";
  article.setAttribute("role", "listitem");
  article.dataset.postId = post.post_id;

  const isLong = shouldTruncate(post.content);
  const displayText = isLong ? truncateText(post.content) : post.content;

  article.innerHTML = `
    <div class="post-meta">
      <span class="post-type">${escapeHtml(formatPostType(post.type))}</span>
      <time datetime="${escapeHtml(post.posted)}">${formatDate(post.posted)}</time>
    </div>
    <blockquote class="post-content" data-full="false">${highlightContent(displayText)}</blockquote>
    ${
      isLong
        ? `<button type="button" class="btn-expand" aria-expanded="false">Read full post</button>`
        : ""
    }
    <div class="post-engagement" aria-label="Post activity">
      <span><strong>${formatNumber(post.favorites)}</strong> likes</span>
      <span><strong>${formatNumber(post.views)}</strong> views</span>
    </div>
    <a class="post-link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer">
      Read on X ↗
    </a>
  `;

  if (isLong) {
    const contentEl = article.querySelector(".post-content");
    const expandBtn = article.querySelector(".btn-expand");

    expandBtn.addEventListener("click", () => {
      const expanded = expandBtn.getAttribute("aria-expanded") === "true";

      if (expanded) {
        contentEl.innerHTML = highlightContent(truncateText(post.content));
        contentEl.dataset.full = "false";
        expandBtn.textContent = "Read full post";
        expandBtn.setAttribute("aria-expanded", "false");
      } else {
        contentEl.innerHTML = highlightContent(post.content);
        contentEl.dataset.full = "true";
        expandBtn.textContent = "Show less";
        expandBtn.setAttribute("aria-expanded", "true");
      }
    });
  }

  return article;
}

function buildFeaturedCard(post, rank) {
  const article = document.createElement("article");
  article.className = "featured-card";

  const isLong = shouldTruncate(post.content, 500);
  const displayText = isLong ? truncateText(post.content, 500) : post.content;

  article.innerHTML = `
    <div class="featured-card__rank">${rank}</div>
    <div class="featured-card__body">
      <p class="featured-card__why">${escapeHtml(post.why)}</p>
      <blockquote class="featured-card__quote">${highlightContent(displayText)}</blockquote>
      <div class="featured-card__footer">
        <time datetime="${escapeHtml(post.posted)}">${formatDate(post.posted)}</time>
        <span class="featured-card__stats">${formatNumber(post.favorites)} likes · ${formatNumber(post.views)} views</span>
        <a class="featured-card__link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer">Read on X ↗</a>
      </div>
    </div>
  `;

  return article;
}

export function renderFeatured(container, posts) {
  container.replaceChildren();
  posts.forEach((post, index) => {
    container.appendChild(buildFeaturedCard(post, index + 1));
  });
}

export function renderPostList(container, posts) {
  const fragment = document.createDocumentFragment();
  posts.forEach((post) => {
    fragment.appendChild(buildPostCard(post));
  });
  container.replaceChildren(fragment);
}

export function renderStats(elements, stats) {
  elements.total.textContent = stats.total;
  elements.direct.textContent = stats.directElon;
  elements.span.textContent = stats.dateRange;
  elements.showing.textContent = stats.showing;
}

const FILTER_LABELS = {
  type: {
    Tweet: "Her posts only",
    Reply: "Her replies only",
    Retweet: "Her reposts only",
  },
  sort: {
    "date-desc": "Newest first",
    "date-asc": "Oldest first",
    engagement: "Most liked",
    views: "Most viewed",
  },
};

export function renderActiveFilters(container, filters, onClear) {
  const chips = [];

  if (filters.query.trim()) {
    chips.push({ label: `“${filters.query.trim()}”`, key: "query" });
  }
  if (filters.type !== "all") {
    chips.push({
      label: FILTER_LABELS.type[filters.type] ?? filters.type,
      key: "type",
    });
  }
  if (filters.sort !== "engagement") {
    chips.push({
      label: FILTER_LABELS.sort[filters.sort] ?? filters.sort,
      key: "sort",
    });
  }

  container.replaceChildren();

  if (!chips.length) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  chips.forEach((chip) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = chip.label;
    button.setAttribute("aria-label", `Remove filter: ${chip.label}`);
    button.addEventListener("click", () => onClear(chip.key));
    container.appendChild(button);
  });

  const clearAll = document.createElement("button");
  clearAll.type = "button";
  clearAll.className = "filter-chip filter-chip--clear";
  clearAll.textContent = "Clear all";
  clearAll.addEventListener("click", () => onClear("all"));
  container.appendChild(clearAll);
}

export function showLoading(container) {
  container.innerHTML = '<p class="loading">Loading posts…</p>';
}

export function updateLoadMore(button, visibleCount, filteredCount) {
  const remaining = filteredCount - visibleCount;

  if (remaining <= 0) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  const nextBatch = Math.min(25, remaining);

  button.textContent =
    remaining <= 25
      ? `Load remaining ${remaining} posts`
      : `Load ${nextBatch} more posts`;
}
