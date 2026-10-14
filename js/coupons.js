/* ============================================================
   SaWWA Souq — Coupon Engine (customer side)
   ============================================================ */
window.Coupons = (() => {
  const KEY = "sawwa_coupons";
  let active = null;

  const all = () => JSON.parse(localStorage.getItem(KEY) || "[]");

  const validate = (code, cartSubtotal) => {
    const c = all().find((x) => x.code.toUpperCase() === String(code || "").toUpperCase().trim());
    if (!c) return { ok: false, reason: "not_found" };
    if (!c.active) return { ok: false, reason: "inactive" };
    if (c.expires && new Date(c.expires).getTime() < Date.now()) return { ok: false, reason: "expired" };
    if (c.maxUses && c.uses >= c.maxUses) return { ok: false, reason: "max_uses" };
    if (c.minCart && cartSubtotal < c.minCart) return { ok: false, reason: "min_cart" };
    return { ok: true, coupon: c };
  };

  const discountFor = (c, subtotal) => {
    if (!c) return 0;
    if (c.type === "percent") return Math.round(subtotal * c.value / 100);
    return Math.min(subtotal, c.value);
  };

  const apply = (code, subtotal) => {
    const v = validate(code, subtotal);
    if (!v.ok) return v;
    active = v.coupon;
    return { ok: true, coupon: v.coupon, discount: discountFor(v.coupon, subtotal) };
  };

  const current = () => active;
  const clear = () => { active = null; };

  const incrementUse = () => {
    if (!active) return;
    const list = all();
    const i = list.findIndex((x) => x.id === active.id);
    if (i >= 0) {
      list[i].uses = (list[i].uses || 0) + 1;
      localStorage.setItem(KEY, JSON.stringify(list));
    }
  };

  return { all, validate, discountFor, apply, current, clear, incrementUse };
})();