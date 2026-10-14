window.Store = (() => {
  const KEY = {
    products: "sawwa_products",
    orders: "sawwa_orders",
    reviews: "sawwa_reviews",
    points: "sawwa_points",
    seeded: "sawwa_seeded_v3"
  };

  const seedProducts = () => {
    const rubber = Array.from({ length: 8 }).map((_, i) => ({
      id: `rubber-${i + 1}`,
      slug: `rubber-pad-${i + 1}`,
      nameAr: `ماوس باد مطاطي ${i + 1}`,
      nameEn: `Rubber Mousepad ${i + 1}`,
      descAr: "ماوس باد مطاطي مقاس 40×90 سم، سطح أملس مضاد للانزلاق، قاعدة مطاطية تثبت على المكتب. مناسب للاعبين والمصممين والعمل المكتبي. يُشحن ملفوفًا رول ويُفتح مستويًا خلال ساعات.",
      descEn: "Rubber mousepad 40×90 cm. Smooth anti-slip surface, rubber base. Suits gamers, designers, and office work. Ships rolled and flattens within hours.",
      price: 1200,
      compareAtPrice: 1800,
      costPrice: 0,
      type: "RUBBER",
      stock: 12,
      images: [
        "https://images.unsplash.com/photo-1616763355603-9755a640a287?w=800&q=80",
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
        "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80"
      ],
      packaging: "رول — 40×90 سم، كرتون 42×10×10 سم",
      warranty: true,
      active: true,
      createdAt: Date.now() - i * 1000
    }));

    const glass = Array.from({ length: 10 }).map((_, i) => ({
      id: `glass-${i + 1}`,
      slug: `glass-pad-${i + 1}`,
      nameAr: `ماوس باد زجاجي ${i + 1}`,
      nameEn: `Glass Mousepad ${i + 1}`,
      descAr: "ماوس باد زجاجي فاخر مقاس 48×43×4 سم. سطح مقوّى بانزلاق فائق ودقة عالية، قاعدة مضادة للانزلاق، تغليف صلب يحمي الحواف. لمسة فخمة على مكتبك.",
      descEn: "Luxury glass mousepad 48×43×4 cm. Tempered smooth surface, precision glide, anti-slip base, rigid protective packaging.",
      price: 2000,
      compareAtPrice: 3500,
      costPrice: 0,
      type: "GLASS",
      stock: 7,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80",
        "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=800&q=80"
      ],
      packaging: "علبة صلبة 48×43×4 سم",
      warranty: true,
      active: true,
      createdAt: Date.now() - (i + 100) * 1000
    }));

    localStorage.setItem(KEY.products, JSON.stringify([...rubber, ...glass]));
    localStorage.setItem(KEY.seeded, "1");
  };

  const init = () => { if (!localStorage.getItem(KEY.seeded)) seedProducts(); };

  const products = {
    all: () => JSON.parse(localStorage.getItem(KEY.products) || "[]"),
    byId: (id) => products.all().find((p) => p.id === id),
    byType: (type) => products.all().filter((p) => p.type === type && p.active),
    save: (list) => localStorage.setItem(KEY.products, JSON.stringify(list)),
    upsert: (p) => {
      const list = products.all();
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = { ...list[i], ...p };
      else list.unshift({ ...p, id: p.id || `p-${Date.now()}`, createdAt: Date.now(), active: true });
      products.save(list);
    },
    remove: (id) => products.save(products.all().filter((p) => p.id !== id)),
    decrementStock: (id, qty) => {
      const list = products.all();
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) list[i].stock = Math.max(0, list[i].stock - qty);
      products.save(list);
    }
  };

  const orders = {
    all: () => JSON.parse(localStorage.getItem(KEY.orders) || "[]"),
    byId: (id) => orders.all().find((o) => o.id === id),
    create: (o) => {
      const list = orders.all();
      list.unshift(o);
      localStorage.setItem(KEY.orders, JSON.stringify(list));
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

  return { init, products, orders, reviews, points };
})();

Store.init();