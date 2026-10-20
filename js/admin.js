/* ============================================================
   SaWWA Souq — Admin Panel v6
   Complete · Stock Editor GUI included
   ============================================================ */
(function () {
  "use strict";

  /* ============ HELPERS ============ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const K = {
    products: "sawwa_products",
    orders: "sawwa_orders",
    reviews: "sawwa_reviews",
    points: "sawwa_points",
    customers: "sawwa_customers",
    coupons: "sawwa_coupons",
    loyaltyLedger: "sawwa_loyalty_ledger",
    notifications: "sawwa_notifications",
    messages: "sawwa_messages",
    announce: "sawwa_announce",
    settings: "sawwa_settings",
    stockHistory: "sawwa_stock_history",
    adminPwd: "sawwa_admin_pwd",
    loginAttempts: "sawwa_login_attempts",
    sessionExpires: "sawwa_admin_expires"
  };

  const read = (k, fb) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v == null ? fb : v;
    } catch (e) {
      return fb;
    }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const getPwd = () => {
    const stored = localStorage.getItem(K.adminPwd);
    if (stored) return stored;
    return (window.SAWWA && window.SAWWA.adminPassword) || "sawwa2026";
  };
  const setPwd = (v) => localStorage.setItem(K.adminPwd, v);

  const fmtJOD = (cents) => ((cents || 0) / 100).toFixed(2) + " JOD";
  const fmtDate = (ts) => new Date(ts).toLocaleString("ar-JO");
  const newId = (p) => p + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

  const csv = (rows) => rows.map((r) => r.map((c) =>
    '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'
  ).join(",")).join("\n");

  const download = (name, content, mime) => {
    mime = mime || "text/plain";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  };

  /* ============ SESSION ============ */
  const SESSION_MINUTES = 60;
  const sessionValid = () => {
    const exp = parseInt(sessionStorage.getItem(K.sessionExpires) || "0", 10);
    return sessionStorage.getItem("sawwa_admin") === "1" && exp > Date.now();
  };
  const startSession = () => {
    sessionStorage.setItem("sawwa_admin", "1");
    sessionStorage.setItem(K.sessionExpires, String(Date.now() + SESSION_MINUTES * 60 * 1000));
  };

  /* ============ RATE LIMIT ============ */
  const LOCKOUT_MINUTES = 10;
  const MAX_ATTEMPTS = 5;
  const attemptState = () => read(K.loginAttempts, { count: 0, lockedUntil: 0 });
  const bumpAttempt = () => {
    const s = attemptState();
    s.count = (s.count || 0) + 1;
    if (s.count >= MAX_ATTEMPTS) {
      s.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      s.count = 0;
    }
    write(K.loginAttempts, s);
  };
  const clearAttempts = () => write(K.loginAttempts, { count: 0, lockedUntil: 0 });

  /* ============ SEED ============ */
  const seedCoupons = () => {
    if (!localStorage.getItem(K.coupons)) write(K.coupons, []);
  };
  const seedCustomers = () => {
    if (!localStorage.getItem(K.customers)) {
      const orders = read(K.orders, []);
      const map = new Map();
      orders.forEach((o) => {
        const key = o.phone || o.email || o.name;
        if (!key) return;
        if (!map.has(key)) map.set(key, {
          id: "cust-" + Math.random().toString(36).slice(2, 8),
          name: o.name || "—",
          phone: o.phone || "—",
          email: o.email || "—",
          city: o.city || "—",
          ordersCount: 0,
          totalSpent: 0,
          points: 0,
          blocked: false,
          createdAt: Date.now()
        });
        const c = map.get(key);
        c.ordersCount++;
        c.totalSpent += o.total || 0;
      });
      write(K.customers, Array.from(map.values()));
    }
  };

  /* ============ DOM REFS ============ */
  const loginScreen = $("#loginScreen");
  const adminApp = $("#adminApp");
  const loginBtn = $("#loginBtn");
  const pwdInput = $("#pwd");
  const loginErr = $("#loginErr");
  const logoutBtn = $("#logoutBtn");
  const productModal = $("#productModal");
  const couponModal = $("#couponModal");
  const stockModal = $("#stockModal");

  /* ============ SHOW PANEL ============ */
  const showPanel = () => {
    if (loginScreen) loginScreen.classList.add("hidden");
    if (adminApp) adminApp.classList.remove("hidden");
    renderAll();
  };

  /* ============ LOGIN ============ */
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const s = attemptState();
      if (s.lockedUntil && s.lockedUntil > Date.now()) {
        const mins = Math.ceil((s.lockedUntil - Date.now()) / 60000);
        if (loginErr) loginErr.textContent = "محظور مؤقتًا. حاول بعد " + mins + " دقيقة.";
        return;
      }
      if (pwdInput && pwdInput.value === getPwd()) {
        clearAttempts();
        startSession();
        if (loginErr) loginErr.textContent = "";
        showPanel();
      } else {
        bumpAttempt();
        const rem = MAX_ATTEMPTS - (attemptState().count || 0);
        if (loginErr) loginErr.textContent = "كلمة المرور غير صحيحة. محاولات متبقية: " + (rem > 0 ? rem : MAX_ATTEMPTS);
        if (pwdInput) pwdInput.focus();
      }
    });
  }
  if (pwdInput) {
    pwdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && loginBtn) loginBtn.click();
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("sawwa_admin");
      sessionStorage.removeItem(K.sessionExpires);
      location.reload();
    });
  }

  /* ============ NAV ============ */
  const TITLES = {
    dash: "نظرة عامة",
    orders: "الطلبات",
    products: "المنتجات",
    inventory: "المخزون",
    customers: "العملاء",
    reviews: "المراجعات",
    messages: "الرسائل",
    coupons: "الكوبونات",
    loyalty: "النقاط",
    analytics: "التحليلات",
    notifications: "الإشعارات",
    announce: "إعلان الموقع",
    settings: "الإعدادات",
    backup: "نسخ احتياطي"
  };

  const switchTab = (id) => {
    $$(".side-tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === id));
    $$(".tab-panel").forEach((x) => x.classList.toggle("active", x.id === "tab-" + id));
    const title = $("#topbarTitle");
    if (title) title.textContent = TITLES[id] || id;

    if (id === "dash") {
      renderDash();
      setTimeout(() => drawSalesChart(read(K.orders, [])), 100);
    }
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

  const sidebar = document.querySelector(".admin-sidebar");
  const menuToggle = $("#menuToggle");
  const sidebarClose = $("#sidebarClose");
  if (menuToggle && sidebar) menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  if (sidebarClose && sidebar) sidebarClose.addEventListener("click", () => sidebar.classList.remove("open"));

  /* ============ DASHBOARD ============ */
  const renderDash = () => {
    const orders = read(K.orders, []);
    const products = read(K.products, []);
    const reviews = read(K.reviews, []);
    const messages = read(K.messages, []);

    const paid = orders.filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "COD");
    const totalRev = paid.reduce((a, b) => a + (b.total || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t0 = today.getTime();
    const ordersToday = orders.filter((o) => (o.createdAt || 0) >= t0);
    const revToday = ordersToday
      .filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "COD")
      .reduce((a, b) => a + (b.total || 0), 0);

    const setTxt = (id, v) => { const el = $("#" + id); if (el) el.textContent = v; };
    setTxt("stOrders", orders.length);
    setTxt("stOrdersToday", "+" + ordersToday.length + " اليوم");
    setTxt("stRevenue", fmtJOD(totalRev));
    setTxt("stRevenueToday", "+" + fmtJOD(revToday) + " اليوم");
    setTxt("stPending", orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION").length);
    setTxt("stLow", products.filter((p) => (p.stock || 0) <= (p.minStock || 10)).length);

    const setBadge = (id, v) => { const el = $("#" + id); if (el) el.textContent = v || ""; };
    setBadge("badge-orders", orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION").length);
    setBadge("badge-low", products.filter((p) => (p.stock || 0) <= (p.minStock || 10)).length);
    setBadge("badge-reviews", reviews.filter((r) => !r.approved).length);
    setBadge("badge-messages", messages.filter((m) => !m.read).length);

    drawSalesChart(orders);
    renderTopProducts(orders);
    renderRecentOrders(orders);
    renderSmartAlerts(orders, products);
  };

  /* ============ CHART ============ */
  const drawSalesChart = (orders) => {
    const canvas = $("#chartSales");
    if (!canvas) return;
    const cssW = canvas.clientWidth;
    if (!cssW || cssW < 100) {
      setTimeout(() => drawSalesChart(orders), 200);
      return;
    }
    const cssH = 220;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ start: d.getTime(), end: d.getTime() + 86400000, total: 0 });
    }
    orders.forEach((o) => {
      if (o.paymentStatus !== "PAID" && o.paymentMethod !== "COD") return;
      days.forEach((d) => {
        if (o.createdAt >= d.start && o.createdAt < d.end) d.total += o.total || 0;
      });
    });

    const max = Math.max.apply(null, days.map((d) => d.total).concat([100]));
    const padL = 50, padR = 12, padT = 20, padB = 30;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;
    const barW = w / days.length - 10;

    ctx.strokeStyle = "rgba(0,229,212,.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padT + (h / 4) * i;
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + w, y);
    }
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
    grad.addColorStop(0, "#00E5D4");
    grad.addColorStop(1, "#0A3D38");

    days.forEach((d, i) => {
      const bh = (d.total / max) * h;
      const x = padL + i * (w / days.length) + 5;
      const y = padT + h - bh;
      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = 6;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, padT + h);
      ctx.lineTo(x, padT + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    });

    ctx.fillStyle = "#7A8C8A";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    days.forEach((d, i) => {
      const date = new Date(d.start);
      const lbl = date.getDate() + "/" + (date.getMonth() + 1);
      ctx.fillText(lbl, padL + i * (w / days.length) + barW / 2 + 5, cssH - 10);
    });
  };

  const renderTopProducts = (orders) => {
    const counters = {};
    orders.forEach((o) => (o.items || []).forEach((it) => {
      const key = it.nameAr || it.id;
      counters[key] = (counters[key] || 0) + it.qty;
    }));
    const list = Object.entries(counters).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const el = $("#topProducts");
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<p class="empty-state">لا توجد بيانات</p>';
      return;
    }
    el.innerHTML = '<div class="admin-list">' + list.map(([name, qty], i) =>
      '<div class="admin-list-item">' +
        '<span class="rank">' + (i + 1) + '</span>' +
        '<span class="label">' + esc(name) + '</span>' +
        '<span class="value">' + qty + '</span>' +
      '</div>'
    ).join("") + '</div>';
  };

  const renderRecentOrders = (orders) => {
    const list = orders.slice(0, 6);
    const el = $("#recentOrders");
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<p class="empty-state">لا توجد طلبات</p>';
      return;
    }
    el.innerHTML = '<div class="admin-list">' + list.map((o) =>
      '<div class="admin-list-item">' +
        '<span class="label"><strong class="font-en">' + esc(o.id) + '</strong><br />' +
        '<small class="muted">' + esc(o.name || "") + ' — ' + esc(o.phone || "") + '</small></span>' +
        '<span class="value">' + fmtJOD(o.total) + '</span>' +
      '</div>'
    ).join("") + '</div>';
  };

  const renderSmartAlerts = (orders, products) => {
    const alerts = [];
    const low = products.filter((p) => (p.stock || 0) <= (p.minStock || 10) && p.stock > 0);
    low.slice(0, 5).forEach((p) => alerts.push({ type: "warn", text: "مخزون منخفض: " + p.nameAr + " — " + p.stock }));
    if (low.length > 5) alerts.push({ type: "warn", text: "و " + (low.length - 5) + " أخرى" });
    const out = products.filter((p) => (p.stock || 0) === 0);
    out.slice(0, 3).forEach((p) => alerts.push({ type: "danger", text: "نفد: " + p.nameAr }));
    const pending = orders.filter((o) => o.paymentStatus === "AWAITING_VERIFICATION");
    if (pending.length) alerts.push({ type: "info", text: pending.length + " طلب بانتظار التحقق" });
    const rp = read(K.reviews, []).filter((r) => !r.approved).length;
    if (rp) alerts.push({ type: "info", text: rp + " مراجعة بانتظار الموافقة" });
    const mp = read(K.messages, []).filter((m) => !m.read).length;
    if (mp) alerts.push({ type: "info", text: mp + " رسالة غير مقروءة" });

    const el = $("#smartAlerts");
    if (!el) return;
    if (!alerts.length) {
      el.innerHTML = '<p class="empty-state">لا تنبيهات ✓</p>';
      return;
    }
    el.innerHTML = '<div class="admin-list">' + alerts.map((a) => {
      const color = a.type === "danger" ? "#FF5252" : a.type === "warn" ? "#FFA726" : "#29B6F6";
      return '<div class="admin-list-item" style="border-inline-start:4px solid ' + color + '">' +
        '<span class="label">' + esc(a.text) + '</span></div>';
    }).join("") + '</div>';
  };

  /* ============ ORDERS ============ */
  let orderSearchQ = "", orderFilterStatus = "", orderFilterPay = "";
  const oSearch = $("#orderSearch"), oFS = $("#orderFilterStatus"), oFP = $("#orderFilterPay"), oExp = $("#exportOrders");
  if (oSearch) oSearch.oninput = (e) => { orderSearchQ = e.target.value.toLowerCase(); renderOrders(); };
  if (oFS) oFS.onchange = (e) => { orderFilterStatus = e.target.value; renderOrders(); };
  if (oFP) oFP.onchange = (e) => { orderFilterPay = e.target.value; renderOrders(); };
  if (oExp) oExp.onclick = () => {
    const orders = read(K.orders, []);
    const rows = [["ID", "Name", "Phone", "City", "Total(JOD)", "Payment", "PayStatus", "Status", "Date"]];
    orders.forEach((o) => rows.push([o.id, o.name, o.phone, o.city, (o.total / 100).toFixed(2), o.paymentMethod, o.paymentStatus, o.status, new Date(o.createdAt).toLocaleString()]));
    download("orders.csv", csv(rows), "text/csv");
  };

  const renderOrders = () => {
    const el = $("#ordersTable");
    if (!el) return;
    let orders = read(K.orders, []);
    if (orderSearchQ) orders = orders.filter((o) =>
      ((o.id || "") + (o.name || "") + (o.phone || "") + (o.email || "")).toLowerCase().includes(orderSearchQ)
    );
    if (orderFilterStatus) orders = orders.filter((o) => o.status === orderFilterStatus);
    if (orderFilterPay) orders = orders.filter((o) => o.paymentMethod === orderFilterPay);

    if (!orders.length) { el.innerHTML = '<p class="empty-state">لا توجد طلبات</p>'; return; }

    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>رقم</th><th>العميل</th><th>الهاتف</th><th>المدينة</th><th>المجموع</th>' +
      '<th>الدفع</th><th>حالة الدفع</th><th>الحالة</th><th>إجراءات</th>' +
      '</tr></thead><tbody>' +
      orders.map((o) => '<tr>' +
        '<td class="font-en"><strong>' + esc(o.id) + '</strong></td>' +
        '<td>' + esc(o.name || "") + '</td>' +
        '<td class="font-en">' + esc(o.phone || "") + '</td>' +
        '<td>' + esc(o.city || "") + '</td>' +
        '<td class="font-en">' + fmtJOD(o.total) + '</td>' +
        '<td>' + esc(o.paymentMethod || "") + '</td>' +
        '<td><span class="status-pill ' + o.paymentStatus + '">' + esc(o.paymentStatus) + '</span></td>' +
        '<td><span class="status-pill ' + o.status + '">' + esc(o.status) + '</span></td>' +
        '<td class="actions-cell">' +
          (o.paymentStatus === "AWAITING_VERIFICATION"
            ? '<button class="btn xs success" data-verify="' + o.id + '">تأكيد</button>' +
              '<button class="btn xs danger" data-reject="' + o.id + '">رفض</button>'
            : "") +
          (o.status !== "SHIPPED" && o.status !== "DELIVERED"
            ? '<button class="btn xs" data-ship="' + o.id + '">شحن</button>'
            : "") +
          (o.status !== "DELIVERED"
            ? '<button class="btn xs success" data-deliver="' + o.id + '">تسليم</button>'
            : "") +
          '<button class="btn xs danger" data-del="' + o.id + '">حذف</button>' +
        '</td></tr>').join("") +
      '</tbody></table>';

    el.querySelectorAll("[data-verify]").forEach((b) => b.onclick = () => updateOrder(b.dataset.verify, { paymentStatus: "PAID", status: "CONFIRMED" }));
    el.querySelectorAll("[data-reject]").forEach((b) => b.onclick = () => updateOrder(b.dataset.reject, { paymentStatus: "FAILED", status: "CANCELLED" }));
    el.querySelectorAll("[data-ship]").forEach((b) => b.onclick = () => updateOrder(b.dataset.ship, { status: "SHIPPED" }));
    el.querySelectorAll("[data-deliver]").forEach((b) => b.onclick = () => updateOrder(b.dataset.deliver, { status: "DELIVERED" }));
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("تأكيد الحذف؟")) return;
      write(K.orders, read(K.orders, []).filter((o) => o.id !== b.dataset.del));
      renderOrders();
      renderDash();
    });
  };

  const updateOrder = (id, patch) => {
    const orders = read(K.orders, []);
    const i = orders.findIndex((o) => o.id === id);
    if (i < 0) return;
    orders[i] = Object.assign({}, orders[i], patch);
    write(K.orders, orders);
    if (patch.paymentStatus === "PAID" && orders[i].pointsEarned > 0) {
      const led = read(K.loyaltyLedger, []);
      led.unshift({ id: newId("pt"), orderId: id, delta: orders[i].pointsEarned, reason: "تأكيد دفع", createdAt: Date.now() });
      write(K.loyaltyLedger, led);
      const pts = parseInt(localStorage.getItem(K.points) || "0", 10);
      localStorage.setItem(K.points, String(pts + orders[i].pointsEarned));
    }
    renderOrders();
    renderDash();
  };

  /* ============ PRODUCTS ============ */
  let prodSearchQ = "", prodFilterType = "";
  const pSearch = $("#prodSearch"), pFT = $("#prodFilterType");
  if (pSearch) pSearch.oninput = (e) => { prodSearchQ = e.target.value.toLowerCase(); renderProducts(); };
  if (pFT) pFT.onchange = (e) => { prodFilterType = e.target.value; renderProducts(); };

  let editingProductId = null;
  let currentProductImage = "";

  const fileToCompressedBase64 = (file, maxSize) => {
    maxSize = maxSize || 800;
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) { reject("not_image"); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width, h = img.height;
          if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
          else if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85));
        };
        img.onerror = () => reject("load_error");
        img.src = e.target.result;
      };
      reader.onerror = () => reject("read_error");
      reader.readAsDataURL(file);
    });
  };

  const renderImagePreview = () => {
    const preview = $("#pm_preview");
    const clearBtn = $("#pm_clear");
    if (!preview) return;
    if (currentProductImage) {
      preview.innerHTML = '<img src="' + currentProductImage + '" alt="preview" />';
      if (clearBtn) clearBtn.style.display = "inline-flex";
    } else {
      preview.innerHTML = '<div class="iu-empty"><div class="iu-icon">📷</div>' +
        '<div class="iu-text">اسحب الصورة هنا</div>' +
        '<div class="iu-hint">JPG · PNG · WebP</div></div>';
      if (clearBtn) clearBtn.style.display = "none";
    }
    updateLivePreview();
  };

  const updateLivePreview = () => {
    const nameAr = ($("#pm_nameAr") || {}).value || "الاسم العربي";
    const nameEn = ($("#pm_nameEn") || {}).value || "English Name";
    const price = parseInt(($("#pm_price") || {}).value, 10) || 0;
    const type = ($("#pm_type") || {}).value || "RUBBER";
    const stock = parseInt(($("#pm_stock") || {}).value, 10) || 0;

    const pNameAr = $("#pm_previewNameAr"); if (pNameAr) pNameAr.textContent = nameAr;
    const pNameEn = $("#pm_previewNameEn"); if (pNameEn) pNameEn.textContent = nameEn;
    const pPrice = $("#pm_previewPrice"); if (pPrice) pPrice.textContent = fmtJOD(price);
    const pType = $("#pm_previewType"); if (pType) pType.textContent = type;

    const pImg = $("#pm_previewImg");
    if (pImg) {
      if (currentProductImage) pImg.innerHTML = '<img src="' + currentProductImage + '" alt="" />';
      else pImg.innerHTML = '<span>📷</span>';
    }
    const pStatus = $("#pm_previewStatus");
    if (pStatus) {
      if (stock <= 0) pStatus.textContent = "⚠️ نفد المخزون";
      else if (stock <= 10) pStatus.textContent = "⚠️ " + stock + " متبقية";
      else pStatus.textContent = "✓ متوفر · " + stock + " وحدة";
    }
  };

  const bindImageUploader = () => {
    const drop = $("#pm_drop");
    const fileInput = $("#pm_file");
    const chooseBtn = $("#pm_choose");
    const clearBtn = $("#pm_clear");
    if (!drop || !fileInput) return;

    const handleFile = async (file) => {
      try {
        currentProductImage = await fileToCompressedBase64(file);
        renderImagePreview();
      } catch (e) {
        alert("تعذّر تحميل الصورة: " + e);
      }
    };

    if (chooseBtn) chooseBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); };
    drop.onclick = (e) => { if (e.target.closest("button")) return; fileInput.click(); };
    fileInput.onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) handleFile(f); };
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
    if (clearBtn) clearBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentProductImage = "";
      fileInput.value = "";
      renderImagePreview();
    };
  };

  const bindLivePreviewInputs = () => {
    ["pm_nameAr", "pm_nameEn", "pm_price", "pm_type", "pm_stock"].forEach((id) => {
      const el = $("#" + id);
      if (el) {
        el.removeEventListener("input", updateLivePreview);
        el.removeEventListener("change", updateLivePreview);
        el.addEventListener("input", updateLivePreview);
        el.addEventListener("change", updateLivePreview);
      }
    });
  };

  const npBtn = $("#newProductBtn");
  if (npBtn) npBtn.onclick = () => {
    editingProductId = null;
    currentProductImage = "";
    const title = $("#prodModalTitle");
    if (title) title.textContent = "منتج جديد";
    ["pm_nameAr", "pm_nameEn", "pm_descAr", "pm_descEn", "pm_price", "pm_compare", "pm_cost", "pm_stock", "pm_pkg", "pm_minStock"].forEach((id) => {
      const e = $("#" + id);
      if (e) e.value = "";
    });
    const pt = $("#pm_type"); if (pt) pt.value = "RUBBER";
    const ms = $("#pm_minStock"); if (ms) ms.value = "10";
    const fi = $("#pm_file"); if (fi) fi.value = "";
    renderImagePreview();
    bindImageUploader();
    bindLivePreviewInputs();
    updateLivePreview();
    if (productModal) productModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const pmCancel = $("#pm_cancel");
  if (pmCancel) pmCancel.onclick = () => {
    if (productModal) productModal.classList.add("hidden");
    document.body.style.overflow = "";
  };
  if (productModal) {
    productModal.addEventListener("click", (e) => {
      if (e.target === productModal) {
        productModal.classList.add("hidden");
        document.body.style.overflow = "";
      }
    });
  }

  const pmSave = $("#pm_save");
  if (pmSave) pmSave.onclick = () => {
    const data = {
      nameAr: (($("#pm_nameAr") || {}).value || "").trim(),
      nameEn: (($("#pm_nameEn") || {}).value || "").trim(),
      descAr: (($("#pm_descAr") || {}).value || "").trim(),
      descEn: (($("#pm_descEn") || {}).value || "").trim(),
      type: ($("#pm_type") || {}).value || "RUBBER",
      price: parseInt(($("#pm_price") || {}).value, 10) || 0,
      compareAtPrice: parseInt(($("#pm_compare") || {}).value, 10) || null,
      costPrice: parseInt(($("#pm_cost") || {}).value, 10) || 0,
      stock: parseInt(($("#pm_stock") || {}).value, 10) || 0,
      minStock: parseInt(($("#pm_minStock") || {}).value, 10) || 10,
      packaging: (($("#pm_pkg") || {}).value || "").trim(),
      images: currentProductImage ? [currentProductImage] : [],
      warranty: true,
      active: true
    };
    if (!data.nameAr || !data.nameEn) { alert("الاسم العربي والإنجليزي مطلوبان"); return; }
    if (data.price <= 0) { alert("سعر البيع مطلوب"); return; }

    const products = read(K.products, []);
    if (editingProductId) {
      const i = products.findIndex((p) => p.id === editingProductId);
      if (i >= 0) {
        const oldStock = products[i].stock || 0;
        products[i] = Object.assign({}, products[i], data);
        if (oldStock !== data.stock) {
          addStockHistory(editingProductId, data.stock - oldStock, "تعديل من مودال المنتج");
        }
      }
    } else {
      products.unshift(Object.assign({}, data, {
        id: newId("p"),
        slug: "p-" + Date.now().toString(36),
        createdAt: Date.now()
      }));
    }
    write(K.products, products);
    if (productModal) productModal.classList.add("hidden");
    document.body.style.overflow = "";
    renderProducts();
    renderDash();
  };

  const renderProducts = () => {
    const el = $("#prodTable");
    if (!el) return;
    let list = read(K.products, []);
    if (prodSearchQ) list = list.filter((p) => (p.nameAr + p.nameEn).toLowerCase().includes(prodSearchQ));
    if (prodFilterType) list = list.filter((p) => p.type === prodFilterType);
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا توجد منتجات</p>'; return; }

    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>الصورة</th><th>الاسم (عربي)</th><th>الاسم (إنجليزي)</th>' +
      '<th>النوع</th><th>السعر</th><th>قبل الخصم</th><th>المخزون</th><th>مفعّل</th><th>إجراءات</th>' +
      '</tr></thead><tbody>' +
      list.map((p) => {
        const lowTh = p.minStock || 10;
        const stockColor = p.stock <= 0 ? "#FF5252" : p.stock <= lowTh ? "#FFA726" : "inherit";
        return '<tr>' +
        '<td>' + (p.images && p.images[0]
          ? '<img src="' + p.images[0] + '" style="width:48px;height:48px;object-fit:cover;border-radius:8px" />'
          : '<span style="display:inline-block;width:48px;height:48px;background:var(--a-bg-3);border-radius:8px"></span>') + '</td>' +
        '<td>' + esc(p.nameAr) + '</td>' +
        '<td dir="ltr" style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--a-muted)">' + esc(p.nameEn) + '</td>' +
        '<td>' + esc(p.type) + '</td>' +
        '<td class="font-en">' + fmtJOD(p.price) + '</td>' +
        '<td class="font-en">' + (p.compareAtPrice ? fmtJOD(p.compareAtPrice) : "—") + '</td>' +
        '<td class="font-en" style="color:' + stockColor + ';font-weight:800">' + (p.stock || 0) + '</td>' +
        '<td>' + (p.active ? "✓" : "✕") + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn xs" data-edit="' + p.id + '">تعديل</button>' +
          '<button class="btn xs" data-toggle="' + p.id + '">' + (p.active ? "إخفاء" : "إظهار") + '</button>' +
          '<button class="btn xs danger" data-del="' + p.id + '">حذف</button>' +
        '</td></tr>';
      }).join("") +
      '</tbody></table>';

    el.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => {
      const p = read(K.products, []).find((x) => x.id === b.dataset.edit);
      if (!p) return;
      editingProductId = p.id;
      const title = $("#prodModalTitle");
      if (title) title.textContent = "تعديل منتج";
      const setV = (id, v) => { const e = $("#" + id); if (e) e.value = v; };
      setV("pm_nameAr", p.nameAr || "");
      setV("pm_nameEn", p.nameEn || "");
      setV("pm_descAr", p.descAr || "");
      setV("pm_descEn", p.descEn || "");
      setV("pm_type", p.type || "RUBBER");
      setV("pm_price", p.price || 0);
      setV("pm_compare", p.compareAtPrice || "");
      setV("pm_cost", p.costPrice || 0);
      setV("pm_stock", p.stock || 0);
      setV("pm_minStock", p.minStock || 10);
      setV("pm_pkg", p.packaging || "");
      currentProductImage = (p.images && p.images[0]) || "";
      const fi = $("#pm_file"); if (fi) fi.value = "";
      renderImagePreview();
      bindImageUploader();
      bindLivePreviewInputs();
      updateLivePreview();
      if (productModal) productModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });

    el.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = () => {
      const list = read(K.products, []);
      const i = list.findIndex((x) => x.id === b.dataset.toggle);
      if (i >= 0) {
        list[i].active = !list[i].active;
        write(K.products, list);
        renderProducts();
      }
    });

    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      if (!confirm("تأكيد الحذف؟")) return;
      write(K.products, read(K.products, []).filter((x) => x.id !== b.dataset.del));
      renderProducts();
    });
  };

  /* ============ STOCK HISTORY ============ */
  const getStockHistory = (productId) => {
    const all = read(K.stockHistory, {});
    return all[productId] || [];
  };
  const addStockHistory = (productId, delta, reason) => {
    if (!productId || !delta) return;
    const all = read(K.stockHistory, {});
    if (!all[productId]) all[productId] = [];
    all[productId].unshift({
      delta: delta,
      reason: reason || "تعديل",
      at: Date.now()
    });
    all[productId] = all[productId].slice(0, 50);
    write(K.stockHistory, all);
  };

  /* ============ INVENTORY ============ */
  let invSearchQ = "", invFilterStatus = "";
  const iSearch = $("#invSearch");
  const iFS = $("#invFilterStatus");
  if (iSearch) iSearch.oninput = (e) => { invSearchQ = e.target.value.toLowerCase(); renderInventory(); };
  if (iFS) iFS.onchange = (e) => { invFilterStatus = e.target.value; renderInventory(); };

  const iExp = $("#exportInventory");
  if (iExp) iExp.onclick = () => {
    const list = read(K.products, []);
    const rows = [["ID", "NameAr", "NameEn", "Type", "Stock", "MinStock", "Price(JOD)"]];
    list.forEach((p) => rows.push([p.id, p.nameAr, p.nameEn, p.type, p.stock, p.minStock || 10, (p.price / 100).toFixed(2)]));
    download("inventory.csv", csv(rows), "text/csv");
  };

  const renderInventory = () => {
    const el = $("#inventoryTable");
    if (!el) return;
    let list = read(K.products, []);
    if (invSearchQ) list = list.filter((p) => (p.nameAr + p.nameEn).toLowerCase().includes(invSearchQ));
    if (invFilterStatus) {
      list = list.filter((p) => {
        const lowTh = p.minStock || 10;
        const s = p.stock || 0;
        if (invFilterStatus === "out") return s === 0;
        if (invFilterStatus === "low") return s > 0 && s <= lowTh;
        if (invFilterStatus === "ok") return s > lowTh;
        return true;
      });
    }
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا توجد منتجات</p>'; return; }

    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>#</th><th>الصورة</th><th>المنتج</th><th>النوع</th><th>المخزون</th><th>حد التنبيه</th><th>الحالة</th><th>إجراءات</th>' +
      '</tr></thead><tbody>' +
      list.map((p, i) => {
        const lowTh = p.minStock || 10;
        const stock = p.stock || 0;
        let statusClass = "DELIVERED", statusText = "متوفر";
        if (stock === 0) { statusClass = "CANCELLED"; statusText = "نفد"; }
        else if (stock <= lowTh) { statusClass = "PENDING"; statusText = "منخفض"; }
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + (p.images && p.images[0]
            ? '<img src="' + p.images[0] + '" style="width:42px;height:42px;object-fit:cover;border-radius:8px" />'
            : '<span style="display:inline-block;width:42px;height:42px;background:var(--a-bg-3);border-radius:8px"></span>') + '</td>' +
          '<td>' + esc(p.nameAr) + '<br /><small class="muted" dir="ltr" style="font-family:\'JetBrains Mono\',monospace;font-size:10px">' + esc(p.nameEn) + '</small></td>' +
          '<td>' + esc(p.type) + '</td>' +
          '<td><strong class="font-en" style="font-size:16px;color:' + (stock === 0 ? "#FF5252" : stock <= lowTh ? "#FFA726" : "#00E5D4") + '">' + stock + '</strong></td>' +
          '<td class="font-en">' + lowTh + '</td>' +
          '<td><span class="status-pill ' + statusClass + '">' + statusText + '</span></td>' +
          '<td class="actions-cell">' +
            '<button class="btn xs" data-stock-edit="' + p.id + '">تعديل المخزون</button>' +
          '</td></tr>';
      }).join("") +
      '</tbody></table>';

    el.querySelectorAll("[data-stock-edit]").forEach((b) => b.onclick = () => {
      openStockModal(b.dataset.stockEdit);
    });
  };

  const bulkBtn = $("#bulkUpdate");
  if (bulkBtn) bulkBtn.onclick = () => {
    const v = prompt("الكمية للجميع:");
    if (v == null) return;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 0) return;
    const list = read(K.products, []);
    list.forEach((p) => {
      const oldStock = p.stock || 0;
      if (oldStock !== n) {
        addStockHistory(p.id, n - oldStock, "تعديل جماعي");
        p.stock = n;
      }
    });
    write(K.products, list);
    renderInventory();
    renderDash();
  };

  /* ============ STOCK EDITOR MODAL ============ */
  let currentStockProduct = null;
  let pendingStock = 0;
  let pendingMinStock = 10;

  const openStockModal = (productId) => {
    const p = read(K.products, []).find((x) => x.id === productId);
    if (!p || !stockModal) return;

    currentStockProduct = p;
    pendingStock = p.stock || 0;
    pendingMinStock = p.minStock || 10;

    // Fill header
    const imgEl = $("#sm_img");
    if (imgEl) {
      if (p.images && p.images[0]) imgEl.innerHTML = '<img src="' + p.images[0] + '" alt="" />';
      else imgEl.innerHTML = '<span>📦</span>';
    }
    const nameEl = $("#sm_name"); if (nameEl) nameEl.textContent = p.nameAr;
    const typeEl = $("#sm_type"); if (typeEl) typeEl.textContent = p.type;
    const idEl = $("#sm_id"); if (idEl) idEl.textContent = p.id;

    // Fill values
    const newStockInput = $("#sm_newStock"); if (newStockInput) newStockInput.value = pendingStock;
    const minStockInput = $("#sm_minStock"); if (minStockInput) minStockInput.value = pendingMinStock;

    updateStockPreview();
    renderStockHistory();

    stockModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const updateStockPreview = () => {
    const valEl = $("#sm_current");
    const statEl = $("#sm_status");
    if (!valEl || !statEl) return;

    valEl.textContent = pendingStock;

    valEl.classList.add("bump");
    setTimeout(() => valEl.classList.remove("bump"), 300);

    statEl.classList.remove("ok", "low", "out");
    if (pendingStock === 0) {
      statEl.classList.add("out");
      statEl.textContent = "نفد المخزون";
    } else if (pendingStock <= pendingMinStock) {
      statEl.classList.add("low");
      statEl.textContent = "منخفض";
    } else {
      statEl.classList.add("ok");
      statEl.textContent = "متوفر";
    }
  };

  const renderStockHistory = () => {
    const el = $("#sm_history");
    if (!el || !currentStockProduct) return;
    const history = getStockHistory(currentStockProduct.id);
    if (!history.length) {
      el.innerHTML = '<p class="empty-state" style="padding:20px 0">لا توجد حركات سابقة</p>';
      return;
    }
    el.innerHTML = history.slice(0, 10).map((h) => {
      const cls = h.delta >= 0 ? "plus" : "minus";
      const sign = h.delta >= 0 ? "+" : "";
      return '<div class="sm-history-item">' +
        '<span class="sm-history-delta ' + cls + '">' + sign + h.delta + '</span>' +
        '<span class="sm-history-reason">' + esc(h.reason) + '</span>' +
        '<span class="sm-history-time">' + new Date(h.at).toLocaleString("ar-JO") + '</span>' +
      '</div>';
    }).join("");
  };

  // Quick buttons
  $$(".sm-qbtn").forEach((b) => {
    b.onclick = () => {
      const delta = parseInt(b.dataset.delta, 10);
      pendingStock = Math.max(0, pendingStock + delta);
      const newStockInput = $("#sm_newStock"); if (newStockInput) newStockInput.value = pendingStock;
      updateStockPreview();
    };
  });

  // Apply exact value
  const applyBtn = $("#sm_apply");
  if (applyBtn) applyBtn.onclick = () => {
    const v = parseInt(($("#sm_newStock") || {}).value, 10);
    if (isNaN(v) || v < 0) { alert("قيمة غير صالحة"); return; }
    pendingStock = v;
    updateStockPreview();
  };

  // Save min stock
  const saveMinBtn = $("#sm_saveMin");
  if (saveMinBtn) saveMinBtn.onclick = () => {
    const v = parseInt(($("#sm_minStock") || {}).value, 10);
    if (isNaN(v) || v < 0) { alert("قيمة غير صالحة"); return; }
    pendingMinStock = v;
    updateStockPreview();
  };

  // Save all
  const smSave = $("#sm_save");
  if (smSave) smSave.onclick = () => {
    if (!currentStockProduct) return;
    const list = read(K.products, []);
    const i = list.findIndex((p) => p.id === currentStockProduct.id);
    if (i < 0) return;

    const oldStock = list[i].stock || 0;
    const oldMin = list[i].minStock || 10;

    if (oldStock !== pendingStock) {
      addStockHistory(currentStockProduct.id, pendingStock - oldStock, "تعديل يدوي");
    }
    if (oldMin !== pendingMinStock) {
      addStockHistory(currentStockProduct.id, 0, "تغيير حد التنبيه: " + oldMin + " → " + pendingMinStock);
    }

    list[i].stock = pendingStock;
    list[i].minStock = pendingMinStock;
    write(K.products, list);

    if (stockModal) stockModal.classList.add("hidden");
    document.body.style.overflow = "";
    currentStockProduct = null;

    renderInventory();
    renderDash();

    if (window.UI && window.UI.toast) {
      window.UI.toast("تم تحديث المخزون", "success");
    }
  };

  // Close modal
  const smCancel = $("#sm_cancel");
  if (smCancel) smCancel.onclick = () => {
    if (stockModal) stockModal.classList.add("hidden");
    document.body.style.overflow = "";
    currentStockProduct = null;
  };
  if (stockModal) {
    stockModal.addEventListener("click", (e) => {
      if (e.target === stockModal) {
        stockModal.classList.add("hidden");
        document.body.style.overflow = "";
        currentStockProduct = null;
      }
    });
  }

  /* ============ CUSTOMERS ============ */
  let custSearchQ = "";
  const cSearch = $("#custSearch");
  if (cSearch) cSearch.oninput = (e) => { custSearchQ = e.target.value.toLowerCase(); renderCustomers(); };

  const renderCustomers = () => {
    seedCustomers();
    const el = $("#customersTable");
    if (!el) return;
    let list = read(K.customers, []);
    if (custSearchQ) list = list.filter((c) => (c.name + c.phone + c.email).toLowerCase().includes(custSearchQ));
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا عملاء</p>'; return; }

    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>الاسم</th><th>الهاتف</th><th>الإيميل</th><th>المدينة</th>' +
      '<th>الطلبات</th><th>المجموع</th><th>النقاط</th><th>الحالة</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((c) => '<tr>' +
        '<td>' + esc(c.name) + '</td>' +
        '<td class="font-en">' + esc(c.phone) + '</td>' +
        '<td>' + esc(c.email) + '</td>' +
        '<td>' + esc(c.city) + '</td>' +
        '<td class="font-en">' + c.ordersCount + '</td>' +
        '<td class="font-en">' + fmtJOD(c.totalSpent) + '</td>' +
        '<td class="font-en">' + (c.points || 0) + '</td>' +
        '<td>' + (c.blocked ? '<span class="status-pill CANCELLED">محظور</span>' : '<span class="status-pill DELIVERED">نشط</span>') + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn xs" data-points="' + c.id + '">نقاط</button>' +
          '<button class="btn xs ' + (c.blocked ? "success" : "danger") + '" data-block="' + c.id + '">' + (c.blocked ? "إلغاء" : "حظر") + '</button>' +
        '</td></tr>').join("") +
      '</tbody></table>';

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
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا مراجعات</p>'; return; }
    const products = read(K.products, []);
    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>المنتج</th><th>الاسم</th><th>التقييم</th><th>النص</th><th>الحالة</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((r) => {
        const p = products.find((x) => x.id === r.productId);
        return '<tr>' +
          '<td>' + esc(p ? p.nameAr : "—") + '</td>' +
          '<td>' + esc(r.name) + '</td>' +
          '<td>' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) + '</td>' +
          '<td style="max-width:340px;font-size:12px">' + esc(r.body) + '</td>' +
          '<td>' + (r.approved ? '<span class="status-pill DELIVERED">منشور</span>' : '<span class="status-pill PENDING">بانتظار</span>') + '</td>' +
          '<td class="actions-cell">' +
            (!r.approved ? '<button class="btn xs success" data-approve="' + r.id + '">موافقة</button>' : "") +
            '<button class="btn xs danger" data-del="' + r.id + '">حذف</button>' +
          '</td></tr>';
      }).join("") +
      '</tbody></table>';

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
    const rows = [["ID", "Name", "Contact", "Subject", "Message", "Date", "Read"]];
    list.forEach((m) => rows.push([m.id, m.name, m.contact, m.subject, m.message, new Date(m.createdAt).toLocaleString(), m.read]));
    download("messages.csv", csv(rows), "text/csv");
  };

  const renderMessages = () => {
    const el = $("#messagesTable");
    if (!el) return;
    let list = read(K.messages, []);
    if (msgFilter === "unread") list = list.filter((m) => !m.read);
    if (msgFilter === "read") list = list.filter((m) => m.read);
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا رسائل</p>'; return; }
    const SUBJ = { general: "استفسار", order: "طلب", custom: "مخصص", wholesale: "جملة", complaint: "شكوى", suggestion: "اقتراح" };
    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>الاسم</th><th>التواصل</th><th>الموضوع</th><th>الرسالة</th>' +
      '<th>التاريخ</th><th>الحالة</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((m) => '<tr style="' + (!m.read ? "background:rgba(255,167,38,0.05)" : "") + '">' +
        '<td>' + esc(m.name) + '</td>' +
        '<td class="font-en">' + esc(m.contact) + '</td>' +
        '<td>' + (SUBJ[m.subject] || m.subject) + '</td>' +
        '<td style="max-width:340px;font-size:12px">' + esc(m.message) + '</td>' +
        '<td class="muted" style="font-size:11px">' + fmtDate(m.createdAt) + '</td>' +
        '<td>' + (m.read ? '<span class="status-pill DELIVERED">مقروءة</span>' : '<span class="status-pill PENDING">جديدة</span>') + '</td>' +
        '<td class="actions-cell">' +
          (!m.read ? '<button class="btn xs success" data-read="' + m.id + '">تعليم كمقروءة</button>' : "") +
          '<button class="btn xs danger" data-del="' + m.id + '">حذف</button>' +
        '</td></tr>').join("") +
      '</tbody></table>';

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
  const ncBtn = $("#newCouponBtn");
  if (ncBtn) ncBtn.onclick = () => {
    ["cp_code", "cp_value", "cp_maxUses", "cp_minCart", "cp_expires"].forEach((id) => {
      const e = $("#" + id); if (e) e.value = "";
    });
    const ct = $("#cp_type"); if (ct) ct.value = "percent";
    if (couponModal) couponModal.classList.remove("hidden");
  };
  const cpCancel = $("#cp_cancel");
  if (cpCancel) cpCancel.onclick = () => { if (couponModal) couponModal.classList.add("hidden"); };
  const cpSave = $("#cp_save");
  if (cpSave) cpSave.onclick = () => {
    const coupon = {
      id: newId("cp"),
      code: (($("#cp_code") || {}).value || "").toUpperCase().trim(),
      type: ($("#cp_type") || {}).value || "percent",
      value: parseInt(($("#cp_value") || {}).value, 10) || 0,
      maxUses: parseInt(($("#cp_maxUses") || {}).value, 10) || 0,
      minCart: parseInt(($("#cp_minCart") || {}).value, 10) || 0,
      expires: ($("#cp_expires") || {}).value || null,
      uses: 0, active: true, createdAt: Date.now()
    };
    if (!coupon.code) { alert("أدخل الكود"); return; }
    const list = read(K.coupons, []);
    list.unshift(coupon);
    write(K.coupons, list);
    if (couponModal) couponModal.classList.add("hidden");
    renderCoupons();
  };

  const renderCoupons = () => {
    const el = $("#couponsTable");
    if (!el) return;
    const list = read(K.coupons, []);
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا كوبونات</p>'; return; }
    el.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th>الكود</th><th>النوع</th><th>القيمة</th><th>استخدامات</th>' +
      '<th>الحد الأدنى</th><th>الانتهاء</th><th>الحالة</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((c) => '<tr>' +
        '<td class="font-en"><strong>' + esc(c.code) + '</strong></td>' +
        '<td>' + (c.type === "percent" ? "%" : "ثابت") + '</td>' +
        '<td class="font-en">' + (c.type === "percent" ? c.value + "%" : fmtJOD(c.value)) + '</td>' +
        '<td>' + c.uses + ' / ' + (c.maxUses || "∞") + '</td>' +
        '<td>' + fmtJOD(c.minCart || 0) + '</td>' +
        '<td>' + (c.expires || "—") + '</td>' +
        '<td>' + (c.active ? '<span class="status-pill DELIVERED">نشط</span>' : '<span class="status-pill CANCELLED">موقوف</span>') + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn xs" data-toggle="' + c.id + '">' + (c.active ? "إيقاف" : "تفعيل") + '</button>' +
          '<button class="btn xs danger" data-del="' + c.id + '">حذف</button>' +
        '</td></tr>').join("") +
      '</tbody></table>';

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
    const s = (window.SAWWA && window.SAWWA.loyalty) || {};
    const le = $("#loyEarn"); if (le) le.value = s.earnPerJOD != null ? s.earnPerJOD : 1;
    const lr = $("#loyRedeem"); if (lr) lr.value = s.redeemValue != null ? s.redeemValue : 100;
    const lm = $("#loyMin"); if (lm) lm.value = s.minRedeem != null ? s.minRedeem : 100;

    const led = read(K.loyaltyLedger, []);
    const el = $("#loyaltyLedger");
    if (!el) return;
    if (!led.length) { el.innerHTML = '<p class="empty-state">لا حركات</p>'; return; }
    el.innerHTML = '<div class="admin-list">' + led.slice(0, 30).map((e) =>
      '<div class="admin-list-item">' +
        '<span class="label">' + esc(e.reason) + (e.orderId ? '<br /><small class="font-en">' + esc(e.orderId) + '</small>' : "") + '</span>' +
        '<span class="value" style="color:' + (e.delta >= 0 ? "#00E676" : "#FF5252") + '">' + (e.delta >= 0 ? "+" : "") + e.delta + '</span>' +
      '</div>'
    ).join("") + '</div>';
  };
  const saveLoy = $("#saveLoyalty");
  if (saveLoy) saveLoy.onclick = () => {
    window.SAWWA.loyalty = {
      earnPerJOD: parseFloat(($("#loyEarn") || {}).value) || 1,
      redeemValue: parseInt(($("#loyRedeem") || {}).value, 10) || 100,
      minRedeem: parseInt(($("#loyMin") || {}).value, 10) || 100
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
    orders.forEach((o) => (o.items || []).forEach((it) => {
      const k = it.nameAr || it.id;
      counters[k] = (counters[k] || 0) + it.qty;
    }));
    const top = Object.entries(counters).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const atp = $("#anaTopProducts");
    if (atp) {
      atp.innerHTML = top.length
        ? '<div class="admin-list">' + top.map(([n, q], i) =>
            '<div class="admin-list-item">' +
              '<span class="rank">' + (i + 1) + '</span>' +
              '<span class="label">' + esc(n) + '</span>' +
              '<span class="value">' + q + '</span>' +
            '</div>').join("") + '</div>'
        : '<p class="empty-state">لا بيانات</p>';
    }

    const cities = {};
    orders.forEach((o) => { if (o.city) cities[o.city] = (cities[o.city] || 0) + 1; });
    const cl = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const aci = $("#anaCities");
    if (aci) {
      aci.innerHTML = cl.length
        ? '<div class="admin-list">' + cl.map(([c, n], i) =>
            '<div class="admin-list-item">' +
              '<span class="rank">' + (i + 1) + '</span>' +
              '<span class="label">' + esc(c) + '</span>' +
              '<span class="value">' + n + '</span>' +
            '</div>').join("") + '</div>'
        : '<p class="empty-state">لا بيانات</p>';
    }
  };

  /* ============ NOTIFICATIONS ============ */
  const renderNotifications = () => {
    const list = read(K.notifications, []);
    const el = $("#sysNotifications");
    if (!el) return;
    if (!list.length) { el.innerHTML = '<p class="empty-state">لا إشعارات</p>'; return; }
    el.innerHTML = '<div class="admin-list">' + list.slice(0, 20).map((n) =>
      '<div class="admin-list-item">' +
        '<span class="label">' +
          '<strong>' + esc(n.title) + '</strong><br />' +
          '<small class="muted">' + esc(n.body) + '</small><br />' +
          '<small class="muted" style="font-size:10px">' + fmtDate(n.createdAt) + '</small>' +
        '</span>' +
      '</div>'
    ).join("") + '</div>';
  };
  const sNotif = $("#sendNotif");
  if (sNotif) sNotif.onclick = () => {
    const title = (($("#notifTitle") || {}).value || "").trim();
    const body = (($("#notifBody") || {}).value || "").trim();
    if (!title) { alert("أدخل العنوان"); return; }
    const list = read(K.notifications, []);
    list.unshift({ id: newId("n"), title: title, body: body, createdAt: Date.now() });
    write(K.notifications, list);
    const nt = $("#notifTitle"); if (nt) nt.value = "";
    const nb = $("#notifBody"); if (nb) nb.value = "";
    renderNotifications();
    if (window.UI && window.UI.toast) window.UI.toast("تم الإرسال", "success");
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
    const a = {
      ar: (($("#annAr") || {}).value || "").trim(),
      en: (($("#annEn") || {}).value || "").trim(),
      enabled: ($("#annEnabled") || {}).value === "1" ? 1 : 0
    };
    write(K.announce, a);
    alert("تم");
  };

  /* ============ SETTINGS ============ */
  const renderSettings = () => {
    const s = read(K.settings, {});
    const sna = $("#setNameAr"); if (sna) sna.value = s.nameAr || (window.SAWWA && window.SAWWA.name && window.SAWWA.name.ar) || "";
    const sne = $("#setNameEn"); if (sne) sne.value = s.nameEn || (window.SAWWA && window.SAWWA.name && window.SAWWA.name.en) || "";
    const sw = $("#setWhatsapp"); if (sw) sw.value = s.whatsapp || (window.SAWWA && window.SAWWA.whatsapp) || "";
    const sc = $("#setCliq"); if (sc) sc.value = s.cliq || (window.SAWWA && window.SAWWA.cliqId) || "";
  };
  const sSet = $("#saveSettings");
  if (sSet) sSet.onclick = () => {
    write(K.settings, {
      nameAr: (($("#setNameAr") || {}).value || "").trim(),
      nameEn: (($("#setNameEn") || {}).value || "").trim(),
      whatsapp: (($("#setWhatsapp") || {}).value || "").trim(),
      cliq: (($("#setCliq") || {}).value || "").trim()
    });
    alert("تم");
  };
  const sPwd = $("#savePwd");
  if (sPwd) sPwd.onclick = () => {
    const v = (($("#newPwd") || {}).value || "").trim();
    if (v.length < 6) { alert("6 أحرف على الأقل"); return; }
    setPwd(v);
    const np = $("#newPwd"); if (np) np.value = "";
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
      stockHistory: read(K.stockHistory, {}),
      points: localStorage.getItem(K.points) || "0",
      exportedAt: Date.now()
    };
    download("sawwa-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(data, null, 2), "application/json");
  };
  const iAll = $("#importAll");
  if (iAll) iAll.onclick = () => {
    const fileEl = $("#importFile");
    const file = fileEl && fileEl.files && fileEl.files[0];
    if (!file) { alert("اختر ملف"); return; }
    if (!confirm("سيستبدل كل البيانات. متأكد؟")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        ["products", "orders", "reviews", "customers", "coupons", "loyaltyLedger", "notifications", "messages", "announce", "settings", "stockHistory"].forEach((k) => {
          if (data[k] != null) write(K[k], data[k]);
        });
        if (data.points != null) localStorage.setItem(K.points, String(data.points));
        alert("تم الاستيراد");
      } catch (err) {
        alert("ملف غير صالح");
      }
    };
    reader.readAsText(file);
  };
  const fReset = $("#factoryReset");
  if (fReset) fReset.onclick = () => {
    if (!confirm("حذف كل البيانات؟")) return;
    if (!confirm("تأكيد نهائي؟")) return;
    Object.keys(K).forEach((k) => localStorage.removeItem(K[k]));
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
    seedCoupons();
    seedCustomers();
    bindNav();
    renderDash();
    switchTab("dash");
  };

  /* ============ AUTO START ============ */
  if (sessionValid()) showPanel();

})();