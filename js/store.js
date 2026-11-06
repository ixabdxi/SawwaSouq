window.Store = (() => {
  const KEY = {
    products: "sawwa_products_cache",
    orders: "sawwa_orders",
    reviews: "sawwa_reviews",
    points: "sawwa_points"
  };

  const getCache = () => JSON.parse(localStorage.getItem(KEY.products) || "[]");
  const setCache = (list) => localStorage.setItem(KEY.products, JSON.stringify(list));

  const products = {
    all: () => getCache(),
    byId: (id) => getCache().find((p) => p.id === id),
    byType: (type) => getCache().filter((p) => p.type === type && p.active),

    fetchFromCloud: async () => {
      if (window.SB && SB.isEnabled()) {
        const remote = await SB.products.list();
        if (remote) {
          setCache(remote);
          return remote;
        }
      }
      return getCache();
    },

    save: async (p) => {
      if (window.SB && SB.isEnabled()) await SB.products.save(p);
      const list = getCache();
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = { ...list[i], ...p };
      else list.unshift(p);
      setCache(list);
    },

    remove: async (id) => {
      if (window.SB && SB.isEnabled()) await SB.products.remove(id);
      setCache(getCache().filter((p) => p.id !== id));
    },

    decrementStock: async (id, qty) => {
      const list = getCache();
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) {
        list[i].stock = Math.max(0, list[i].stock - qty);
        setCache(list);
        if (window.SB && SB.isEnabled()) await SB.products.save(list[i]);
      }
    }
  };

  const orders = {
    all: () => JSON.parse(localStorage.getItem(KEY.orders) || "[]"),
    byId: (id) => orders.all().find((o) => o.id === id),
    create: async (o) => {
      const list = orders.all();
      list.unshift(o);
      localStorage.setItem(KEY.orders, JSON.stringify(list));
      if (window.SB && SB.isEnabled()) await SB.orders.create(o);
    },
    update: (id, patch) => {
      const list = orders.all();
      const i = list.findIndex((o) => o.id === id);
      if (i >= 0) list[i] = { ...list[i], ...patch };
      localStorage.setItem(KEY.orders, JSON.stringify(list));
    }
  };

  const reviews = {
    byProduct: (pid) => JSON.parse(localStorage.getItem(KEY.reviews) || "[]").filter((r) => r.productId === pid && r.approved),
    all: () => JSON.parse(localStorage.getItem(KEY.reviews) || "[]"),
    add: (r) => {
      const list = JSON.parse(localStorage.getItem(KEY.reviews) || "[]");
      list.unshift({ ...r, id: `rev-${Date.now()}`, approved: false, verified: true, createdAt: Date.now() });
      localStorage.setItem(KEY.reviews, JSON.stringify(list));
    },
    approve: (id) => {
      const list = JSON.parse(localStorage.getItem(KEY.reviews) || "[]");
      const i = list.findIndex((r) => r.id === id);
      if (i >= 0) list[i].approved = true;
      localStorage.setItem(KEY.reviews, JSON.stringify(list));
    },
    remove: (id) => {
      const list = JSON.parse(localStorage.getItem(KEY.reviews) || "[]").filter((r) => r.id !== id);
      localStorage.setItem(KEY.reviews, JSON.stringify(list));
    }
  };

  const points = {
    get: () => parseInt(localStorage.getItem(KEY.points) || "0", 10),
    add: (n) => localStorage.setItem(KEY.points, String(points.get() + n)),
    subtract: (n) => localStorage.setItem(KEY.points, String(Math.max(0, points.get() - n))),
    set: (n) => localStorage.setItem(KEY.points, String(n))
  };

  const init = async () => {
    await products.fetchFromCloud();
  };

  return { init, products, orders, reviews, points };
})();

Store.init();
