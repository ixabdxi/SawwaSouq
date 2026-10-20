/* ============================================================
   SaWWA Souq — Wishlist System
   ============================================================ */
window.Wishlist = (() => {
  const KEY = "sawwa_wishlist";

  const get = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const set = (l) => {
    localStorage.setItem(KEY, JSON.stringify(l));
    window.dispatchEvent(new Event("wishlist-change"));
  };

  const add = (product) => {
    const l = get();
    if (l.find((x) => x.id === product.id)) return false;
    l.push({
      id: product.id,
      slug: product.slug,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: product.price,
      compareAtPrice: product.compareAtPrice || null,
      image: (product.images && product.images[0]) || "",
      addedAt: Date.now()
    });
    set(l);
    return true;
  };

  const remove = (id) => set(get().filter((x) => x.id !== id));
  const has = (id) => !!get().find((x) => x.id === id);
  const toggle = (product) => has(product.id) ? (remove(product.id), false) : (add(product), true);
  const count = () => get().length;
  const clear = () => set([]);

  return { get, add, remove, has, toggle, count, clear };
})();