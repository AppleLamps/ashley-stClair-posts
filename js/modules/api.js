const POSTS_URL = "./data/posts.json";
const FEATURED_URL = "./data/featured.json";

export async function loadPosts() {
  const response = await fetch(POSTS_URL);

  if (!response.ok) {
    throw new Error(`Failed to load posts (${response.status})`);
  }

  const payload = await response.json();
  return {
    posts: payload.posts ?? [],
    generated: payload.generated ?? null,
    total: payload.total ?? payload.posts?.length ?? 0,
  };
}

export async function loadFeaturedPicks() {
  const response = await fetch(FEATURED_URL);

  if (!response.ok) {
    throw new Error(`Failed to load featured picks (${response.status})`);
  }

  const payload = await response.json();
  return payload.picks ?? [];
}

export function resolveFeaturedPosts(picks, posts) {
  const byId = new Map(posts.map((post) => [post.post_id, post]));

  return picks
    .map((pick) => {
      const post = byId.get(pick.post_id);
      if (!post) return null;
      return { ...post, why: pick.why };
    })
    .filter(Boolean);
}
