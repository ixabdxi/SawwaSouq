/* ============================================================
   SaWWA Souq — Supabase Wrapper (Full)
   ============================================================ */
window.SB = (() => {
  const cfg = window.SUPABASE_CONFIG || {};
  let client = null;
  let initPromise = null;

  const isEnabled = () => !!(cfg.enabled && cfg.url && cfg.anonKey && !cfg.url.includes("YOUR_"));

  const loadLib = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Supabase SDK"));
    document.head.appendChild(s);
  });

  const init = () => {
    if (!isEnabled()) return Promise.resolve(null);
    if (client) return Promise.resolve(client);
    if (initPromise) return initPromise;
    initPromise = (async () => {
      await loadLib();
      client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } });
      return client;
    })();
    return initPromise;
  };

  const normalizeProduct = (r) => ({
    id: r.id, slug: r.slug, nameAr: r.name_ar, nameEn: r.name_en,
    descAr: r.desc_ar || "", descEn: r.desc_en || "", type: r.type,
    price: r.price, compareAtPrice: r.compare_at_price, costPrice: r.cost_price,
    stock: r.stock, packaging: r.packaging || "", images: Array.isArray(r.images) ? r.images : [],
    active: r.active, warranty: true, createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()
  });

  const denormalizeProduct = (p) => ({
    id: p.id, slug: p.slug, name_ar: p.nameAr, name_en: p.nameEn, desc_ar: p.descAr, desc_en: p.descEn,
    type: p.type, price: p.price, compare_at_price: p.compareAtPrice || null, cost_price: p.costPrice || 0,
    stock: p.stock || 0, packaging: p.packaging, images: p.images || [], active: p.active !== false
  });

  const products = {
    list: async () => {
      const c = await init(); if (!c) return null;
      const { data, error } = await c.from("products").select("*").order("created_at", { ascending: true });
      if (error) { console.warn("[SB] products.list:", error); return null; }
      return data.map(normalizeProduct);
    },
    save: async (p) => {
      const c = await init(); if (!c) return null;
      const { error } = await c.from("products").upsert(denormalizeProduct(p));
      if (error) { console.warn("[SB] products.save:", error); return null; }
      return true;
    },
    remove: async (id) => {
      const c = await init(); if (!c) return null;
      const { error } = await c.from("products").delete().eq("id", id);
      if (error) return null;
      return true;
    }
  };

  const normalizeOrder = (r) => ({
    id: r.id, name: r.guest_name, email: r.guest_email, phone: r.guest_phone,
    city: r.city, address: r.address, notes: r.notes,
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: r.subtotal, shipping: r.shipping, discount: r.discount, total: r.total,
    couponCode: r.coupon_code, pointsEarned: r.points_earned, pointsUsed: r.points_used,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status, status: r.status,
    cliqProofName: r.cliq_proof_name, createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()
  });

  const denormalizeOrder = (o) => ({
    id: o.id, guest_name: o.name, guest_email: o.email, guest_phone: o.phone,
    city: o.city, address: o.address, notes: o.notes, items: o.items,
    subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total,
    coupon_code: o.couponCode, points_earned: o.pointsEarned, points_used: o.pointsUsed,
    payment_method: o.paymentMethod, payment_status: o.paymentStatus, status: o.status,
    cliq_proof_name: o.cliqProofName
  });

  const orders = {
    list: async () => {
      const c = await init(); if (!c) return null;
      const { data, error } = await c.from("orders").select("*").order("created_at", { ascending: false });
      if (error) { console.warn("[SB] orders.list:", error); return null; }
      return data.map(normalizeOrder);
    },
    create: async (o) => {
      const c = await init(); if (!c) return null;
      const { error } = await c.from("orders").insert(denormalizeOrder(o));
      if (error) { console.warn("[SB] orders.create:", error); return null; }
      console.log("[SB] Order saved to cloud:", o.id);
      return true;
    },
    update: async (id, patch) => {
      const c = await init(); if (!c) return null;
      const row = {};
      if (patch.status) row.status = patch.status;
      if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
      const { error } = await c.from("orders").update(row).eq("id", id);
      if (error) return null;
      return true;
    },
    remove: async (id) => {
      const c = await init(); if (!c) return null;
      const { error } = await c.from("orders").delete().eq("id", id);
      if (error) return null;
      return true;
    }
  };

  const subscribeOrders = (onUpdate) => {
    init().then((c) => {
      if (!c) return;
      c.channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          onUpdate(payload);
        })
        .subscribe();
    });
  };

  return { isEnabled, init, products, orders, subscribeOrders };
})();
