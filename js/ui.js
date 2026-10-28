window.UI = (() => {
  const fmt = (cents) => {
    const v = (cents / 100).toFixed(2);
    return window.SAWWA.lang === "ar" ? `${v} دينار` : `${v} JOD`;
  };

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  const toastContainer = () => {
    let c = document.querySelector(".toast-container");
    if (!c) { c = el("div", "toast-container"); document.body.appendChild(c); }
    return c;
  };
  const ICONS = { success: "✓", error: "✕", warn: "!", info: "i" };
  const toast = (msg, type = "info", title = null, duration = 3500) => {
    const c = toastContainer();
    const t = el("div", `toast ${type}`);
    const titles = {
      success: window.SAWWA.lang === "ar" ? "تم بنجاح" : "Success",
      error:   window.SAWWA.lang === "ar" ? "خطأ" : "Error",
      warn:    window.SAWWA.lang === "ar" ? "تنبيه" : "Warning",
      info:    window.SAWWA.lang === "ar" ? "معلومة" : "Info"
    };
    t.innerHTML = `
      <div class="toast-icon">${ICONS[type] || "i"}</div>
      <div class="toast-body">
        <div class="toast-title">${title || titles[type]}</div>
        <div class="toast-msg">${msg}</div>
      </div>
      <button class="toast-close" aria-label="close">×</button>`;
    c.appendChild(t);
    const style = document.createElement("style");
    style.textContent = `.toast::before { animation-duration: ${duration}ms; }`;
    t.appendChild(style);
    const dismiss = () => { t.classList.add("out"); setTimeout(() => t.remove(), 450); };
    t.querySelector(".toast-close").onclick = dismiss;
    setTimeout(dismiss, duration);
    return t;
  };

  const confirm = (title, msg, opts = {}) => new Promise((resolve) => {
    const bd = el("div", "modal-backdrop");
    const ok = opts.okLabel || (window.SAWWA.lang === "ar" ? "تأكيد" : "Confirm");
    const cancel = opts.cancelLabel || (window.SAWWA.lang === "ar" ? "إلغاء" : "Cancel");
    bd.innerHTML = `
      <div class="modal-card">
        <div class="modal-icon">${opts.icon || "?"}</div>
        <h3>${title}</h3>
        <p>${msg}</p>
        <div class="modal-actions">
          <button class="btn primary" data-ok>${ok}</button>
          <button class="btn ghost" data-cancel>${cancel}</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    const close = (val) => { bd.remove(); resolve(val); };
    bd.querySelector("[data-ok]").onclick = () => close(true);
    bd.querySelector("[data-cancel]").onclick = () => close(false);
    bd.addEventListener("click", (e) => { if (e.target === bd) close(false); });
  });

  const initScrollProgress = () => {
    const p = el("div", "");
    p.id = "scrollProgress";
    document.body.appendChild(p);
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      p.style.width = pct + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };

  const initTilt = () => {
    if (matchMedia("(hover: none)").matches) return;
    const bind = (card) => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    };
    document.querySelectorAll(".card, .product-img, .points-card").forEach(bind);
  };

  const initMagnetic = () => {
    if (matchMedia("(hover: none)").matches) return;
    document.querySelectorAll(".btn.primary").forEach((b) => {
      if (b.dataset.magBound) return;
      b.dataset.magBound = "1";
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.12}px, ${y * 0.2}px) scale(1.03)`;
      });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
  };

  const initSplitText = () => {
    document.querySelectorAll("[data-split]").forEach((el) => {
      if (el.dataset.splitBound) return;
      el.dataset.splitBound = "1";
      const text = el.textContent;
      el.textContent = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = ch === " " ? "\u00A0" : ch;
        s.style.animationDelay = (i * 50) + "ms";
        el.appendChild(s);
      });
    });
  };

  const openNotifPanel = () => {
    const existing = document.getElementById("notifPanel");
    if (existing) { existing.remove(); return; }

    const list = window.Notifications ? Notifications.all().slice(0, 10) : [];
    const p = el("div", "notif-panel");
    p.id = "notifPanel";
    p.innerHTML = `
      <div class="np-head">
        <strong>${window.SAWWA.lang === "ar" ? "الإشعارات" : "Notifications"}</strong>
        <button class="np-mark" id="npMark">${window.SAWWA.lang === "ar" ? "تعليم الكل كمقروء" : "Mark all read"}</button>
      </div>
      <div class="np-body">
        ${list.length === 0
          ? `<div class="np-empty">${window.SAWWA.lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</div>`
          : list.map((n) => `
            <div class="np-item">
              <div class="np-title">${n.title}</div>
              <div class="np-msg">${n.body}</div>
              <div class="np-time">${new Date(n.createdAt || Date.now()).toLocaleString("ar-JO")}</div>
            </div>`).join("")}
      </div>`;
    document.body.appendChild(p);

    p.querySelector("#npMark").onclick = () => {
      if (window.Notifications) Notifications.markAllRead();
      updateBell();
      p.remove();
    };

    setTimeout(() => {
      const off = (e) => {
        if (!p.contains(e.target) && !e.target.closest("#notifBtn")) {
          p.remove();
          document.removeEventListener("click", off);
        }
      };
      document.addEventListener("click", off);
    }, 0);
  };

  const updateBell = () => {
    const badge = document.querySelector("#notifBtn .notif-badge");
    const c = window.Notifications ? Notifications.unreadCount() : 0;
    if (badge) {
      if (c > 0) { badge.textContent = c > 9 ? "9+" : c; badge.style.display = "grid"; }
      else badge.style.display = "none";
    }
  };

  const header = () => {
    const lang = window.SAWWA.lang;
    const cartCount = window.Cart ? Cart.count() : 0;
    const wishCount = window.Wishlist ? Wishlist.count() : 0;
    const h = el("header", "site-header");
    h.innerHTML = `
      <div class="header-inner">
        <a href="index.html" class="logo" aria-label="SaWWA Souq">
          <img src="assets/logo.png" alt="SaWWA Souq" />
        </a>
        <nav class="nav">
          <a href="index.html" data-i18n="nav.home"></a>
          <a href="shop.html" data-i18n="nav.shop"></a>
          <a href="about.html" data-i18n="nav.about"></a>
          <a href="account.html" data-i18n="nav.account"></a>
          <a href="track.html">${lang === "ar" ? "تتبع الطلب" : "Track"}</a>
        </nav>
        <div class="actions">
          <button class="icon-btn" id="langToggle">${lang === "ar" ? "EN" : "AR"}</button>
          <button class="icon-btn" id="themeToggle" aria-label="theme">🌙</button>
          <a href="wishlist.html" class="icon-btn wish-btn" aria-label="wishlist">
            ♥ ${wishCount > 0 ? `<span class="badge">${wishCount}</span>` : ""}
          </a>
          <button class="icon-btn" id="notifBtn" aria-label="notifications">
            🔔<span class="notif-badge" style="display:none">0</span>
          </button>
          <a href="cart.html" class="icon-btn cart-btn" aria-label="cart">
            🛒 ${cartCount > 0 ? `<span class="badge">${cartCount}</span>` : ""}
          </a>
        </div>
      </div>`;
    document.body.prepend(h);

    h.querySelector("#langToggle").onclick = () => {
      const next = window.SAWWA.lang === "ar" ? "en" : "ar";
      window.setLang(next);
      h.querySelector("#langToggle").textContent = next === "ar" ? "EN" : "AR";
      toast(next === "ar" ? "تم التبديل إلى العربية" : "Switched to English", "info", null, 2000);
    };
    h.querySelector("#themeToggle").onclick = () => window.toggleTheme();
    h.querySelector("#notifBtn").onclick = (e) => { e.stopPropagation(); openNotifPanel(); };

    const saved = localStorage.getItem("sawwa_theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    h.querySelector("#themeToggle").textContent =
      document.documentElement.classList.contains("dark") ? "☀️" : "🌙";

    window.addEventListener("scroll", () => {
      if (window.scrollY > 30) h.classList.add("scrolled");
      else h.classList.remove("scrolled");
    });

    updateBell();
  };

  const marquee = () => {
    const items = window.SAWWA.lang === "ar"
      ? ["شحن يبدأ من 2 دينار", "الدفع عند الاستلام", "دفع Cliq", "ضمان 7 أيام", "توصيل 1–3 أيام"]
      : ["SHIPPING FROM 2 JOD", "CASH ON DELIVERY", "CLIQ PAYMENT", "7-DAY WARRANTY", "1–3 DAYS DELIVERY"];
    const track = items.concat(items).map((s) => `<span>${s}</span>`).join("");
    const m = el("div", "marquee-ticker", `<div class="marquee-track">${track}</div>`);
    document.body.insertBefore(m, document.body.firstChild);
  };

  const footer = () => {
    const y = new Date().getFullYear();
    const f = el("footer", "site-footer");
    f.innerHTML = `
      <div class="footer-inner">
        <div>
          <a href="index.html" class="logo logo-footer" aria-label="SaWWA Souq">
            <img src="assets/logo.png" alt="SaWWA Souq" />
          </a>
          <p data-i18n="hero.tagline"></p>
        </div>
        <div>
          <h4>${window.SAWWA.lang === "ar" ? "المتجر" : "Shop"}</h4>
          <a href="shop.html" data-i18n="nav.shop"></a>
          <a href="about.html" data-i18n="nav.about"></a>
          <a href="faq.html">${window.SAWWA.lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}</a>
        </div>
        <div>
          <h4>${window.SAWWA.lang === "ar" ? "الحساب" : "Account"}</h4>
          <a href="account.html" data-i18n="nav.account"></a>
          <a href="track.html">${window.SAWWA.lang === "ar" ? "تتبع الطلب" : "Track order"}</a>
          <a href="wishlist.html">${window.SAWWA.lang === "ar" ? "قائمة الرغبات" : "Wishlist"}</a>
        </div>
        <div>
          <h4 data-i18n="footer.contact"></h4>
          <a href="https://wa.me/${window.SAWWA.whatsapp}" target="_blank" rel="noopener">WhatsApp: ${window.SAWWA.whatsappDisplay}</a>
          <a href="contact.html">${window.SAWWA.lang === "ar" ? "اتصل بنا" : "Contact us"}</a>
          <a href="policy.html" data-i18n="footer.policy"></a>
        </div>
      </div>
      <div class="copy">© ${y} SaWWA Souq — <span data-i18n="footer.rights"></span></div>`;
    document.body.appendChild(f);
  };

  const whatsappBtn = () => {
    const a = el("a", "whatsapp-fab");
    a.href = `https://wa.me/${window.SAWWA.whatsapp}?text=${encodeURIComponent("مرحبا SaWWA Souq 👋")}`;
    a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", "WhatsApp");
    a.innerHTML = "💬";
    document.body.appendChild(a);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("sawwa_theme", isDark ? "dark" : "light");
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = isDark ? "☀️" : "🌙";
    toast(
      isDark
        ? (window.SAWWA.lang === "ar" ? "الوضع الداكن" : "Dark mode on")
        : (window.SAWWA.lang === "ar" ? "الوضع الفاتح" : "Light mode on"),
      "info", null, 1500
    );
  };
  window.toggleTheme = toggleTheme;

  const initReveal = () => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".reveal, .reveal-3d").forEach((el) => io.observe(el));
  };

  const init = (opts = {}) => {
    window.SAWWA.lang = localStorage.getItem("sawwa_lang") || "ar";
    document.documentElement.lang = window.SAWWA.lang;
    document.documentElement.dir = window.SAWWA.lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("lang-en", window.SAWWA.lang === "en");

    const savedTheme = localStorage.getItem("sawwa_theme");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");

    marquee();
    header();
    footer();
    whatsappBtn();

    if (typeof opts.after === "function") opts.after();

    window.setLang(window.SAWWA.lang);

    window.addEventListener("cart-change", () => {
      const badge = document.querySelector(".cart-btn .badge");
      const c = Cart.count();
      if (badge) { if (c > 0) badge.textContent = c; else badge.remove(); }
      else if (c > 0) {
        const b = el("span", "badge", String(c));
        document.querySelector(".cart-btn")?.appendChild(b);
      }
    });
    window.addEventListener("wishlist-change", () => {
      const badge = document.querySelector(".wish-btn .badge");
      const c = window.Wishlist ? Wishlist.count() : 0;
      if (badge) { if (c > 0) badge.textContent = c; else badge.remove(); }
      else if (c > 0) {
        const b = el("span", "badge", String(c));
        document.querySelector(".wish-btn")?.appendChild(b);
      }
    });
    window.addEventListener("notifications-change", updateBell);

    setTimeout(() => {
      initScrollProgress();
      initReveal();
      initTilt();
      initMagnetic();
      initSplitText();
    }, 100);
  };

  const refreshI18n = () => window.setLang(window.SAWWA.lang);

  return { init, fmt, refreshI18n, toast, confirm, updateBell };
})();
