/* ============================================================
   SaWWA Souq — Design Tokens v6 (Glassmorphism Focus)
   ============================================================ */
(function () {
  const DEPLOYED = (typeof window.SAWWA_DESIGN_CONFIG === "object" && window.SAWWA_DESIGN_CONFIG !== null) ? window.SAWWA_DESIGN_CONFIG : {};

  const DEFAULT = {
    identity: {
      nameAr: "سوّا سوق", nameEn: "SaWWA Souq",
      taglineAr: "جودة تستحقّها، بسعر يناسبك.", taglineEn: "Quality you deserve, price you love.",
      logo: "assets/logo.png", logoDark: "assets/logo-white.png", favicon: "assets/favicon.png", logoHeight: 44
    },
    colors: {
      teal: "#0F5C56", teal2: "#12A89B", amber: "#E8A33D", deep: "#0A3D38",
      bg: "#EDF1EE", white: "#FFFFFF", ink: "#0B1A18", muted: "#647570"
    },
    typography: {
      fontAr: "Baloo Bhaijaan 2", fontEn: "Orbitron",
      h1: 72, h2: 42, h3: 26, body: 16,
      headingWeight: 900, bodyWeight: 500
    },
    effects: {
      aurora: { enabled: true, blobs: 5, particles: 60, speed: 100 },
      glass: { enabled: true, blur: 16 },
      radius: 16, shadows: "soft",
      tilt: true, magnetic: true, splitText: true
    },
    animation: {
      speed: 100, reveal: true, revealType: "fade",
      marquee: { enabled: true, speed: 32, direction: "normal" },
      heroSlider: { enabled: true, speed: 4, transition: "fade" },
      cursor: "none", loadingScreen: false
    },
    layout: {
      gridCols: 4, gridGap: 24, containerWidth: "normal",
      spacing: "normal", headerStyle: "glass", footerCols: 4
    },
    components: {
      buttonStyle: "gradient", cardStyle: "glass",
      inputStyle: "glass", toastPosition: "bottom-center", modalSize: "md"
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

  let local = {};
  try { local = JSON.parse(localStorage.getItem("sawwa_design") || "{}"); } catch {}
  const D = merge(merge(DEFAULT, DEPLOYED), local);
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
      none: { sm: "none", md: "none", lg: "none" },
      soft: { sm: "0 4px 12px rgba(0,0,0,.03)", md: "0 8px 32px rgba(0,0,0,.06)", lg: "0 20px 60px rgba(0,0,0,.1)" },
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
    root.style.setProperty("--radius-sm", Math.max(4, R - 6) + "px");
    root.style.setProperty("--radius-md", (R + 4) + "px");
    root.style.setProperty("--radius-lg", (R + 12) + "px");
    root.style.setProperty("--r", R + "px");
    root.style.setProperty("--r-sm", Math.max(4, R - 6) + "px");
    root.style.setProperty("--r-md", (R + 4) + "px");
    root.style.setProperty("--r-lg", (R + 12) + "px");

    const darkBg = adjust(C.bg, -0.92);
    const darkPaper = adjust(C.bg, -0.92);
    const darkWhite = adjust(C.bg, -0.85);
    const darkInk = adjust(C.ink, 0.85);
    const darkMuted = adjust(C.muted, 0.30);

    const revealMap = { fade: "translateY(0)", slide: "translateY(28px)", zoom: "scale(.9)", rotate: "perspective(1000px) rotateY(-10deg) translateY(28px)" };
    const revealFrom = revealMap[D.animation.revealType] || "translateY(28px)";

    const spacingMap = {
      tight: { container: "16px 20px 80px", gap: "16px" },
      normal: { container: "30px 26px 100px", gap: "24px" },
      loose: { container: "50px 40px 140px", gap: "36px" }
    };
    const SP = spacingMap[D.layout.spacing] || spacingMap.normal;

    const containerMap = { narrow: "1000px", normal: "1320px", wide: "1600px", full: "100%" };
    const CW = containerMap[D.layout.containerWidth] || "1320px";

    const modalSizeMap = { sm: "380px", md: "620px", lg: "840px", full: "100%" };
    const MS = modalSizeMap[D.components.modalSize] || "620px";

    const dynCss = `
      :root {
        --bg: ${C.bg};
        --paper: ${C.bg};
        --paper-2: ${adjust(C.bg, -0.05)};
        --white: ${C.white};
        --ink: ${C.ink};
        --ink-2: ${adjust(C.ink, 0.15)};
        --muted: ${C.muted};
        --stone: ${C.muted};
        --sage: ${C.muted};
        
        --glass-bg: rgba(255, 255, 255, 0.45);
        --glass-border: rgba(255, 255, 255, 0.6);
        --glass-blur: ${D.effects.blur || 20}px;

        --h1-size: ${D.typography.h1}px;
        --h2-size: ${D.typography.h2}px;
        --h3-size: ${D.typography.h3}px;
        --body-size: ${D.typography.body}px;
        --heading-weight: ${D.typography.headingWeight};
        --body-weight: ${D.typography.bodyWeight};
      }
      html.dark {
        --bg: ${darkBg};
        --paper: ${darkPaper};
        --paper-2: ${adjust(C.bg, -0.95)};
        --white: ${darkWhite};
        --ink: ${darkInk};
        --ink-2: ${adjust(darkInk, -0.15)};
        --muted: ${darkMuted};
        --stone: ${darkMuted};
        --sage: ${darkMuted};

        --glass-bg: rgba(13, 30, 27, 0.55);
        --glass-border: rgba(95, 208, 197, 0.15);
        --glass-blur: ${D.effects.blur || 20}px;

        --shadow-sm: 0 4px 16px rgba(0,0,0,.4);
        --shadow: 0 12px 40px rgba(0,0,0,.5);
        --shadow-lg: 0 30px 80px rgba(0,0,0,.6);
      }
      
      /* تطبيق الزجاج على البطاقات والهيدر */
      .card, .site-header, .btn.ghost, .icon-btn, input, textarea, select, .trust-item, .feature, .dash-card, .summary-col, .points-card, .modal-card {
        background: var(--glass-bg) !important;
        backdrop-filter: blur(var(--glass-blur)) saturate(180%) !important;
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%) !important;
        border: 1px solid var(--glass-border) !important;
        box-shadow: var(--sh-sm) !important;
      }

      body {
        font-family: var(--font-ar) !important;
        font-size: var(--body-size);
        font-weight: var(--body-weight);
        background: var(--bg);
        color: var(--ink);
      }
      .font-en, h1.font-en, h2.font-en, .logo, .badge-new, .price,
      .section-title, .page-title, .stat strong, .points-num, .big-num {
        font-family: var(--font-en) !important;
      }
      h1 { font-size: var(--h1-size); font-weight: var(--heading-weight); }
      h2 { font-size: var(--h2-size); font-weight: var(--heading-weight); }
      h3 { font-size: var(--h3-size); font-weight: var(--heading-weight); }
      
      .container { max-width: ${CW}; padding: ${SP.container}; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: ${SP.gap}; }
      .logo { height: ${D.identity.logoHeight}px; }
      .modal-card { max-width: ${MS} !important; }
      .reveal { transform: ${revealFrom}; }
      .reveal.in { transform: none; }
      ${D.animation.marquee.enabled ? "" : ".marquee-ticker { display: none !important; }"}
      .marquee-track {
        animation-duration: ${D.animation.marquee.speed}s !important;
        animation-direction: ${D.animation.marquee.direction === "reverse" ? "reverse" : "normal"} !important;
      }
      ${(D.sections.hidden || []).map((id) => '[data-section="' + id + '"] { display: none !important; }').join("\n")}
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

  function applyLogo() {
    const isDark = document.documentElement.classList.contains("dark");
    const logoLight = D.identity.logo;
    const logoDark = D.identity.logoDark;
    const defaultLight = "assets/logo.png";
    const defaultDark = "assets/logo-white.png";

    document.querySelectorAll(".site-header .logo img, nav .logo img, .dp-side-head img, .sidebar-head .logo img").forEach((img) => {
      const target = isDark ? (logoDark || defaultDark) : (logoLight || defaultLight);
      if (img.getAttribute("src") !== target) img.setAttribute("src", target);
    });

    document.querySelectorAll(".site-footer .logo img, .logo-footer img").forEach((img) => {
      const target = isDark ? (logoDark || defaultDark) : (logoLight || defaultLight);
      if (img.getAttribute("src") !== target) img.setAttribute("src", target);
    });
  }

  window.DESIGN_APPLY = function () {
    applyDesign();
    applyLogo();
    window.dispatchEvent(new Event("design-applied"));
  };

  applyDesign();
  applyLogo();

  const scheduleApplyLogo = () => setTimeout(applyLogo, 80);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleApplyLogo);
  else scheduleApplyLogo();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApplyLogo).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver);

  new MutationObserver(scheduleApplyLogo).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  window.DESIGN_TOKENS_APPLY = applyDesign;
})();
