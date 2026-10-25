/* ============================================================
   SaWWA Souq — Admin Panel (Full + Realtime + JOD Prices Fix)
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
    startAutoRefresh(); 
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

  /* ============ FIXED CHART FUNCTION ============ */
  const drawSalesChart = (orders) => {
    const canvas = $("#chartSales");
    const container = $("#chartContainer");
    if (!canvas || !container) return;

    if (!canvas._resizeObserver) {
      canvas._resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0) {
          renderChartLogic(canvas, orders);
        }
      });
      canvas._resizeObserver.observe(container);
    }

    if (container.clientWidth > 0) {
      renderChartLogic(canvas, orders);
    }
  };

  const renderChartLogic = (canvas, orders) => {
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssH = 220;
    if (cssW < 50) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr; 
    canvas.height = cssH * dpr;
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
    const padL = 40, padR = 10, padT = 20, padB = 30;
    const w = cssW - padL - padR, h = cssH - padT - padB, barW = w / days.length - 10;

    ctx.strokeStyle = "rgba(143,169,165,.3)"; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) { 
      const y = padT + (h / 4) * i; 
      ctx.moveTo(padL, y); 
      ctx.lineTo(padL + w, y); 
    }
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
    grad.addColorStop(0, "#5FD0C5"); 
    grad.addColorStop(1, "#0F5C56");

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

    ctx.fillStyle = "#4A5654"; 
    ctx.font = "11px 'Baloo Bhaijaan 2', sans-serif"; 
    ctx.textAlign = "center";
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

  /* ============ ORDERS ============ */
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

    if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) {
      try {
        const remote = await SB.orders.list();
        if (remote && Array.isArray(remote)) {
          const map = new Map();
          [...remote, ...orders].forEach((o) => map.set(o.id, o));
          orders = [...map.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          write(K.orders, orders);
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
      <tbody>${orders.map((o) => {
        
        let actionBtns = "";
        const isCliq = o.paymentMethod === "CLIQ";
        const isCod = o.paymentMethod === "COD";
        const isPaid = o.paymentStatus === "PAID";
        const isPending = o.status === "PENDING" || o.status === "CONFIRMED";
        const isShipped = o.status === "SHIPPED";
        const isDelivered = o.status === "DELIVERED";

        if (isCliq) {
          if (!isPaid) {
             actionBtns += `<button class="btn xs success" data-verify-cliq="${o.id}">استلام المبلغ</button> `;
          } else if (isPaid && isPending) {
             actionBtns += `<button class="btn xs" data-ship="${o.id}">شحن</button> `;
          } else if (isPaid && isShipped) {
             actionBtns += `<button class="btn xs success" data-deliver="${o.id}">تسليم</button> `;
          }
        } else if (isCod) {
          if (isPending) {
             actionBtns += `<button class="btn xs" data-ship="${o.id}">شحن</button> `;
          } else if (isShipped) {
             actionBtns += `<button class="btn xs success" data-deliver="${o.id}">تسليم</button> `;
          } else if (isDelivered && !isPaid) {
             actionBtns += `<button class="btn xs success" data-verify-cod="${o.id}">استلام المبلغ</button> `;
          }
        }

        return `
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
            ${actionBtns}
            <button class="btn xs danger" data-del="${o.id}">حذف</button>
          </td>
        </tr>`}).join("")}</tbody></table>`;

    el.querySelectorAll("[data-verify-cliq]").forEach((b) => b.onclick = () => updateOrder(b.dataset.verifyCliq, { paymentStatus: "PAID", status: "CONFIRMED" }));
    el.querySelectorAll("[data-verify-cod]").forEach((b) => b.onclick = () => updateOrder(b.dataset.verifyCod, { paymentStatus: "PAID" }));
    el.querySelectorAll("[data-ship]").forEach((b) => b.onclick = () => updateOrder(b.dataset.ship, { status: "SHIPPED" }));
    el.querySelectorAll("[data-deliver]").forEach((b) => b.onclick = () => updateOrder(b.dataset.deliver, { status: "DELIVERED" }));
    
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
      const id = b.dataset.del;
      let confirmDel = false;
      if (window.UI && UI.confirm) {
        confirmDel = await UI.confirm("تأكيد الحذف", `هل أنت متأكد من حذف الطلب رقم ${id} نهائياً؟`, { danger: true, icon: "⚠️" });
      } else {
        confirmDel = confirm(`هل أنت متأكد من حذف الطلب ${id}؟`);
      }
      if (!confirmDel) return;
      write(K.orders, read(K.orders, []).filter((o) => o.id !== id));
      if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.orders.remove(id);
      renderOrders(); renderDash();
    });
  };

  const updateOrder = (id, patch) => {
    const orders = read(K.orders, []);
    const i = orders.findIndex((o) => o.id === id);
    if (i >= 0) { orders[i] = { ...orders[i], ...patch }; write(K.orders, orders); }
    if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.orders.update(id, patch);
    renderOrders(); renderDash();
    if (window.UI && UI.toast) UI.toast("تم تحديث حالة الطلب", "success");
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
    // تحويل الأسعار من دينار إلى قروش (ضرب في 100)
    const priceJOD = parseFloat(($("#pm_price") || {}).value) || 0;
    const compareJOD = parseFloat(($("#pm_compare") || {}).value) || 0;
    const costJOD = parseFloat(($("#pm_cost") || {}).value) || 0;

    const data = {
      nameAr: ($("#pm_nameAr") || {}).value?.trim() || "",
      nameEn: ($("#pm_nameEn") || {}).value?.trim() || "",
      descAr: ($("#pm_descAr") || {}).value?.trim() || "",
      descEn: ($("#pm_descEn") || {}).value?.trim() || "",
      type: ($("#pm_type") || {}).value || "RUBBER",
      price: Math.round(priceJOD * 100), // بالسنت
      compareAtPrice: compareJOD > 0 ? Math.round(compareJOD * 100) : null,
      costPrice: Math.round(costJOD * 100),
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
    if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.products.save(products.find(p=>p.id === (editingProductId || products[0].id)));
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
          <td>${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:36px;height:36px;object-fit:cover;border-radius:6px" />` : `<span style="display:inline-block;width:36px;height:36px;background:var(--surface-2);border-radius:6px"></span>`}</td>
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
      
      // تحويل الأسعار من قروش إلى دينار للعرض
      $("#pm_price").value = (p.price / 100).toFixed(2);
      $("#pm_compare").value = p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : "";
      $("#pm_cost").value = (p.costPrice / 100).toFixed(2);
      
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
        if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.products.save(list[i]);
        renderProducts(); 
      }
    });
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
      let confirmDel = false;
      if (window.UI && UI.confirm) {
        confirmDel = await UI.confirm("تأكيد الحذف", "هل أنت متأكد من حذف هذا المنتج؟", { danger: true, icon: "⚠️" });
      } else {
        confirmDel = confirm("تأكيد الحذف؟");
      }
      if (!confirmDel) return;
      
      write(K.products, read(K.products, []).filter((x) => x.id !== b.dataset.del));
      if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.products.remove(b.dataset.del);
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
      if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.products.save(list[i]);
      renderInventory(); 
    }
  };
  const setStock = (id, n) => {
    const list = read(K.products, []);
    const i = list.findIndex((p) => p.id === id);
    if (i >= 0) { 
      list[i].stock = n; 
      write(K.products, list); 
      if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) SB.products.save(list[i]);
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
    if (window.SB && typeof SB !== 'undefined' && SB.isEnabled()) list.forEach(p => SB.products.save(p));
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
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
      let confirmDel = false;
      if (window.UI && UI.confirm) confirmDel = await UI.confirm("حذف المراجعة", "هل أنت متأكد؟", { danger: true });
      else confirmDel = confirm("حذف؟");
      
      if (!confirmDel) return;
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
            ${!m.read ? `<
