window.Cart = (() => {
  const KEY = "sawwa_cart";
  const get = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const set = (l) => {
    localStorage.setItem(KEY, JSON.stringify(l));
    window.dispatchEvent(new Event("cart-change"));
  };
  const add = (product, qty = 1) => {
    const l = get();
    const e = l.find((x) => x.id === product.id);
    if (e) e.qty += qty;
    else l.push({
      id: product.id,
      slug: product.slug,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: product.price,
      qty,
      image: (product.images && product.images[0]) || ""
    });
    set(l);
  };
  const remove = (id) => set(get().filter((x) => x.id !== id));
  const setQty = (id, qty) => {
    const l = get();
    const e = l.find((x) => x.id === id);
    if (e) e.qty = Math.max(1, qty);
    set(l);
  };
  const clear = () => set([]);
  const count = () => get().reduce((a, b) => a + b.qty, 0);
  const subtotal = () => get().reduce((a, b) => a + b.price * b.qty, 0);
  return { get, add, remove, setQty, clear, count, subtotal };
})();