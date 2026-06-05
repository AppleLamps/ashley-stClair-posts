export function createState(initial = {}) {
  const listeners = new Set();

  const state = {
    posts: [],
    featured: [],
    filtered: [],
    filtersActive: false,
    generated: null,
    query: "",
    sort: "editorial",
    type: "all",
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
