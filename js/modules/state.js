export function createState(initial = {}) {
  const listeners = new Set();

  const state = {
    posts: [],
    filtered: [],
    featured: [],
    filtersActive: false,
    generated: null,
    query: "",
    sort: "contradiction",
    type: "all",
    minScore: 0,
    visibleCount: 25,
    ...initial,
  };

  return {
    get() {
      return { ...state };
    },

    set(partial) {
      Object.assign(state, partial);
      listeners.forEach((listener) => listener(state));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
