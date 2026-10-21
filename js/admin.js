/* ============================================================
   SaWWA Souq — Admin Panel (Full & Optimized)
   ============================================================ */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const K = {
    products: "sawwa_products", orders: "sawwa_orders", reviews: "sawwa_reviews",
    points: "sawwa_points", customers: "sawwa_customers", coupons: "sawwa_coupons",
    loyaltyLedger: "sawwa_loyalty_ledger", notifications: "sawwa_notifications",
    messages: "sawwa_messages", announce: "sawwa_announce", settings: "sawwa_settings",
    adminPwd: "sawwa_admin_pwd", loginAttempts: "sawwa_login_attempts", sessionExpires: "sawwa_admin_expires"
  };
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch { return fallback; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const getPwd = () => localStorage.getItem(K.adminPwd) || (window.SAWWA?.adminPassword || "sawwa2026");
  const setPwd = (v) => localStorage.setItem(K.adminPwd, v);

  /* ============ SESSION ============ */
  const sessionValid = () => {
    const exp = parseInt(sessionStorage.getItem(K.sessionExpires) || "0", 10);
    return sessionStorage.getItem("sawwa_admin") === "1" && exp > Date.now();
  };
  const startSession = () => {
    sessionStorage.setItem("sawwa_admin", "1");
    sessionStorage.setItem(K.sessionExpires, String(Date.now() + 60 * 60 * 1000));
  };

  /* ============ LOGIN ============ */
  const loginScreen = $("#loginScreen");
  const adminApp = $("#adminApp");
  const loginBtn = $("#loginBtn");
  const pwdInput = $("#pwd");
  const loginErr = $("#loginErr");

  const showPanel = () => {
    if(loginScreen) loginScreen.classList.add("hidden");
    if(adminApp) adminApp.classList.remove("hidden");
    renderAll();
  };

  if(loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (pwdInput.value === getPwd()) {
        startSession();
        if(loginErr) loginErr.textContent = "";
        showPanel();
      } else {
        if(loginErr) loginErr.textContent = "كلمة المرور غير صحيحة";
        pwdInput.focus();
      }
    });
  }
  if(pwdInput) {
    pwdInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && loginBtn) loginBtn.click(); });
  }

  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("sawwa_admin");
    sessionStorage.removeItem(K.sessionExpires);
    location.reload();
  });

  /* ============ NAV ============ */
  const TITLES = {
    dash: "نظرة عامة", orders: "الطلبات", products: "المنتجات", inventory: "المخزون",
    customers: "العملاء", reviews: "المراجعات", messages: "الرسائل", coupons: "الكوبونات",
    loyalty: "النقاط", analytics: "التحليلات", notifications: "الإشعارات",
    announce: "إعلان الموقع", settings: "الإعدادات", backup: "نسخ احتياطي"
  };

  const switchTab = (id) => {
    $$(".side-tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === id));
    $$(".tab-panel").forEach((x) => x.classList.toggle("active", x.id === "tab-" + id));
    const title = $("#topbarTitle");
    if (title) title.textContent = TITLES[id] || id;
    
    if (id === "dash") { renderDash(); setTimeout(() => drawSalesChart(read(K.orders, [])), 100); }
    if (id === "orders") renderOrders();
    if (id === "products") renderProducts();
    if (id === "inventory") renderInventory();
    if (id === "customers") renderCustomers();
    if (id === "reviews") renderReviews();
    if (id === "messages") renderMessages();
    if (id === "coupons") renderCoupons();
    if (id === "loyalty") renderLoyalty();
    if (id === "analytics") renderAnalytics();
    if (id === "notifications") renderNotifications();
    if (id === "announce") renderAnnounce();
    if (id === "settings") renderSettings();
  };

  const bindNav = () => {
    $$(".side-tab").forEach((b) => {
      b.removeEventListener("click", b._handler);
      b._handler = () => switchTab(b.dataset.tab);
      b.addEventListener("click", b._handler);
    });
  };

  /* ============ HELPERS ============ */
  const fmtJOD = (cents) => ((cents || 0) / 100).toFixed(2) + " JOD";
  const fmtDate = (ts) => new Date(ts).toLocaleString("ar-JO");
  const newId = (p) => p + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const download = (name, content, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  };

  /* ============ DASH ============ */
  const renderDash = () => {
    const orders = read(K.orders, []);
    const products = read(K.products, []);
    const reviews = read(K.reviews, []);
    const messages = read(K.messages, []);

    const paid = orders.filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "COD");
    const totalRev = paid.reduce((a, b) => a + (b.total || 0), 0);
    const today = new Date(); today.setHours(0,0,0,0);
    const t0 = today.getTime();
    const ordersToday = orders.filter((o) => (o.createdAt || 0) >= t0);
    const revToday = ordersToday.filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "COD").reduce((a, b) => a + (b.total || 0), 0);

    const setTxt = (id, v) => { const el = $("#" + id); if (el) el.textContent = v; };
    setTxt("stOrders", orders.length);
    setTxt("stOrdersToday", "+" + ordersToday.length + " اليوم");
    setTxt("stRevenue", fmtJOD(totalRev));
    setTxt("stRevenueToday", "+" + fmtJOD(revToday) + " اليوم");
    setTxt("stPending", orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION").length);
    setTxt("stLow", products.filter((p) => (p.stock || 0) <= 10).length);

    const setBadge = (id, v) => { const el = $("#" + id); if (el) el.textContent = v || ""; };
    setBadge("badge-orders", orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION").length);
    setBadge("badge-low", products.filter((p) => (p.stock || 0) <= 10).length);
    setBadge("badge-reviews", reviews.filter((r) => !r.approved).length);
    setBadge("badge-messages", messages.filter((m) => !m.read).length);

    drawSalesChart(orders);
    renderTopProducts(orders);
    renderRecentOrders(orders);
    renderSmartAlerts(orders, products);
  };

  const drawSalesChart = (orders) => {
    const canvas = $("#chartSales");
    if (!canvas) return;
    const cssW = canvas.clientWidth;
    const cssH = 220;
    if (!cssW || cssW < 100) { setTimeout(() => drawSalesChart(orders), 200); return; }
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      days.push({ start: d.getTime(), end: d.getTime() + 86400000, total: 0 });
    }
    orders.forEach((o) => {
      if (o.paymentStatus !== "PAID" && o.paymentMethod !== "COD") return;
      days.forEach((d) => { if (o.createdAt >= d.start && o.createdAt < d.end) d.total += o.total || 0; });
    });

    const max = Math.max(...days.map((d) => d.total), 100);
    const padL = 50, padR = 12, padT = 20, padB = 30;
    const w = cssW - padL - padR, h = cssH - padT - padB, barW = w / days.length - 10;

    ctx.strokeStyle = "rgba(143,169,165,.3)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) { const y = padT + (h / 4) * i; ctx.moveTo(padL, y); ctx.lineTo(padL + w, y); }
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
    grad.addColorStop(0, "#5FD0C5"); grad.addColorStop(1, "#0F5C56");

    days.forEach((d, i) => {
      const bh = (d.total / max) * h;
      const x = padL + i * (w / days.length) + 5;
      const y = padT + h - bh;
      ctx.fillStyle = grad; ctx.beginPath();
      const r = 6;
      ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, padT + h); ctx.lineTo(x, padT + h);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath(); ctx.fill();
    });

    ctx.fillStyle = "#4A5654"; ctx.font = "11px 'Baloo Bhaijaan 2', sans-serif"; ctx.textAlign = "center";
    days.forEach((d, i) => {
      const date = new Date(d.start);
      ctx.fillText(date.getDate() + "/" + (date.getMonth() + 1), padL + i * (w / days.length) + barW / 2 + 5, cssH - 10);
    });
  };

  const renderTopProducts = (orders) => {
    const counters = {};
    orders.forEach((o) => (o.items || []).forEach((it) => { const key = it.nameAr || it.id; counters[key] = (counters[key] || 0) + it.qty; }));
    const list = Object.entries(counters).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const el = $("#topProducts");
    if (!el) return;
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا توجد بيانات</p>`; return; }
    el.innerHTML = `<div class="admin-list">${list.map(([name, qty], i) => `
      <div class="admin-list-item"><span class="rank">${i + 1}</span><span class="label">${esc(name)}</span><span class="value">${qty}</span></div>`).join("")}</div>`;
  };

  const renderRecentOrders = (orders) => {
    const list = orders.slice(0, 6);
    const el = $("#recentOrders");
    if (!el) return;
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا توجد طلبات</p>`; return; }
    el.innerHTML = `<div class="admin-list">${list.map((o) => `
      <div class="admin-list-item"><span class="label"><strong class="font-en">${esc(o.id)}</strong><br /><small class="muted">${esc(o.name || "")}</small></span><span class="value">${fmtJOD(o.total)}</span></div>`).join("")}</div>`;
  };

  const renderSmartAlerts = (orders, products) => {
    const alerts = [];
    const low = products.filter((p) => (p.stock || 0) <= 10 && p.stock > 0);
    low.slice(0, 5).forEach((p) => alerts.push({ type: "warn", text: `مخزون منخفض: ${p.nameAr} — ${p.stock}` }));
    if (low.length > 5) alerts.push({ type: "warn", text: `و ${low.length - 5} أخرى` });
    const out = products.filter((p) => (p.stock || 0) === 0);
    out.slice(0, 3).forEach((p) => alerts.push({ type: "danger", text: `نفد: ${p.nameAr}` }));
    const pending = orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION");
    if (pending.length) alerts.push({ type: "info", text: `${pending.length} طلب بانتظار التحقق` });

    const el = $("#smartAlerts");
    if (!el) return;
    if (!alerts.length) { el.innerHTML = `<p class="empty-state">لا تنبيهات ✓</p>`; return; }
    el.innerHTML = `<div class="admin-list">${alerts.map((a) => `
      <div class="admin-list-item" style="border-inline-start:4px solid ${a.type === "danger" ? "#C03030" : a.type === "warn" ? "#E8A33D" : "#1565C0"}"><span class="label">${esc(a.text)}</span></div>`).join("")}</div>`;
  };

  /* ============ ORDERS (Async + Supabase) ============ */
  let orderSearchQ = "", orderFilterStatus = "", orderFilterPay = "";
  const oSearch = $("#orderSearch"), oFS = $("#orderFilterStatus"), oFP = $("#orderFilterPay"), oExp = $("#exportOrders");
  if (oSearch) oSearch.oninput = (e) => { orderSearchQ = e.target.value.toLowerCase(); renderOrders(); };
  if (oFS) oFS.onchange = (e) => { orderFilterStatus = e.target.value; renderOrders(); };
  if (oFP) oFP.onchange = (e) => { orderFilterPay = e.target.value; renderOrders(); };
  if (oExp) oExp.onclick = () => {
    const orders = read(K.orders, []);
    const rows = [["ID","Name","Phone","City","Total","PayMethod","PayStatus","Status","Date"]];
    orders.forEach((o) => rows.push([o.id, o.name, o.phone, o.city, (o.total/100).toFixed(2), o.paymentMethod, o.paymentStatus, o.status, new Date(o.createdAt).toLocaleString()]));
    download("orders.csv", csv(rows), "text/csv");
  };

  const renderOrders = async () => {
    const el = $("#ordersTable");
    if (!el) return;

    let orders = read(K.orders, []);

    if (window.SB && SB.isEnabled()) {
      el.innerHTML = `<p class="muted" style="padding:20px;text-align:center">جاري تحديث الطلبات من السيرفر...</p>`;
      try {
        const remote = await SB.orders.list();
        if (remote && Array.isArray(remote)) {
          const map = new Map();
          [...remote, ...orders].forEach((o) => map.set(o.id, o));
          orders = [...map.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          write(K.orders, orders); // تحديث المتصفح
        }
      } catch (e) {
        console.warn("[Admin] Supabase fetch failed:", e);
      }
    }

    if (orderSearchQ) orders = orders.filter((o) => (o.id + o.name + o.phone + (o.email||"")).toLowerCase().includes(orderSearchQ));
    if (orderFilterStatus) orders = orders.filter((o) => o.status === orderFilterStatus);
    if (orderFilterPay) orders = orders.filter((o) => o.paymentMethod === orderFilterPay);

    if (!orders.length) { el.innerHTML = `<p class="empty-state">لا توجد طلبات</p>`; return; }

    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>رقم</th><th>العميل</th><th>الهاتف</th><th>المدينة</th><th>المجموع</th><th>الدفع</th><th>حالة الدفع</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${orders.map((o) => `
        <tr>
          <td class="font-en"><strong>${esc(o.id)}</strong></td>
          <td>${esc(o.name || "")}</td>
          <td class="font-en">${esc(o.phone || "")}</td>
          <td>${esc(o.city || "")}</td>
          <td class="font-en">${fmtJOD(o.total)}</td>
          <td>${esc(o.paymentMethod || "")}</td>
          <td><span class="status-pill ${o.paymentStatus}">${esc(o.paymentStatus)}</span></td>
          <td><span class="status-pill ${o.status}">${esc(o.status)}</span></td>
          <td class="actions-cell">
            ${o.paymentStatus === "AWAITING_VERIFICATION" ? `<button class="btn xs success" data-verify="${o.id}">تأكيد الدفع</button><button class="btn xs danger" data-reject="${o.id}">رفض</button>` : ""}
            ${o.status !== "SHIPPED" && o.status !== "DELIVERED" ? `<button class="btn xs" data-ship="${o.id}">شحن</button>` : ""}
            ${o.status !== "DELIVERED" ? `<button class="btn xs success" data-deliver="${o.id}">تسليم</button>` : ""}
            <button class="btn xs danger" data-del="${o.id}">حذف</button>
          </td>
        </tr>`).join("")}</tbody></table>`;

    el.querySelectorAll("[data-verify]").forEach((b) => b.onclick = () => updateOrder(b.dataset.verify, { paymentStatus: "PAID", status: "CONFIRMED" }));
    el.querySelectorAll("[data-reject]").forEach((b) => b.onclick = () => updateOrder(b.dataset.reject, { paymentStatus: "FAILED", status: "CANCELLED" }));
    el.querySelectorAll("[data-ship]").forEach((b) => b.onclick = () => updateOrder(b.dataset.ship, { status: "SHIPPED" }));
    el.querySelectorAll("[data-deliver]").forEach((b) => b.onclick = () => updateOrder(b.dataset.deliver, { status: "DELIVERED" }));
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("حذف الطلب؟")) return;
      write(K.orders, read(K.orders, []).filter((o) => o.id !== b.dataset.del));
      if (window.SB && SB.isEnabled()) SB.orders.remove(b.dataset.del);
      renderOrders(); renderDash();
    });
  };

  const updateOrder = (id, patch) => {
    const orders = read(K.orders, []);
    const i = orders.findIndex((o) => o.id === id);
    if (i >= 0) { orders[i] = { ...orders[i], ...patch }; write(K.orders, orders); }
    if (window.SB && SB.isEnabled()) SB.orders.update(id, patch);
    renderOrders(); renderDash();
  };

  /* ============ PRODUCTS ============ */
  let prodSearchQ = "", prodFilterType = "";
  const pSearch = $("#prodSearch"), pFT = $("#prodFilterType");
  if (pSearch) pSearch.oninput = (e) => { prodSearchQ = e.target.value.toLowerCase(); renderProducts(); };
  if (pFT) pFT.onchange = (e) => { prodFilterType = e.target.value; renderProducts(); };

  const productModal = $("#productModal");
  let editingProductId = null;
  let currentProductImage = "";

  const fileToCompressedBase64 = (file, maxSize = 800) => new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject("not_image");
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85));
      };
      img.onerror = () => reject("load_error");
      img.src = e.target.result;
    };
    reader.onerror = () => reject("read_error");
    reader.readAsDataURL(file);
  });

  const renderImagePreview = () => {
    const preview = $("#pm_preview"), clearBtn = $("#pm_clear");
    if (!preview) return;
    if (currentProductImage) {
      preview.innerHTML = `<img src="${currentProductImage}" alt="preview" />`;
      if (clearBtn) clearBtn.style.display = "inline-flex";
    } else {
      preview.innerHTML = `<div class="iu-empty"><div class="iu-icon">📷</div><div class="iu-text">اسحب الصورة هنا</div></div>`;
      if (clearBtn) clearBtn.style.display = "none";
    }
  };

  const bindImageUploader = () => {
    const drop = $("#pm_drop"), fileInput = $("#pm_file"), chooseBtn = $("#pm_choose"), clearBtn = $("#pm_clear");
    if (!drop || !fileInput) return;
    const handleFile = async (file) => {
      try { currentProductImage = await fileToCompressedBase64(file); renderImagePreview(); }
      catch (e) { alert("تعذّر تحميل الصورة: " + e); }
    };
    if (chooseBtn) chooseBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); };
    drop.onclick = (e) => { if (e.target.closest("button")) return; fileInput.click(); };
    fileInput.onchange = (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); };
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("dragover"); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); });
    if (clearBtn) clearBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); currentProductImage = ""; fileInput.value = ""; renderImagePreview(); };
  };

  const npBtn = $("#newProductBtn");
  if (npBtn) npBtn.onclick = () => {
    editingProductId = null; currentProductImage = "";
    $("#prodModalTitle").textContent = "منتج جديد";
    ["pm_nameAr","pm_nameEn","pm_descAr","pm_descEn","pm_price","pm_compare","pm_cost","pm_stock","pm_pkg"].forEach((id) => { const e = $("#" + id); if (e) e.value = ""; });
    const pt = $("#pm_type"); if (pt) pt.value = "RUBBER";
    const fi = $("#pm_file"); if (fi) fi.value = "";
    renderImagePreview(); bindImageUploader();
    productModal.classList.remove("hidden");
  };
  const pmCancel = $("#pm_cancel");
  if (pmCancel) pmCancel.onclick = () => productModal.classList.add("hidden");

  const pmSave = $("#pm_save");
  if (pmSave) pmSave.onclick = () => {
    const data = {
      nameAr: ($("#pm_nameAr") || {}).value?.trim() || "",
      nameEn: ($("#pm_nameEn") || {}).value?.trim() || "",
      descAr: ($("#pm_descAr") || {}).value?.trim() || "",
      descEn: ($("#pm_descEn") || {}).value?.trim() || "",
      type: ($("#pm_type") || {}).value || "RUBBER",
      price: parseInt(($("#pm_price") || {}).value, 10) || 0,
      compareAtPrice: parseInt(($("#pm_compare") || {}).value, 10) || null,
      costPrice: parseInt(($("#pm_cost") || {}).value, 10) || 0,
      stock: parseInt(($("#pm_stock") || {}).value, 10) || 0,
      packaging: ($("#pm_pkg") || {}).value?.trim() || "",
      images: currentProductImage ? [currentProductImage] : [],
      warranty: true, active: true
    };
    if (!data.nameAr || !data.nameEn) { alert("الاسم مطلوب"); return; }
    const products = read(K.products, []);
    if (editingProductId) {
      const i = products.findIndex((p) => p.id === editingProductId);
      if (i >= 0) products[i] = { ...products[i], ...data };
    } else {
      products.unshift({ ...data, id: newId("p"), slug: "p-" + Date.now().toString(36), createdAt: Date.now() });
    }
    write(K.products, products);
    if (window.SB && SB.isEnabled()) SB.products.save(products.find(p=>p.id === (editingProductId || products[0].id)));
    productModal.classList.add("hidden");
    renderProducts(); renderDash();
  };

  const renderProducts = () => {
    const el = $("#prodTable");
    if (!el) return;
    let list = read(K.products, []);
    if (prodSearchQ) list = list.filter((p) => (p.nameAr + p.nameEn).toLowerCase().includes(prodSearchQ));
    if (prodFilterType) list = list.filter((p) => p.type === prodFilterType);
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا توجد منتجات</p>`; return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>الصورة</th><th>AR</th><th>EN</th><th>النوع</th><th>السعر</th><th>قبل الخصم</th><th>المخزون</th><th>مفعّل</th><th>إجراءات</th></tr></thead>
      <tbody>${list.map((p) => `
        <tr>
          <td>${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:48px;height:48px;object-fit:cover;border-radius:8px" />` : `<span style="display:inline-block;width:48px;height:48px;background:var(--surface-2);border-radius:8px"></span>`}</td>
          <td>${esc(p.nameAr)}</td>
          <td>${esc(p.nameEn)}</td>
          <td>${esc(p.type)}</td>
          <td class="font-en">${fmtJOD(p.price)}</td>
          <td class="font-en">${p.compareAtPrice ? fmtJOD(p.compareAtPrice) : "—"}</td>
          <td class="font-en">${p.stock}</td>
          <td>${p.active ? "✓" : "✕"}</td>
          <td class="actions-cell">
            <button class="btn xs" data-edit="${p.id}">تعديل</button>
            <button class="btn xs" data-toggle="${p.id}">${p.active ? "إخفاء" : "إظهار"}</button>
            <button class="btn xs danger" data-del="${p.id}">حذف</button>
          </td>
        </tr>`).join("")}</tbody></table>`;
    el.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => {
      const p = read(K.products, []).find((x) => x.id === b.dataset.edit);
      if (!p) return;
      editingProductId = p.id;
      $("#prodModalTitle").textContent = "تعديل منتج";
      $("#pm_nameAr").value = p.nameAr || "";
      $("#pm_nameEn").value = p.nameEn || "";
      $("#pm_descAr").value = p.descAr || "";
      $("#pm_descEn").value = p.descEn || "";
      $("#pm_type").value = p.type || "RUBBER";
      $("#pm_price").value = p.price || 0;
      $("#pm_compare").value = p.compareAtPrice || "";
      $("#pm_cost").value = p.costPrice || 0;
      $("#pm_stock").value = p.stock || 0;
      $("#pm_pkg").value = p.packaging || "";
      currentProductImage = (p.images && p.images[0]) || "";
      const fi = $("#pm_file"); if (fi) fi.value = "";
      renderImagePreview(); bindImageUploader();
      productModal.classList.remove("hidden");
    });
    el.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = () => {
      const list = read(K.products, []);
      const i = list.findIndex((x) => x.id === b.dataset.toggle);
      if (i >= 0) { 
        list[i].active = !list[i].active; 
        write(K.products, list); 
        if (window.SB && SB.isEnabled()) SB.products.save(list[i]);
        renderProducts(); 
      }
    });
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("تأكيد الحذف؟")) return;
      write(K.products, read(K.products, []).filter((x) => x.id !== b.dataset.del));
      if (window.SB && SB.isEnabled()) SB.products.remove(b.dataset.del);
      renderProducts();
    });
  };

  /* ============ INVENTORY ============ */
  const iExp = $("#exportInventory");
  if (iExp) iExp.onclick = () => {
    const list = read(K.products, []);
    const rows = [["ID","NameAr","Stock","Price"]];
    list.forEach((p) => rows.push([p.id, p.nameAr, p.stock, (p.price/100).toFixed(2)]));
    download("inventory.csv", csv(rows), "text/csv");
  };
  const renderInventory = () => {
    const el = $("#inventoryTable");
    if (!el) return;
    const list = read(K.products, []);
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا توجد منتجات</p>`; return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>#</th><th>المنتج</th><th>النوع</th><th>المخزون</th><th>تعديل</th></tr></thead>
      <tbody>${list.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(p.nameAr)}</td>
          <td>${esc(p.type)}</td>
          <td><strong class="font-en" style="color:${p.stock <= 10 ? '#C03030' : 'inherit'}">${p.stock}</strong></td>
          <td class="actions-cell">
            <button class="btn xs" data-inc="${p.id}">+1</button>
            <button class="btn xs" data-dec="${p.id}">−1</button>
            <button class="btn xs" data-set="${p.id}">تعيين</button>
          </td>
        </tr>`).join("")}</tbody></table>`;
    el.querySelectorAll("[data-inc]").forEach((b) => b.onclick = () => modifyStock(b.dataset.inc, +1));
    el.querySelectorAll("[data-dec]").forEach((b) => b.onclick = () => modifyStock(b.dataset.dec, -1));
    el.querySelectorAll("[data-set]").forEach((b) => b.onclick = () => {
      const v = prompt("الكمية:");
      if (v == null) return;
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 0) return;
      setStock(b.dataset.set, n);
    });
  };
  const modifyStock = (id, delta) => {
    const list = read(K.products, []);
    const i = list.findIndex((p) => p.id === id);
    if (i >= 0) { 
      list[i].stock = Math.max(0, (list[i].stock || 0) + delta); 
      write(K.products, list); 
      if (window.SB && SB.isEnabled()) SB.products.save(list[i]);
      renderInventory(); 
    }
  };
  const setStock = (id, n) => {
    const list = read(K.products, []);
    const i = list.findIndex((p) => p.id === id);
    if (i >= 0) { 
      list[i].stock = n; 
      write(K.products, list); 
      if (window.SB && SB.isEnabled()) SB.products.save(list[i]);
      renderInventory(); 
    }
  };
  const bulkBtn = $("#bulkUpdate");
  if (bulkBtn) bulkBtn.onclick = () => {
    const v = prompt("الكمية للجميع:");
    if (v == null) return;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 0) return;
    const list = read(K.products, []).map((p) => ({ ...p, stock: n }));
    write(K.products, list);
    if (window.SB && SB.isEnabled()) list.forEach(p => SB.products.save(p));
    renderInventory();
  };

  /* ============ CUSTOMERS ============ */
  let custSearchQ = "";
  const cSearch = $("#custSearch");
  if (cSearch) cSearch.oninput = (e) => { custSearchQ = e.target.value.toLowerCase(); renderCustomers(); };
  const renderCustomers = () => {
    if (!localStorage.getItem(K.customers)) write(K.customers, []);
    const el = $("#customersTable");
    if (!el) return;
    let list = read(K.customers, []);
    if (custSearchQ) list = list.filter((c) => (c.name + c.phone + c.email).toLowerCase().includes(custSearchQ));
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا عملاء</p>`; return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>الاسم</th><th>الهاتف</th><th>الإيميل</th><th>المدينة</th><th>الطلبات</th><th>المجموع</th><th>النقاط</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${list.map((c) => `
        <tr>
          <td>${esc(c.name)}</td>
          <td class="font-en">${esc(c.phone)}</td>
          <td>${esc(c.email)}</td>
          <td>${esc(c.city)}</td>
          <td class="font-en">${c.ordersCount}</td>
          <td class="font-en">${fmtJOD(c.totalSpent)}</td>
          <td class="font-en">${c.points || 0}</td>
          <td>${c.blocked ? '<span class="status-pill CANCELLED">محظور</span>' : '<span class="status-pill DELIVERED">نشط</span>'}</td>
          <td class="actions-cell">
            <button class="btn xs" data-points="${c.id}">نقاط</button>
            <button class="btn xs ${c.blocked ? 'success' : 'danger'}" data-block="${c.id}">${c.blocked ? "إلغاء" : "حظر"}</button>
          </td>
        </tr>`).join("")}</tbody></table>`;
    el.querySelectorAll("[data-points]").forEach((b) => b.onclick = () => {
      const v = prompt("النقاط:");
      if (v == null) return;
      const n = parseInt(v, 10);
      if (isNaN(n)) return;
      const list = read(K.customers, []);
      const i = list.findIndex((c) => c.id === b.dataset.points);
      if (i >= 0) { list[i].points = n; write(K.customers, list); renderCustomers(); }
    });
    el.querySelectorAll("[data-block]").forEach((b) => b.onclick = () => {
      const list = read(K.customers, []);
      const i = list.findIndex((c) => c.id === b.dataset.block);
      if (i >= 0) { list[i].blocked = !list[i].blocked; write(K.customers, list); renderCustomers(); }
    });
  };

  /* ============ REVIEWS ============ */
  let reviewFilter = "pending";
  const rF = $("#reviewFilter");
  if (rF) rF.onchange = (e) => { reviewFilter = e.target.value; renderReviews(); };
  const renderReviews = () => {
    const el = $("#reviewsTable");
    if (!el) return;
    let list = read(K.reviews, []);
    if (reviewFilter === "pending") list = list.filter((r) => !r.approved);
    if (reviewFilter === "approved") list = list.filter((r) => r.approved);
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا مراجعات</p>`; return; }
    const products = read(K.products, []);
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>المنتج</th><th>الاسم</th><th>التقييم</th><th>النص</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${list.map((r) => {
        const p = products.find((x) => x.id === r.productId);
        return `<tr>
          <td>${esc(p ? p.nameAr : "—")}</td>
          <td>${esc(r.name)}</td>
          <td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
          <td style="max-width:340px;font-size:12px">${esc(r.body)}</td>
          <td>${r.approved ? '<span class="status-pill DELIVERED">منشور</span>' : '<span class="status-pill PENDING">بانتظار</span>'}</td>
          <td class="actions-cell">
            ${!r.approved ? `<button class="btn xs success" data-approve="${r.id}">موافقة</button>` : ""}
            <button class="btn xs danger" data-del="${r.id}">حذف</button>
          </td>
        </tr>`;
      }).join("")}</tbody></table>`;
    el.querySelectorAll("[data-approve]").forEach((b) => b.onclick = () => {
      const list = read(K.reviews, []);
      const i = list.findIndex((r) => r.id === b.dataset.approve);
      if (i >= 0) { list[i].approved = true; write(K.reviews, list); renderReviews(); renderDash(); }
    });
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("حذف؟")) return;
      write(K.reviews, read(K.reviews, []).filter((r) => r.id !== b.dataset.del));
      renderReviews();
    });
  };

  /* ============ MESSAGES ============ */
  let msgFilter = "all";
  const mF = $("#msgFilter");
  if (mF) mF.onchange = (e) => { msgFilter = e.target.value; renderMessages(); };
  const mExp = $("#exportMessages");
  if (mExp) mExp.onclick = () => {
    const list = read(K.messages, []);
    const rows = [["ID","Name","Contact","Subject","Message","Date","Read"]];
    list.forEach((m) => rows.push([m.id, m.name, m.contact, m.subject, m.message, new Date(m.createdAt).toLocaleString(), m.read]));
    download("messages.csv", csv(rows), "text/csv");
  };
  const renderMessages = () => {
    const el = $("#messagesTable");
    if (!el) return;
    let list = read(K.messages, []);
    if (msgFilter === "unread") list = list.filter((m) => !m.read);
    if (msgFilter === "read") list = list.filter((m) => m.read);
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا رسائل</p>`; return; }
    const SUBJ = { general: "استفسار", order: "طلب", custom: "مخصص", wholesale: "جملة", complaint: "شكوى", suggestion: "اقتراح" };
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>الاسم</th><th>التواصل</th><th>الموضوع</th><th>الرسالة</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${list.map((m) => `
        <tr style="${!m.read ? "background:color-mix(in srgb, var(--amber) 8%, transparent)" : ""}">
          <td>${esc(m.name)}</td>
          <td class="font-en">${esc(m.contact)}</td>
          <td>${SUBJ[m.subject] || m.subject}</td>
          <td style="max-width:340px;font-size:12px">${esc(m.message)}</td>
          <td class="muted" style="font-size:11px">${fmtDate(m.createdAt)}</td>
          <td>${m.read ? '<span class="status-pill DELIVERED">مقروءة</span>' : '<span class="status-pill PENDING">جديدة</span>'}</td>
          <td class="actions-cell">
            ${!m.read ? `<button class="btn xs success" data-read="${m.id}">تعليم كمقروءة</button>` : ""}
            <button class="btn xs danger" data-del="${m.id}">حذف</button>
          </td>
        </tr>`).join("")}</tbody></table>`;
    el.querySelectorAll("[data-read]").forEach((b) => b.onclick = () => {
      const list = read(K.messages, []);
      const i = list.findIndex((m) => m.id === b.dataset.read);
      if (i >= 0) { list[i].read = true; write(K.messages, list); renderMessages(); renderDash(); }
    });
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("حذف؟")) return;
      write(K.messages, read(K.messages, []).filter((m) => m.id !== b.dataset.del));
      renderMessages();
    });
  };

  /* ============ COUPONS ============ */
  const couponModal = $("#couponModal");
  const ncBtn = $("#newCouponBtn");
  if (ncBtn) ncBtn.onclick = () => {
    ["cp_code","cp_value","cp_maxUses","cp_minCart","cp_expires"].forEach((id) => { const e = $("#" + id); if (e) e.value = ""; });
    const ct = $("#cp_type"); if (ct) ct.value = "percent";
    couponModal.classList.remove("hidden");
  };
  const cpCancel = $("#cp_cancel");
  if (cpCancel) cpCancel.onclick = () => couponModal.classList.add("hidden");
  const cpSave = $("#cp_save");
  if (cpSave) cpSave.onclick = () => {
    const coupon = {
      id: newId("cp"),
      code: ($("#cp_code").value || "").toUpperCase().trim(),
      type: $("#cp_type").value,
      value: parseInt($("#cp_value").value, 10) || 0,
      maxUses: parseInt($("#cp_maxUses").value, 10) || 0,
      minCart: parseInt($("#cp_minCart").value, 10) || 0,
      expires: $("#cp_expires").value || null,
      uses: 0, active: true, createdAt: Date.now()
    };
    if (!coupon.code) { alert("أدخل الكود"); return; }
    const list = read(K.coupons, []);
    list.unshift(coupon); write(K.coupons, list);
    couponModal.classList.add("hidden");
    renderCoupons();
  };
  const renderCoupons = () => {
    const el = $("#couponsTable");
    if (!el) return;
    const list = read(K.coupons, []);
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا كوبونات</p>`; return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>الكود</th><th>النوع</th><th>القيمة</th><th>استخدامات</th><th>الحد الأدنى</th><th>الانتهاء</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${list.map((c) => `
        <tr>
          <td class="font-en"><strong>${esc(c.code)}</strong></td>
          <td>${c.type === "percent" ? "%" : "ثابت"}</td>
          <td class="font-en">${c.type === "percent" ? c.value + "%" : fmtJOD(c.value)}</td>
          <td>${c.uses} / ${c.maxUses || "∞"}</td>
          <td>${fmtJOD(c.minCart || 0)}</td>
          <td>${c.expires || "—"}</td>
          <td>${c.active ? '<span class="status-pill DELIVERED">نشط</span>' : '<span class="status-pill CANCELLED">موقوف</span>'}</td>
          <td class="actions-cell">
            <button class="btn xs" data-toggle="${c.id}">${c.active ? "إيقاف" : "تفعيل"}</button>
            <button class="btn xs danger" data-del="${c.id}">حذف</button>
          </td>
        </tr>`).join("")}</tbody></table>`;
    el.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = () => {
      const list = read(K.coupons, []);
      const i = list.findIndex((c) => c.id === b.dataset.toggle);
      if (i >= 0) { list[i].active = !list[i].active; write(K.coupons, list); renderCoupons(); }
    });
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("حذف؟")) return;
      write(K.coupons, read(K.coupons, []).filter((c) => c.id !== b.dataset.del));
      renderCoupons();
    });
  };

  /* ============ LOYALTY ============ */
  const renderLoyalty = () => {
    const s = window.SAWWA?.loyalty || {};
    const le = $("#loyEarn"); if (le) le.value = s.earnPerJOD ?? 1;
    const lr = $("#loyRedeem"); if (lr) lr.value = s.redeemValue ?? 100;
    const lm = $("#loyMin"); if (lm) lm.value = s.minRedeem ?? 100;
    const led = read(K.loyaltyLedger, []);
    const el = $("#loyaltyLedger");
    if (!el) return;
    if (!led.length) { el.innerHTML = `<p class="empty-state">لا حركات</p>`; return; }
    el.innerHTML = `<div class="admin-list">${led.slice(0, 30).map((e) => `
      <div class="admin-list-item">
        <span class="label">${esc(e.reason)} ${e.orderId ? `<br /><small class="font-en">${esc(e.orderId)}</small>` : ""}</span>
        <span class="value" style="color:${e.delta >= 0 ? '#2E7D32' : '#C03030'}">${e.delta >= 0 ? "+" : ""}${e.delta}</span>
      </div>`).join("")}</div>`;
  };
  const saveLoy = $("#saveLoyalty");
  if (saveLoy) saveLoy.onclick = () => {
    if(!window.SAWWA) window.SAWWA = {};
    window.SAWWA.loyalty = {
      earnPerJOD: parseFloat($("#loyEarn").value) || 1,
      redeemValue: parseInt($("#loyRedeem").value, 10) || 100,
      minRedeem: parseInt($("#loyMin").value, 10) || 100
    };
    write(K.settings + "_loyalty", window.SAWWA.loyalty);
    alert("تم");
  };

  /* ============ ANALYTICS ============ */
  const renderAnalytics = () => {
    const orders = read(K.orders, []);
    const paid = orders.filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "COD");
    const avg = paid.length ? paid.reduce((a, b) => a + b.total, 0) / paid.length : 0;
    const aa = $("#anaAvg"); if (aa) aa.textContent = fmtJOD(Math.round(avg));
    const conv = orders.length ? ((paid.length / orders.length) * 100).toFixed(1) : "0";
    const ac = $("#anaConv"); if (ac) ac.textContent = conv + "%";

    const counters = {};
    orders.forEach((o) => (o.items || []).forEach((it) => { const k = it.nameAr || it.id; counters[k] = (counters[k] || 0) + it.qty; }));
    const top = Object.entries(counters).sort((a,b) => b[1]-a[1]).slice(0, 8);
    const atp = $("#anaTopProducts");
    if (atp) atp.innerHTML = top.length
      ? `<div class="admin-list">${top.map(([n,q],i) => `<div class="admin-list-item"><span class="rank">${i+1}</span><span class="label">${esc(n)}</span><span class="value">${q}</span></div>`).join("")}</div>`
      : `<p class="empty-state">لا بيانات</p>`;

    const cities = {};
    orders.forEach((o) => { if (o.city) cities[o.city] = (cities[o.city] || 0) + 1; });
    const cl = Object.entries(cities).sort((a,b) => b[1]-a[1]).slice(0, 8);
    const aci = $("#anaCities");
    if (aci) aci.innerHTML = cl.length
      ? `<div class="admin-list">${cl.map(([c,n],i) => `<div class="admin-list-item"><span class="rank">${i+1}</span><span class="label">${esc(c)}</span><span class="value">${n}</span></div>`).join("")}</div>`
      : `<p class="empty-state">لا بيانات</p>`;
  };

  /* ============ NOTIFICATIONS ============ */
  const renderNotifications = () => {
    const list = read(K.notifications, []);
    const el = $("#sysNotifications");
    if (!el) return;
    if (!list.length) { el.innerHTML = `<p class="empty-state">لا إشعارات</p>`; return; }
    el.innerHTML = `<div class="admin-list">${list.slice(0, 20).map((n) => `
      <div class="admin-list-item">
        <span class="label"><strong>${esc(n.title)}</strong><br /><small class="muted">${esc(n.body)}</small><br /><small class="muted" style="font-size:10px">${fmtDate(n.createdAt)}</small></span>
      </div>`).join("")}</div>`;
  };
  const sNotif = $("#sendNotif");
  if (sNotif) sNotif.onclick = () => {
    const title = $("#notifTitle").value.trim();
    const body = $("#notifBody").value.trim();
    if (!title) { alert("أدخل العنوان"); return; }
    const list = read(K.notifications, []);
    list.unshift({ id: newId("n"), title, body, createdAt: Date.now() });
    write(K.notifications, list);
    $("#notifTitle").value = ""; $("#notifBody").value = "";
    renderNotifications();
    if (window.UI?.toast) UI.toast("تم الإرسال", "success");
  };

  /* ============ ANNOUNCE ============ */
  const renderAnnounce = () => {
    const a = read(K.announce, { ar: "شحن 3 دنانير", en: "3 JOD shipping", enabled: 1 });
    const aa = $("#annAr"); if (aa) aa.value = a.ar || "";
    const ae = $("#annEn"); if (ae) ae.value = a.en || "";
    const aen = $("#annEnabled"); if (aen) aen.value = a.enabled ? "1" : "0";
  };
  const sAnn = $("#saveAnnounce");
  if (sAnn) sAnn.onclick = () => {
    const a = { ar: $("#annAr").value.trim(), en: $("#annEn").value.trim(), enabled: $("#annEnabled").value === "1" ? 1 : 0 };
    write(K.announce, a);
    alert("تم");
  };

  /* ============ SETTINGS ============ */
  const renderSettings = () => {
    const s = read(K.settings, {});
    const sna = $("#setNameAr"); if (sna) sna.value = s.nameAr || window.SAWWA?.name?.ar || "سوّا سوق";
    const sne = $("#setNameEn"); if (sne) sne.value = s.nameEn || window.SAWWA?.name?.en || "SaWWA Souq";
    const sw = $("#setWhatsapp"); if (sw) sw.value = s.whatsapp || window.SAWWA?.whatsapp || "";
    const sc = $("#setCliq"); if (sc) sc.value = s.cliq || window.SAWWA?.cliqId || "";
  };
  const sSet = $("#saveSettings");
  if (sSet) sSet.onclick = () => {
    write(K.settings, {
      nameAr: $("#setNameAr").value.trim(),
      nameEn: $("#setNameEn").value.trim(),
      whatsapp: $("#setWhatsapp").value.trim(),
      cliq: $("#setCliq").value.trim()
    });
    alert("تم");
  };
  const sPwd = $("#savePwd");
  if (sPwd) sPwd.onclick = () => {
    const v = $("#newPwd").value.trim();
    if (v.length < 6) { alert("6 أحرف على الأقل"); return; }
    setPwd(v);
    $("#newPwd").value = "";
    alert("تم تحديث كلمة المرور");
  };

  /* ============ BACKUP ============ */
  const eAll = $("#exportAll");
  if (eAll) eAll.onclick = () => {
    const data = {
      products: read(K.products, []),
      orders: read(K.orders, []),
      reviews: read(K.reviews, []),
      customers: read(K.customers, []),
      coupons: read(K.coupons, []),
      loyaltyLedger: read(K.loyaltyLedger, []),
      notifications: read(K.notifications, []),
      messages: read(K.messages, []),
      announce: read(K.announce, {}),
      settings: read(K.settings, {}),
      points: localStorage.getItem(K.points) || "0",
      exportedAt: Date.now()
    };
    download("sawwa-backup-" + new Date().toISOString().slice(0,10) + ".json", JSON.stringify(data, null, 2), "application/json");
  };
  const iAll = $("#importAll");
  if (iAll) iAll.onclick = () => {
    const file = $("#importFile").files[0];
    if (!file) { alert("اختر ملف"); return; }
    if (!confirm("سيستبدل كل البيانات. متأكد؟")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        ["products","orders","reviews","customers","coupons","loyaltyLedger","notifications","messages","announce","settings"].forEach((k) => {
          if (data[k] != null) write(K[k], data[k]);
        });
        if (data.points != null) localStorage.setItem(K.points, String(data.points));
        alert("تم الاستيراد");
      } catch (err) { alert("ملف غير صالح"); }
    };
    reader.readAsText(file);
  };
  const fReset = $("#factoryReset");
  if (fReset) fReset.onclick = () => {
    if (!confirm("حذف كل البيانات؟")) return;
    if (!confirm("تأكيد نهائي؟")) return;
    Object.values(K).forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    location.reload();
  };

  /* ============ CLOCK ============ */
  setInterval(() => {
    const d = new Date();
    const el = $("#currentTime");
    if (el) el.textContent = d.toLocaleTimeString("ar-JO");
  }, 1000);

  /* ============ RENDER ALL ============ */
  const renderAll = () => {
    if (!localStorage.getItem(K.coupons)) write(K.coupons, []);
    if (!localStorage.getItem(K.customers)) write(K.customers, []);
    bindNav();
    renderDash();
    switchTab("dash");
  };

  if (sessionValid()) showPanel();

})();
