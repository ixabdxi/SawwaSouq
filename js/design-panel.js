/* ============================================================
   SaWWA Souq — Design Panel Logic (v2 — dark mode fix)
   ============================================================ */
(function () {
  if (!document.body || !document.body.classList.contains("design-body")) return;

  const D = window.DESIGN;
  const STORAGE_KEY = "sawwa_design";
  const HISTORY_KEY = "sawwa_design_history";

  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { history = []; }
  let isDirty = false;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const getPath = (obj, path) => path.split(".").reduce((a, p) => a && a[p], obj);
  const setPath = (obj, path, val) => {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  };

  const setStatus = (text, dirty) => {
    const s = $("#dpStatus");
    if (!s) return;
    s.textContent = text;
    if (dirty) {
      s.style.background = "color-mix(in srgb, #E8A33D 20%, transparent)";
      s.style.color = "#B8701F";
    } else {
      s.style.background = "color-mix(in srgb, #2E7D32 15%, transparent)";
      s.style.color = "#2E7D32";
    }
  };
  const markDirty = () => { isDirty = true; setStatus("غير محفوظ", true); };
  const markSaved = () => { isDirty = false; setStatus("محفوظ ✓", false); };

  /* ============ LIVE PREVIEW — uses DESIGN_APPLY from tokens ============ */
  const applyLive = () => {
    if (typeof window.DESIGN_APPLY === "function") window.DESIGN_APPLY();
  };

  /* ============ BIND INPUTS ============ */
  const bindInputs = () => {
    $$("[data-bind]").forEach((el) => {
      const path = el.dataset.bind;
      const type = el.dataset.type;
      const val = getPath(D, path);

      if (val !== undefined && val !== null) {
        if (el.type === "checkbox") el.checked = !!val;
        else el.value = val;
        if (el.type === "range") {
          const disp = el.parentElement.querySelector(".dp-range-val");
          if (disp) disp.textContent = val;
        }
      }

      if (el._bound) return;
      el._bound = true;

      el.addEventListener("input", () => {
        let v = el.value;
        if (el.type === "checkbox") v = el.checked;
        else if (type === "number") v = parseFloat(v) || 0;
        setPath(D, path, v);

        if (el.type === "range") {
          const disp = el.parentElement.querySelector(".dp-range-val");
          if (disp) disp.textContent = v;
        }
        if (el.type === "color") {
          const txt = el.parentElement.querySelector("input[type=text]");
          if (txt) txt.value = v;
        }
        if (el.dataset.colorHex !== undefined) {
          if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
            const col = el.parentElement.querySelector("input[type=color]");
            if (col) col.value = v;
          }
        }
        markDirty();
        applyLive();
      });
    });
  };

  /* ============ TABS ============ */
  const switchTab = (id) => {
    $$(".dp-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
    $$(".dp-panel").forEach((p) => p.classList.toggle("active", p.id === "dp-" + id));
    const titles = {
      identity: "الهوية", colors: "الألوان", typography: "الخطوط",
      effects: "التأثيرات", animation: "الحركة", layout: "التخطيط",
      components: "المكونات", images: "الصور", sections: "الأقسام",
      content: "المحتوى", analytics: "التحليلات", custom: "CSS مخصص",
      presets: "Presets جاهزة", history: "السجل", backup: "نسخ احتياطي"
    };
    const title = $("#dpTitle");
    if (title) title.textContent = titles[id] || "لوحة التصميم";
  };
  $$(".dp-tab").forEach((t) => t.onclick = () => switchTab(t.dataset.tab));

  /* ============ MOBILE SIDEBAR ============ */
  const sidebar = $("#dpSide");
  const dpMenu = $("#dpMenu");
  const dpClose = $("#dpClose");
  if (dpMenu) dpMenu.onclick = () => sidebar.classList.add("open");
  if (dpClose) dpClose.onclick = () => sidebar.classList.remove("open");

  /* ============ IMAGE COMPRESS ============ */
  const compressImage = (file, maxSize = 1200) => new Promise((resolve, reject) => {
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

  /* ============ IMAGE PICKERS ============ */
  const imgInput = $("#dpImgInput");
  const imgHeroInput = $("#dpImgHeroInput");
  let currentImgTarget = null;

  const bindImagePickers = () => {
    $$(".dp-img-picker[data-img]").forEach((picker) => {
      const path = picker.dataset.img;
      const val = getPath(D, path);
      const prev = picker.querySelector(".dp-prev");
      if (!prev) return;
      if (val) { prev.innerHTML = '<img src="' + val + '" alt="" />'; prev.classList.remove("empty"); }
      else { prev.innerHTML = ""; prev.classList.add("empty"); }
      picker.onclick = () => { currentImgTarget = { type: "single", picker, path }; imgInput.click(); };
    });
  };

  if (imgInput) imgInput.onchange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !currentImgTarget || currentImgTarget.type !== "single") return;
    try {
      const b64 = await compressImage(f);
      setPath(D, currentImgTarget.path, b64);
      const prev = currentImgTarget.picker.querySelector(".dp-prev");
      prev.innerHTML = '<img src="' + b64 + '" />';
      prev.classList.remove("empty");
      markDirty(); applyLive();
    } catch (err) { alert("تعذّر التحميل: " + err); }
    imgInput.value = "";
  };

  /* ============ HERO SLIDES ============ */
  const renderHeroImages = () => {
    const wrap = $("#dpHeroImages");
    if (!wrap) return;
    if (!D.images.heroSlides) D.images.heroSlides = [];
    wrap.innerHTML = D.images.heroSlides.map((s, i) => `
      <div class="dp-img-picker">
        <div class="dp-prev ${s ? "" : "empty"}">${s ? '<img src="' + s + '" />' : ""}</div>
        <div class="dp-meta">
          <strong>صورة ${i + 1}</strong>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="dp-btn" type="button" data-hero-change="${i}">تغيير</button>
            <button class="dp-btn danger" type="button" data-hero-del="${i}">حذف</button>
          </div>
        </div>
      </div>`).join("");
    wrap.querySelectorAll("[data-hero-change]").forEach((b) => b.onclick = () => {
      currentImgTarget = { type: "hero", index: parseInt(b.dataset.heroChange, 10) };
      imgHeroInput.click();
    });
    wrap.querySelectorAll("[data-hero-del]").forEach((b) => b.onclick = () => {
      D.images.heroSlides.splice(parseInt(b.dataset.heroDel, 10), 1);
      markDirty(); renderHeroImages();
    });
  };
  const addHeroBtn = $("#dpAddHero");
  if (addHeroBtn) addHeroBtn.onclick = () => {
    if (!D.images.heroSlides) D.images.heroSlides = [];
    if (D.images.heroSlides.length >= 5) { alert("الحد الأقصى 5 صور"); return; }
    D.images.heroSlides.push("");
    renderHeroImages();
  };
  if (imgHeroInput) imgHeroInput.onchange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !currentImgTarget || currentImgTarget.type !== "hero") return;
    try {
      const b64 = await compressImage(f);
      D.images.heroSlides[currentImgTarget.index] = b64;
      markDirty(); renderHeroImages();
    } catch { alert("تعذّر التحميل"); }
    imgHeroInput.value = "";
  };

  /* ============ SECTIONS ============ */
  const SECTION_LABELS = {
    hero: "Hero — الواجهة الرئيسية", trust: "Trust strip — شريط الثقة",
    features: "Features — الميزات", featured: "Featured — المنتجات المميزة",
    glass: "Glass — الزجاجي", rubber: "Rubber — المطاطي",
    reviews: "Reviews — آراء العملاء", newsletter: "Newsletter — الاشتراك"
  };
  const renderSections = () => {
    const wrap = $("#dpSectionsList");
    if (!wrap) return;
    if (!D.sections.order) D.sections.order = Object.keys(SECTION_LABELS);
    if (!D.sections.hidden) D.sections.hidden = [];
    wrap.innerHTML = D.sections.order.map((id, i) => `
      <div class="dp-list-item">
        <span class="grip">⋮⋮</span>
        <span class="label">${SECTION_LABELS[id] || id}</span>
        <div class="actions">
          <button class="dp-btn" data-sec-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="dp-btn" data-sec-down="${i}" ${i === D.sections.order.length - 1 ? "disabled" : ""}>↓</button>
          <label class="dp-toggle" style="padding:6px 10px;font-size:11px;margin:0">
            <input type="checkbox" ${!D.sections.hidden.includes(id) ? "checked" : ""} data-sec-toggle="${id}" />
            <span class="switch" style="width:30px;height:18px"></span>
          </label>
        </div>
      </div>`).join("");
    wrap.querySelectorAll("[data-sec-up]").forEach((b) => b.onclick = () => {
      const i = parseInt(b.dataset.secUp, 10);
      [D.sections.order[i - 1], D.sections.order[i]] = [D.sections.order[i], D.sections.order[i - 1]];
      markDirty(); renderSections(); applyLive();
    });
    wrap.querySelectorAll("[data-sec-down]").forEach((b) => b.onclick = () => {
      const i = parseInt(b.dataset.secDown, 10);
      [D.sections.order[i + 1], D.sections.order[i]] = [D.sections.order[i], D.sections.order[i + 1]];
      markDirty(); renderSections(); applyLive();
    });
    wrap.querySelectorAll("[data-sec-toggle]").forEach((cb) => cb.onchange = () => {
      const id = cb.dataset.secToggle;
      const i = D.sections.hidden.indexOf(id);
      if (cb.checked && i >= 0) D.sections.hidden.splice(i, 1);
      else if (!cb.checked && i < 0) D.sections.hidden.push(id);
      markDirty(); applyLive();
    });
  };

  /* ============ BANNERS ============ */
  const renderBanners = () => {
    const wrap = $("#dpBannersList");
    if (!wrap) return;
    if (!D.sections.banners) D.sections.banners = [];
    if (!D.sections.banners.length) { wrap.innerHTML = '<p style="color:var(--muted);font-size:13px">لا توجد banners.</p>'; return; }
    wrap.innerHTML = D.sections.banners.map((b, i) => `
      <div style="background:var(--paper);border:1.5px solid var(--line);border-radius:10px;padding:16px;margin-bottom:12px">
        <div class="dp-row">
          <label class="dp-field"><span>العنوان (عربي)</span><input type="text" data-banner="${i}" data-field="titleAr" value="${(b.titleAr || "").replace(/"/g, "&quot;")}" /></label>
          <label class="dp-field"><span>العنوان (إنجليزي)</span><input type="text" data-banner="${i}" data-field="titleEn" value="${(b.titleEn || "").replace(/"/g, "&quot;")}" /></label>
        </div>
        <div class="dp-row">
          <label class="dp-field"><span>رابط الزر</span><input type="text" data-banner="${i}" data-field="link" value="${(b.link || "").replace(/"/g, "&quot;")}" /></label>
          <label class="dp-field">
            <span>الموضع</span>
            <select data-banner="${i}" data-field="position">
              <option value="before-hero" ${b.position === "before-hero" ? "selected" : ""}>قبل Hero</option>
              <option value="after-featured" ${b.position === "after-featured" ? "selected" : ""}>بعد المنتجات المميزة</option>
              <option value="before-footer" ${b.position === "before-footer" ? "selected" : ""}>قبل الفوتر</option>
            </select>
          </label>
        </div>
        <button class="dp-btn danger" data-banner-del="${i}" type="button">حذف Banner</button>
      </div>`).join("");
    wrap.querySelectorAll("[data-banner]").forEach((el) => {
      el.oninput = () => {
        const i = parseInt(el.dataset.banner, 10);
        D.sections.banners[i][el.dataset.field] = el.value;
        markDirty();
      };
    });
    wrap.querySelectorAll("[data-banner-del]").forEach((b) => b.onclick = () => {
      D.sections.banners.splice(parseInt(b.dataset.bannerDel, 10), 1);
      markDirty(); renderBanners();
    });
  };
  const addBannerBtn = $("#dpAddBanner");
  if (addBannerBtn) addBannerBtn.onclick = () => {
    if (!D.sections.banners) D.sections.banners = [];
    D.sections.banners.push({ titleAr: "", titleEn: "", link: "", position: "before-footer" });
    markDirty(); renderBanners();
  };

  /* ============ PRESETS ============ */
  const PRESETS = [
    { id: "aurora", name: "Aurora", desc: "الحالي", colors: { teal: "#0F5C56", teal2: "#12A89B", amber: "#E8A33D", deep: "#0A3D38", bg: "#EDF1EE", white: "#FFFFFF", ink: "#0B1A18", muted: "#647570" } },
    { id: "brutalist", name: "Brutalist", desc: "بيج + حاد", colors: { teal: "#0A3D38", teal2: "#C77B1F", amber: "#E8A33D", deep: "#0B1A18", bg: "#F4F1EA", white: "#FFFFFF", ink: "#0B1A18", muted: "#6B7A76" } },
    { id: "minimal", name: "Minimal", desc: "أبيض نظيف", colors: { teal: "#1A1A1A", teal2: "#666666", amber: "#FF6B35", deep: "#000000", bg: "#FAFAFA", white: "#FFFFFF", ink: "#111111", muted: "#888888" } },
    { id: "darkpremium", name: "Dark Premium", desc: "أسود فخم", colors: { teal: "#D4AF37", teal2: "#F0C24A", amber: "#D4AF37", deep: "#0F0F0F", bg: "#0A0A0A", white: "#1A1A1A", ink: "#EDEDED", muted: "#999999" } },
    { id: "warmsand", name: "Warm Sand", desc: "دافئ هادئ", colors: { teal: "#8B6F47", teal2: "#C9A961", amber: "#E8A33D", deep: "#3D2817", bg: "#F5EBD9", white: "#FFFCF5", ink: "#2B1F11", muted: "#8A7B60" } },
    { id: "ocean", name: "Ocean", desc: "أزرق عميق", colors: { teal: "#0B4F6C", teal2: "#01BAEF", amber: "#FFA630", deep: "#022B3A", bg: "#E8F3F7", white: "#FFFFFF", ink: "#022B3A", muted: "#5A7A8A" } }
  ];
  const presetSwatch = (c) =>
    '<div class="swatch">' +
    '<span style="background:' + c.teal + '"></span>' +
    '<span style="background:' + c.teal2 + '"></span>' +
    '<span style="background:' + c.amber + '"></span>' +
    '<span style="background:' + c.deep + '"></span>' +
    '</div>';
  const renderPresets = () => {
    const g1 = $("#dpPresetGrid");
    const g2 = $("#dpPresetBig");
    const html = PRESETS.map((p) =>
      '<div class="dp-preset" data-preset="' + p.id + '">' +
      presetSwatch(p.colors) +
      "<strong>" + p.name + "</strong>" +
      "<small>" + p.desc + "</small>" +
      "</div>"
    ).join("");
    if (g1) g1.innerHTML = html;
    if (g2) g2.innerHTML = html;
    $$(".dp-preset").forEach((el) => el.onclick = () => {
      const p = PRESETS.find((x) => x.id === el.dataset.preset);
      if (!p) return;
      Object.assign(D.colors, p.colors);
      saveHistory();
      bindInputs();
      applyLive();
      markDirty();
      if (window.UI?.toast) UI.toast('تم تطبيق "' + p.name + '"', "success");
    });
  };

  /* ============ HISTORY ============ */
  const saveHistory = () => {
    const snap = JSON.parse(JSON.stringify(D));
    snap._savedAt = Date.now();
    history.push(snap);
    if (history.length > 20) history = history.slice(-20);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
    renderHistory();
  };
  const renderHistory = () => {
    const wrap = $("#dpHistoryList");
    if (!wrap) return;
    if (!history.length) { wrap.innerHTML = '<p style="color:var(--muted);font-size:13px">لا يوجد سجل بعد.</p>'; return; }
    wrap.innerHTML = history.slice().reverse().map((h, revIdx) => {
      const realIdx = history.length - 1 - revIdx;
      return '<div class="dp-history-item">' +
        "<span>حالة " + (realIdx + 1) + "</span>" +
        '<span class="time">' + new Date(h._savedAt || Date.now()).toLocaleString("ar-JO") + "</span>" +
        '<button class="dp-btn" data-history="' + realIdx + '">استعادة</button>' +
        "</div>";
    }).join("");
    wrap.querySelectorAll("[data-history]").forEach((b) => b.onclick = () => {
      const i = parseInt(b.dataset.history, 10);
      const snap = JSON.parse(JSON.stringify(history[i]));
      delete snap._savedAt;
      Object.keys(D).forEach((k) => delete D[k]);
      Object.assign(D, snap);
      bindInputs(); applyLive();
      renderHeroImages(); renderSections(); renderBanners();
      markDirty();
      if (window.UI?.toast) UI.toast("تم استعادة الحالة", "info");
    });
  };

  /* ============ SAVE / APPLY ============ */
  const saveAll = () => {
    D._savedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(D));
      saveHistory();
      markSaved();
      return true;
    } catch (e) {
      alert("تعذّر الحفظ — قد تكون مساحة localStorage ممتلئة. حاول حذف بعض الصور.");
      return false;
    }
  };
  const dpSave = $("#dpSave");
  if (dpSave) dpSave.onclick = () => {
    if (saveAll() && window.UI?.toast) UI.toast("تم حفظ التغييرات", "success");
  };
  const dpApply = $("#dpApply");
  if (dpApply) dpApply.onclick = () => {
    if (!saveAll()) return;
    if (window.UI?.toast) UI.toast("جاري تحميل الموقع...", "info");
    setTimeout(() => { location.href = "index.html"; }, 800);
  };
  const dpPreview = $("#dpPreview");
  if (dpPreview) dpPreview.onclick = () => { saveAll(); window.open("index.html", "_blank"); };
  const dpUndo = $("#dpUndo");
  if (dpUndo) dpUndo.onclick = () => {
    if (history.length < 2) { alert("لا يوجد للتراجع"); return; }
    history.pop();
    const snap = JSON.parse(JSON.stringify(history[history.length - 1]));
    delete snap._savedAt;
    Object.keys(D).forEach((k) => delete D[k]);
    Object.assign(D, snap);
    bindInputs(); applyLive();
    renderHeroImages(); renderSections(); renderBanners();
    markDirty();
  };
  const dpRedo = $("#dpRedo");
  if (dpRedo) dpRedo.onclick = () => alert("قيد التطوير");

  /* ============ EXPORT / IMPORT ============ */
  const download = (name, content, mime = "application/json") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  };
  const eA = $("#dpExportAll");
  if (eA) eA.onclick = () => download("sawwa-design-" + Date.now() + ".json", JSON.stringify(D, null, 2));
  const eC = $("#dpExportColors");
  if (eC) eC.onclick = () => download("sawwa-colors.json", JSON.stringify({ colors: D.colors, typography: D.typography }, null, 2));
  const eI = $("#dpExportImages");
  if (eI) eI.onclick = () => download("sawwa-images.json", JSON.stringify({ identity: D.identity, images: D.images }, null, 2));
  const iBtn = $("#dpImport");
  if (iBtn) iBtn.onclick = () => {
    const f = $("#dpImportFile").files[0];
    if (!f) { alert("اختر ملف"); return; }
    if (!confirm("سيستبدل الإعدادات الحالية. متأكد؟")) return;
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Object.keys(D).forEach((k) => delete D[k]);
        Object.assign(D, data);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(D)); } catch {}
        bindInputs(); applyLive();
        renderHeroImages(); renderSections(); renderBanners();
        markSaved();
        alert("تم الاستيراد — أعد تحميل الصفحة");
      } catch { alert("ملف غير صالح"); }
    };
    r.readAsText(f);
  };
  const rst = $("#dpReset");
  if (rst) rst.onclick = () => {
    if (!confirm("حذف كل الإعدادات والعودة للافتراضي؟")) return;
    if (!confirm("تأكيد نهائي؟")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    location.reload();
  };

  /* ============ LOGOUT ============ */
  const lo = $("#dpLogout");
  if (lo) lo.onclick = () => {
    sessionStorage.removeItem("sawwa_admin");
    sessionStorage.removeItem("sawwa_admin_expires");
    location.href = "index.html";
  };

  /* ============ INIT ============ */
  const init = () => {
    bindInputs();
    bindImagePickers();
    renderHeroImages();
    renderSections();
    renderBanners();
    renderPresets();
    renderHistory();
    markSaved();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();