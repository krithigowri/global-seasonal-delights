/* ============================================================
   Rasalaya — shared frontend logic (Phase 1: static, no backend)
   - Cookie consent banner (localStorage; per-purpose toggles)
   - Mobile nav
   - Browse page: loads recipes.json, filters, pills, sort, search
   - Recipe pages: share dialog, favorites (mock), star rating,
     feedback + newsletter mock confirmations
   - Signup: client-side validation + mock confirmation

   BACKEND HOOKS (Phase 2 — Supabase):
   - search "BACKEND:" below for every spot that will call the API.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Cookie consent ---------------- */
  var CONSENT_KEY = "rasalaya_cookie_consent_v1";
  // BACKEND: Phase 2 — POST consent events to the consent_audit table
  // (event_type=cookie_consent, purposes array, document_version) per
  // workspace/world-recipe-library/legal/consent-logging-spec.md

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); }
    catch (e) { return null; }
  }
  function saveConsent(choice) {
    choice.saved_at = new Date().toISOString();
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(choice)); } catch (e) {}
    // BACKEND: log cookie_consent event to Supabase consent_audit here.
  }

  function buildBanner() {
    if (getConsent()) return; // choice already stored
    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      "<h3>We use cookies</h3>" +
      "<p>We use cookies to keep you signed in, remember your preferences, and " +
      "(with your permission) understand how the library is used. Read our " +
      '<a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button class="btn btn-primary" data-cookie="accept">Accept all</button>' +
      '<button class="btn btn-outline" data-cookie="reject">Reject all</button>' +
      '<button class="btn-quiet" data-cookie="customize">Customize</button>' +
      "</div>" +
      '<div class="cookie-custom" hidden>' +
      '<label class="switch"><input type="checkbox" checked disabled><span class="track"></span>Necessary (always on — sign-in, security)</label>' +
      '<label class="switch"><input type="checkbox" data-purpose="analytics"><span class="track"></span>Analytics (helps us improve the library)</label>' +
      '<label class="switch"><input type="checkbox" data-purpose="marketing"><span class="track"></span>Marketing (newsletter measuring, offers)</label>' +
      '<div class="cookie-actions"><button class="btn btn-primary" data-cookie="save-custom">Save my choices</button></div>' +
      "</div>";
    document.body.appendChild(banner);

    banner.addEventListener("click", function (ev) {
      var action = ev.target.getAttribute("data-cookie");
      if (!action) return;
      if (action === "accept") {
        saveConsent({ necessary: true, analytics: true, marketing: true });
        banner.remove();
      } else if (action === "reject") {
        saveConsent({ necessary: true, analytics: false, marketing: false });
        banner.remove();
      } else if (action === "customize") {
        banner.querySelector(".cookie-custom").hidden = false;
      } else if (action === "save-custom") {
        saveConsent({
          necessary: true,
          analytics: !!banner.querySelector('[data-purpose="analytics"]').checked,
          marketing: !!banner.querySelector('[data-purpose="marketing"]').checked
        });
        banner.remove();
      }
    });
  }

  /* "Cookie settings" footer links reopen the banner */
  function wireCookieSettings() {
    document.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
        buildBanner();
      });
    });
  }

  /* ---------------- Mobile nav ---------------- */
  function wireNav() {
    var btn = document.querySelector(".hamburger");
    var links = document.querySelector(".nav-links");
    if (btn && links) {
      btn.addEventListener("click", function () {
        links.classList.toggle("open");
      });
    }
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------- Homepage search → browse ---------------- */
  function wireHeroSearch() {
    var form = document.getElementById("hero-search");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = form.querySelector("input").value.trim();
      window.location.href = "browse.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  }

  /* ---------------- Newsletter + share + feedback mocks ---------------- */
  function mockConfirm(form, message) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      // BACKEND: Phase 2 — newsletter: double opt-in flow (consent_audit
      // marketing_optin + doi token email). Share-gate: send recipe email.
      var done = document.createElement("div");
      done.className = "form-success";
      done.textContent = message;
      form.replaceWith(done);
    });
  }
  function wireMockForms() {
    document.querySelectorAll("[data-mock-newsletter]").forEach(function (f) {
      mockConfirm(f, "Thank you — please check your inbox to confirm your subscription.");
    });
    document.querySelectorAll("[data-mock-share]").forEach(function (f) {
      mockConfirm(f, "On its way! Check your inbox for the recipe.");
    });
    document.querySelectorAll("[data-mock-feedback]").forEach(function (f) {
      mockConfirm(f, "Thanks for the feedback — our cooks read every note.");
    });
    document.querySelectorAll("[data-mock-notify]").forEach(function (f) {
      mockConfirm(f, "You're on the list — we'll write when Collections launch.");
    });
  }

  /* ---------------- Share dialog ---------------- */
  function wireShareDialog() {
    var overlay = document.getElementById("share-overlay");
    if (!overlay) return;
    var openBtns = document.querySelectorAll("[data-open-share]");
    var closeBtn = overlay.querySelector(".modal-close");
    function open() { overlay.hidden = false; document.body.style.overflow = "hidden"; }
    function close() { overlay.hidden = true; document.body.style.overflow = ""; }
    openBtns.forEach(function (b) { b.addEventListener("click", open); });
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay) close();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !overlay.hidden) close();
    });
    // Brief: share dialog renders OPEN on recipe pages (mockup state).
    open();
  }

  /* ---------------- Favorites (mock) ---------------- */
  function wireFavorites() {
    // BACKEND: Phase 2 — requires Supabase auth; toggle favorite row for user.
    document.querySelectorAll(".heart-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        // Phase 1: no accounts yet — nudge toward signup, keep the heart visual.
        var note = btn.parentElement.querySelector(".heart-note");
        if (!btn.classList.contains("saved")) {
          btn.classList.add("saved");
          if (note) note.textContent = "Saved on this device — sign in to keep it everywhere.";
        } else {
          btn.classList.remove("saved");
          if (note) note.textContent = "Sign in to save this recipe.";
        }
      });
    });
  }

  /* ---------------- Star rating ---------------- */
  function wireStars() {
    document.querySelectorAll(".stars").forEach(function (wrap) {
      var buttons = Array.prototype.slice.call(wrap.querySelectorAll("button"));
      var hidden = wrap.parentElement.querySelector('input[name="rating"]');
      buttons.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          buttons.forEach(function (b, j) { b.classList.toggle("lit", j <= i); });
          if (hidden) hidden.value = i + 1;
        });
      });
    });
  }

  /* ---------------- Browse page ---------------- */
  function initBrowse() {
    var grid = document.getElementById("recipe-grid");
    if (!grid) return;

    var params = new URLSearchParams(window.location.search);
    var state = {
      q: params.get("q") || "",
      region: params.get("region") || "",
      season: params.get("season") || "",
      category: params.get("category") || "",
      festive: params.get("festive") === "1",
      kid: params.get("kid") === "1",
      veg: params.get("veg") === "1",
      sort: "loved"
    };

    var regionSel = document.getElementById("f-region");
    var seasonSel = document.getElementById("f-season");
    var sortSel = document.getElementById("f-sort");
    var searchInput = document.getElementById("f-search");
    var countEl = document.getElementById("result-count");
    var pillsEl = document.getElementById("active-pills");
    var emptyEl = document.getElementById("empty-state");
    var ALL = [];

    function artClass(i) { return "art art-" + ((i % 6) + 1); }

    function cardHTML(r, i) {
      var alias = r.aliases && r.aliases.length
        ? '<p class="alias-line">Also known as ' + esc(r.aliases[0].name) + " in " + esc(r.aliases[0].region) + "</p>"
        : "";
      return (
        '<article class="card">' +
        '<button class="heart-btn" aria-label="Save ' + esc(r.name) + ' to favorites">' +
        '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.5C.4 8 2.4 4.5 5.8 4.5c2 0 3.4 1.1 4.2 2.3.8-1.2 2.2-2.3 4.2-2.3 3.4 0 5.4 3.5 3.8 7-2.5 4.6-10 9.5-10 9.5z"/></svg>' +
        "</button>" +
        // ART PLACEHOLDER — Phase 2: replace .art div with <img src="..."> dish photography
        '<a href="' + esc(r.page) + '" aria-label="' + esc(r.name) + '"><div class="' + artClass(i) + '">' + esc(r.name.charAt(0)) + "</div></a>" +
        '<div class="card-body">' +
        "<h3><a href=\"" + esc(r.page) + "\">" + esc(r.name) + "</a></h3>" +
        alias +
        '<div class="tag-row">' +
        "<span class=\"tag\">" + esc(r.region) + "</span>" +
        "<span class=\"tag\">" + esc(r.season) + "</span>" +
        "<span class=\"tag\">" + esc(cap(r.category)) + "</span>" +
        (r.veg ? '<span class="tag veg">Vegetarian</span>' : "") +
        (r.festive ? '<span class="tag festive">Festive</span>' : "") +
        "</div>" +
        "</div></article>"
      );
    }

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function filtered() {
      var q = state.q.trim().toLowerCase();
      var list = ALL.filter(function (r) {
        if (state.region && r.region !== state.region) return false;
        if (state.season && r.season !== state.season) return false;
        if (state.category && r.category !== state.category) return false;
        if (state.festive && !r.festive) return false;
        if (state.kid && !r.kidFriendly) return false;
        if (state.veg && !r.veg) return false;
        if (q) {
          var hay = (r.name + " " + r.region + " " + r.season + " " +
            (r.aliases || []).map(function (a) { return a.name + " " + a.region; }).join(" ")).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      if (state.sort === "az") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      else if (state.sort === "season") list.sort(function (a, b) { return a.season.localeCompare(b.season); });
      return list;
    }

    function renderPills() {
      var pills = [];
      function add(label, clear) {
        pills.push({ label: label, clear: clear });
      }
      if (state.q) add('Search: "' + state.q + '"', function () { state.q = ""; searchInput.value = ""; });
      if (state.region) add(state.region, function () { state.region = ""; regionSel.value = ""; });
      if (state.season) add(state.season, function () { state.season = ""; seasonSel.value = ""; });
      if (state.category) add(cap(state.category), function () { state.category = ""; syncCatChips(); });
      if (state.festive) add("Festive", function () { state.festive = false; syncFestiveChip(); });
      if (state.kid) add("Kid-friendly", function () { state.kid = false; document.getElementById("f-kid").checked = false; });
      if (state.veg) add("Vegetarian", function () { state.veg = false; document.getElementById("f-veg").checked = false; });
      pillsEl.innerHTML = "";
      pills.forEach(function (p) {
        var s = document.createElement("span");
        s.className = "pill";
        s.innerHTML = "<span></span>";
        s.firstChild.textContent = p.label;
        var x = document.createElement("button");
        x.textContent = "×";
        x.setAttribute("aria-label", "Remove filter " + p.label);
        x.addEventListener("click", function () { p.clear(); render(); });
        s.appendChild(x);
        pillsEl.appendChild(s);
      });
      if (pills.length > 1) {
        var c = document.createElement("button");
        c.className = "clear-all";
        c.textContent = "Clear all";
        c.addEventListener("click", function () {
          state.q = ""; state.region = ""; state.season = ""; state.category = "";
          state.festive = false; state.kid = false; state.veg = false;
          searchInput.value = ""; regionSel.value = ""; seasonSel.value = "";
          document.getElementById("f-kid").checked = false;
          document.getElementById("f-veg").checked = false;
          syncCatChips(); syncFestiveChip(); render();
        });
        pillsEl.appendChild(c);
      }
    }

    function render() {
      var list = filtered();
      grid.innerHTML = list.map(cardHTML).join("");
      countEl.textContent = "Showing " + list.length + " of " + ALL.length + " sample recipes";
      emptyEl.hidden = list.length !== 0;
      renderPills();
      wireFavorites(); // re-wire hearts on freshly rendered cards
    }

    function syncCatChips() {
      document.querySelectorAll("[data-cat]").forEach(function (ch) {
        ch.setAttribute("aria-pressed", ch.getAttribute("data-cat") === state.category ? "true" : "false");
      });
    }
    function syncFestiveChip() {
      var ch = document.querySelector("[data-festive]");
      if (ch) ch.setAttribute("aria-pressed", state.festive ? "true" : "false");
    }

    fetch("recipes.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        ALL = data.recipes || [];
        // Populate region + season dropdowns from data
        var regions = [], seasons = [];
        ALL.forEach(function (r) {
          if (regions.indexOf(r.region) === -1) regions.push(r.region);
          if (seasons.indexOf(r.season) === -1) seasons.push(r.season);
        });
        regions.sort().forEach(function (rg) {
          var o = document.createElement("option");
          o.value = rg; o.textContent = rg; regionSel.appendChild(o);
        });
        seasons.sort().forEach(function (s) {
          var o = document.createElement("option");
          o.value = s; o.textContent = s; seasonSel.appendChild(o);
        });
        // Apply URL-param state to controls
        regionSel.value = state.region; seasonSel.value = state.season;
        searchInput.value = state.q;
        document.getElementById("f-kid").checked = state.kid;
        document.getElementById("f-veg").checked = state.veg;
        syncCatChips(); syncFestiveChip();
        render();
      })
      .catch(function () {
        grid.innerHTML = "";
        emptyEl.hidden = false;
        emptyEl.querySelector("p").textContent =
          "Could not load the recipe index. Serve this site over http (e.g. python3 -m http.server) rather than file:// and try again.";
      });

    regionSel.addEventListener("change", function () { state.region = regionSel.value; render(); });
    seasonSel.addEventListener("change", function () { state.season = seasonSel.value; render(); });
    sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });
    searchInput.addEventListener("input", function () { state.q = searchInput.value; render(); });
    document.getElementById("f-kid").addEventListener("change", function (e) { state.kid = e.target.checked; render(); });
    document.getElementById("f-veg").addEventListener("change", function (e) { state.veg = e.target.checked; render(); });
    document.querySelectorAll("[data-cat]").forEach(function (ch) {
      ch.addEventListener("click", function () {
        var v = ch.getAttribute("data-cat");
        state.category = (state.category === v) ? "" : v;
        syncCatChips(); render();
      });
    });
    var fch = document.querySelector("[data-festive]");
    if (fch) fch.addEventListener("click", function () {
      state.festive = !state.festive; syncFestiveChip(); render();
    });
  }

  /* ---------------- Signup validation ---------------- */
  function initSignup() {
    var form = document.getElementById("signup-form");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      function setErr(id, msg) {
        var el = document.getElementById(id);
        el.textContent = msg || "";
        if (msg) ok = false;
      }
      var email = form.querySelector('input[name="email"]').value.trim();
      var pw = form.querySelector('input[name="password"]').value;
      var agree = form.querySelector('input[name="agree"]').checked;
      setErr("err-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Please enter a valid email address.");
      setErr("err-password", pw.length >= 8 ? "" : "Password must be at least 8 characters.");
      setErr("err-agree", agree ? "" : "Please agree to the Terms to create your account.");
      if (!ok) return;
      // BACKEND: Phase 2 — Supabase Auth signUp + insert consent_audit rows
      // (terms_accept v1.0 + privacy_ack, unchecked_checkbox_click, with
      // document SHA-256 hash per legal/consent-logging-spec.md).
      var done = document.createElement("div");
      done.className = "form-success";
      done.style.color = "var(--espresso)";
      done.style.border = "1px solid var(--line)";
      done.style.background = "var(--card)";
      done.textContent = "Account created (demo) — check your inbox to verify your email.";
      form.replaceWith(done);
    });
  }

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildBanner();
    wireCookieSettings();
    wireNav();
    wireHeroSearch();
    wireMockForms();
    wireShareDialog();
    wireFavorites();
    wireStars();
    initBrowse();
    initSignup();
  });
})();
