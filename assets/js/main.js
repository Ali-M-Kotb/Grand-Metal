// Grand Metal — i18n (EN/AR) + UI interactions
(function () {
  "use strict";

  const EMAIL = "Grand_metal@outlook.com";
  const WA = "201096478590";

  const dataEl = document.getElementById("i18n-json");
  const T = dataEl ? JSON.parse(dataEl.textContent) : {};

  function tr(key, lang) {
    const entry = T[key];
    if (!entry) return key;
    return entry[lang] || entry.en || key;
  }

  function detectInitialLang() {
    const stored = localStorage.getItem("gm_lang");
    if (stored === "en" || stored === "ar") return stored;
    return "ar";
  }

  let currentLang = "en";

  // RFC 3986 percent-encoding (space -> %20), not the form-urlencoded
  // "+" that URLSearchParams produces — mail/WhatsApp clients expect the
  // former and some render a literal "+" if given the latter.
  function toQuery(params) {
    return Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
  }

  /* ---------------- message builders ---------------- */
  function buildMailto(product, size, unit, spec, lang) {
    const subject = tr("msg.subject_product", lang).replace("{product}", product).replace("{size}", size);
    const body = [
      tr("msg.greeting", lang), "",
      tr("msg.interested", lang),
      tr("msg.product", lang).replace("{v}", product),
      tr("msg.size", lang).replace("{v}", size),
      tr("msg.unit", lang).replace("{v}", unit),
      tr("msg.details", lang).replace("{v}", spec),
      tr("msg.qty", lang), "",
      tr("msg.please_send", lang), "",
      tr("msg.thanks", lang),
    ].join("\n");
    return `mailto:${EMAIL}?${toQuery({ subject, body })}`;
  }

  function buildWhatsapp(product, size, unit, spec, lang) {
    const text = [
      tr("msg.greeting", lang),
      tr("msg.interested", lang),
      tr("msg.product", lang).replace("{v}", product),
      tr("msg.size", lang).replace("{v}", size),
      tr("msg.unit", lang).replace("{v}", unit),
      tr("msg.details", lang).replace("{v}", spec),
      tr("msg.please_send", lang),
    ].join("\n");
    return `https://wa.me/${WA}?${toQuery({ text })}`;
  }

  function buildGenericWhatsapp(lang) {
    const text = tr("msg.quick_quote", lang);
    return `https://wa.me/${WA}?${toQuery({ text })}`;
  }

  function buildGenericEmail(lang) {
    const subject = tr("msg.subject_general", lang);
    const body = [
      tr("msg.greeting", lang), "",
      tr("msg.general_intro", lang),
      tr("msg.product_blank", lang),
      tr("msg.size_blank", lang),
      tr("msg.qty_blank", lang), "",
      tr("msg.thanks", lang),
    ].join("\n");
    return `mailto:${EMAIL}?${toQuery({ subject, body })}`;
  }

  /* ---------------- apply language ---------------- */
  function rebuildCardLinks(lang) {
    document.querySelectorAll(".size-card").forEach((card) => {
      const productEn = card.dataset.product;
      const product = lang === "ar" ? card.dataset.productAr : productEn;
      const spec = lang === "ar" ? card.dataset.specAr : card.dataset.specEn;
      const size = card.querySelector(".size-value")?.textContent || "";
      const unit = card.querySelector(".size-unit")?.textContent || "";

      const emailBtn = card.querySelector(".btn-email");
      const waBtn = card.querySelector(".btn-whatsapp");
      if (emailBtn) {
        emailBtn.href = buildMailto(product, size, unit, spec, lang);
        emailBtn.setAttribute("aria-label", `${tr("btn.email.short", lang)} – ${product} ${size}`);
      }
      if (waBtn) {
        waBtn.href = buildWhatsapp(product, size, unit, spec, lang);
        waBtn.setAttribute("aria-label", `${tr("btn.whatsapp.short", lang)} – ${product} ${size}`);
      }
    });
  }

  function rebuildGenericLinks(lang) {
    document.querySelectorAll(".js-wa-generic").forEach((a) => {
      a.href = buildGenericWhatsapp(lang);
    });
    document.querySelectorAll(".js-email-generic").forEach((a) => {
      a.href = buildGenericEmail(lang);
    });
  }

  // Keep each viewer's dimension caption in sync with whichever size-card
  // the user last picked (or the default first card), across language toggles.
  function syncActiveDimCaptions() {
    document.querySelectorAll(".size-grid").forEach((grid) => {
      const active = grid.querySelector(".size-card.active");
      if (!active) return;
      const viewer = grid.closest("section")?.querySelector(".viewer");
      const dimEl = viewer?.querySelector(".viewer-dim .dim-text");
      if (!dimEl) return;
      const val = active.querySelector(".size-value").innerHTML;
      const unit = active.querySelector(".size-unit").textContent;
      dimEl.innerHTML = `${val} · ${unit}`;
    });
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = tr(el.dataset.i18n, lang);
    });

    rebuildCardLinks(lang);
    rebuildGenericLinks(lang);
    syncActiveDimCaptions();

    document.querySelectorAll(".lang-toggle .lang-opt").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.lang === lang);
    });

    localStorage.setItem("gm_lang", lang);
  }

  /* ---------------- boot + UI wiring ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(detectInitialLang());

    const langToggle = document.getElementById("lang-toggle");
    if (langToggle) {
      langToggle.addEventListener("click", () => {
        applyLanguage(currentLang === "en" ? "ar" : "en");
      });
    }

    // Size-card selection: highlight the picked size and update the
    // product photo's caption badge.
    document.querySelectorAll(".size-grid").forEach((grid) => {
      const viewer = grid.closest("section")?.querySelector(".viewer");
      const dimEl = viewer?.querySelector(".viewer-dim .dim-text");
      const cards = grid.querySelectorAll(".size-card");

      const setActive = (card) => {
        cards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        if (dimEl) {
          const val = card.querySelector(".size-value").innerHTML;
          const unit = card.querySelector(".size-unit").textContent;
          dimEl.innerHTML = `${val} · ${unit}`;
        }
      };

      cards.forEach((card) => card.addEventListener("click", () => setActive(card)));
      if (cards[0]) setActive(cards[0]);
    });

    // Mobile nav toggle
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => nav.classList.toggle("open"));
      nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
    }

    // Material tabs (coupling section)
    document.querySelectorAll(".material-tabs").forEach((tabs) => {
      const buttons = tabs.querySelectorAll("button");
      const panelsWrap = tabs.nextElementSibling;
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          panelsWrap.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
          panelsWrap.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add("active");
        });
      });
    });

    // Back to top
    const backBtn = document.querySelector(".back-to-top");
    if (backBtn) {
      window.addEventListener("scroll", () => {
        backBtn.classList.toggle("show", window.scrollY > 600);
      });
      backBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    // Current year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
