const DATA_URL = "./data/posts.json";

export async function loadPosts() {
  const response = await fetch(DATA_URL);

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
