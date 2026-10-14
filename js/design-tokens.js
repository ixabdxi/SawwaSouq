/* ============================================================
   SaWWA Souq — Design Tokens v4 (Performance Fix)
   ============================================================ */
(function () {
  const DEFAULT = {
    identity: {
      nameAr: "سوّا سوق", nameEn: "SaWWA Souq",
      taglineAr: "جودة تستحقّها، بسعر يناسبك.", taglineEn: "Quality you deserve, price you love.",
      logo: "", logoDark: "", favicon: "", logoHeight: 44
    },
    colors: {
      teal: "#0D7377", teal2: "#0D7377", amber: "#D97706", deep: "#111110",
      bg: "#F7F7F5", white: "#FFFFFF", ink: "#111110", muted: "#666660"
    },
    typography: {
      fontAr: "Baloo Bhaijaan 2", fontEn: "Orbitron",
      h1: 52, h2: 22, h3: 16, body: 15,
      headingWeight: 800, bodyWeight: 500
    },
    effects: {
      aurora: { enabled: true, blobs: 5, particles: 25, speed: 100 },
      glass: { enabled: false, blur: 16 },
      radius: 12, shadows: "soft",
      tilt: false, magnetic: false, splitText: false
    },
    animation: {
      speed: 100, reveal: true, revealType: "fade",
      marquee: { enabled: true, speed: 45, direction: "normal" },
      heroSlider: { enabled: true, speed: 4, transition: "fade" },
      cursor: "none", loadingScreen: false
    },
    layout: {
      gridCols: 4, gridGap: 24, containerWidth: "normal",
      spacing: "normal", headerStyle: "glass", footerCols: 4
    },
    components: {
      buttonStyle: "gradient", cardStyle: "glass",
      inputStyle: "rounded", toastPosition: "top-right", modalSize: "md"
    },
    images: { coverGlass: "", coverRubber: "", ogImage: "", heroSlides: [] },
    sections: {
      order: ["hero", "trust", "features", "featured", "glass", "rubber", "reviews", "newsletter"],
      hidden: [], banners: []
    },
    content: {
      heroTitleAr: "SAWWA SOUQ", heroTitleEn: "SAWWA SOUQ",
      heroSubAr: "", heroSubEn: "", copyright: ""
    },
    meta: {
      title: "SaWWA Souq — سوّا سوق",
      description: "ماوس باد مطاطي وزجاجي في الأردن — جودة تستحقّها، بسعر يناسبك.",
      keywords: "ماوس باد، الأردن، gaming, mousepad"
    },
    analytics: { ga4: "", metaPixel: "", tiktok: "", headScript: "", bodyScript: "" },
    custom: { css: "", preconnect: true, lazyImages: true, darkModeBehavior: "manual" }
  };

  function merge(t, s) {
    const out = Array.isArray(t) ? [...t] : { ...t };
    for (const k in s) {
      if (s[k] && typeof s[k] === "object" && !Array.isArray(s[k])) out[k] = merge(t[k] || {}, s[k]);
      else out[k] = s[k];
    }
    return out;
  }

  let stored = {};
  try { stored = JSON.parse(localStorage.getItem("sawwa_design") || "{}"); } catch { }
  const D = merge(DEFAULT, stored);
  window.DESIGN = D;

  const hexToRgb = (h) => {
    const x = String(h).replace("#", "");
    return [parseInt(x.substr(0, 2), 16) || 0, parseInt(x.substr(2, 2), 16) || 0, parseInt(x.substr(4, 2), 16) || 0];
  };
  const rgbToHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
  const adjust = (hex, factor) => {
    const [r, g, b] = hexToRgb(hex);
    if (factor > 0) return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
    return rgbToHex(r * (1 + factor), g * (1 + factor), b * (1 + factor));
  };

  function applyDesign() {
    const root = document.documentElement;
    const C = D.colors;

    root.style.setProperty("--teal", C.teal);
    root.style.setProperty("--teal-2", C.teal2);
    root.style.setProperty("--cyan", C.teal2);
    root.style.setProperty("--amber", C.amber);
    root.style.setProperty("--amber-2", C.amber);
    root.style.setProperty("--deep", C.deep);
    root.style.setProperty("--deeper", C.deep);
    root.style.setProperty("--brand", C.teal);
    root.style.setProperty("--brand-hover", adjust(C.teal, -0.12));

    const fAr = D.typography.fontAr.replace(/\s+/g, "+");
    const fEn = D.typography.fontEn.replace(/\s+/g, "+");
    const fontId = "design-fonts-link";
    let fontLink = document.getElementById(fontId);
    if (fontLink) fontLink.remove();
    fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=" + fAr + ":wght@400;500;600;700;800;900&family=" + fEn + ":wght@400;500;700;900&display=swap";
    document.head.appendChild(fontLink);

    const SH = {
      none:   { sm: "none", md: "none", lg: "none" },
      soft:   { sm: "0 1px 3px rgba(0,0,0,.06)", md: "0 4px 12px rgba(0,0,0,.06)", lg: "0 12px 32px rgba(0,0,0,.08)" },
      medium: { sm: "0 4px 16px rgba(10,61,56,.06)", md: "0 12px 40px rgba(10,61,56,.10)", lg: "0 30px 80px rgba(10,61,56,.16)" },
      strong: { sm: "0 8px 24px rgba(0,0,0,.15)", md: "0 20px 60px rgba(0,0,0,.2)", lg: "0 40px 100px rgba(0,0,0,.3)" }
    };
    const sh = SH[D.effects.shadows] || SH.soft;
    root.style.setProperty("--sh-sm", sh.sm);
    root.style.setProperty("--sh", sh.md);
    root.style.setProperty("--sh-lg", sh.lg);
    root.style.setProperty("--shadow-sm", sh.sm);
    root.style.setProperty("--shadow", sh.md);
    root.style.setProperty("--shadow-lg", sh.lg);

    const R = D.effects.radius;
    root.style.setProperty("--radius", R + "px");
    root.style.setProperty("--radius-sm", Math.max(4, R - 4) + "px");
    root.style.setProperty("--radius-md", (R + 4) + "px");
    root.style.setProperty("--radius-lg", (R + 8) + "px");
    root.style.setProperty("--r", R + "px");
    root.style.setProperty("--r-sm", Math.max(4, R - 4) + "px");
    root.style.setProperty("--r-md", (R + 4) + "px");
    root.style.setProperty("--r-lg", (R + 8) + "px");

    const darkBg = adjust(C.bg, -0.92);
    const darkInk = adjust(C.ink, 0.85);
    const darkMuted = adjust(C.muted, 0.30);

    const containerMap = { narrow: "1000px", normal: "1280px", wide: "1500px", full: "100%" };
    const CW = containerMap[D.layout.containerWidth] || "1280px";

    const dynCss = `
      :root {
        --bg: ${C.bg};
        --paper: ${C.bg};
        --white: ${C.white};
        --ink: ${C.ink};
        --muted: ${C.muted};
        --stone: ${C.muted};
        --sage: ${C.muted};
        --line: rgba(0,0,0,0.08);
        --h1-size: ${D.typography.h1}px;
        --h2-size: ${D.typography.h2}px;
        --h3-size: ${D.typography.h3}px;
        --body-size: ${D.typography.body}px;
        --heading-weight: ${D.typography.headingWeight};
        --body-weight: ${D.typography.bodyWeight};
      }
      html.dark {
        --bg: ${darkBg};
        --paper: ${darkBg};
        --ink: ${darkInk};
        --muted: ${darkMuted};
      }
      body {
        font-family: var(--font-ar);
        font-size: var(--body-size);
        font-weight: var(--body-weight);
        background: var(--bg);
        color: var(--ink);
      }
      .container { max-width: ${CW}; }
      .logo { height: ${D.identity.logoHeight}px; }
      ${D.custom.css || ""}
    `;

    let st = document.getElementById("design-tokens-style");
    if (!st) {
      st = document.createElement("style");
      st.id = "design-tokens-style";
      document.head.appendChild(st);
    }
    st.textContent = dynCss;

    if (D.identity.favicon) {
      let fav = document.querySelector('link[rel="icon"]');
      if (!fav) { fav = document.createElement("link"); fav.rel = "icon"; document.head.appendChild(fav); }
      fav.href = D.identity.favicon;
    }

    if (D.meta.title) document.title = D.meta.title;
    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector('meta[name="' + name + '"]');
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", D.meta.description);
    setMeta("keywords", D.meta.keywords);

    window.AURORA_SETTINGS = D.effects.aurora;
  }

  /* ============ APPLY LOGO ============ */
  function applyLogo() {
    const logoLight = D.identity.logo;
    const logoDark = D.identity.logoDark;
    const defaultLight = "assets/logo.svg";

    document.querySelectorAll(".site-header .logo img, nav .logo img, .sidebar-head .logo img").forEach((img) => {
      const target = logoLight || defaultLight;
      if (img.getAttribute("src") !== target) img.setAttribute("src", target);
    });

    document.querySelectorAll(".site-footer .logo img, .logo-footer img").forEach((img) => {
      const target = logoDark || logoLight || defaultLight;
      if (img.getAttribute("src") !== target) img.setAttribute("src", target);
    });

    if (D.identity.favicon) {
      let fav = document.querySelector('link[rel="icon"]');
      if (!fav) { fav = document.createElement("link"); fav.rel = "icon"; document.head.appendChild(fav); }
      if (fav.getAttribute("href") !== D.identity.favicon) fav.setAttribute("href", D.identity.favicon);
    }
  }

  window.DESIGN_APPLY = function () {
    applyDesign();
    applyLogo();
  };

  applyDesign();

  /* Single delayed apply — replaces heavy MutationObserver */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(applyLogo, 150);
      setTimeout(applyLogo, 600);
    });
  } else {
    setTimeout(applyLogo, 150);
    setTimeout(applyLogo, 600);
  }

  /* Analytics — skip on panel */
  const isDesign = document.documentElement.classList.contains("design-body") ||
    (document.body && document.body.classList.contains("design-body"));

  if (!isDesign) {
    if (D.analytics.ga4) {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = "https://www.googletagmanager.com/gtag/js?id=" + D.analytics.ga4;
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.textContent = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + D.analytics.ga4 + "');";
      document.head.appendChild(s2);
    }
    if (D.analytics.metaPixel) {
      const s = document.createElement("script");
      s.textContent = "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" + D.analytics.metaPixel + "');fbq('track','PageView');";
      document.head.appendChild(s);
    }
    if (D.analytics.tiktok) {
      const s = document.createElement("script");
      s.textContent = "!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement('script');o.type='text/javascript';o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=document.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('" + D.analytics.tiktok + "');ttq.page();}(window,document,'ttq');";
      document.head.appendChild(s);
    }
    if (D.analytics.headScript) {
      try { const s = document.createElement("script"); s.textContent = D.analytics.headScript; document.head.appendChild(s); } catch { }
    }
    if (D.analytics.bodyScript) {
      window.addEventListener("DOMContentLoaded", () => {
        try { const s = document.createElement("script"); s.textContent = D.analytics.bodyScript; document.body.appendChild(s); } catch { }
      });
    }
  }

  window.DESIGN_TOKENS_APPLIED = true;
})();
