/*
 * Consent setup: Google Consent Mode v2 defaults + Google's certified CMP.
 *
 * Load this synchronously in <head> BEFORE the Google Tag Manager, AdSense and gtag.js snippets.
 *
 * - EEA, UK and Switzerland: storage defaults to "denied". The consent message comes from
 *   Google's certified CMP (AdSense > Privacy & messaging > European regulations), which the
 *   AdSense tag loads automatically and which integrates with the IAB TCF v2.2. With "Consent
 *   mode" turned on in Privacy & messaging, that CMP also updates Consent Mode for GA4/GTM.
 *   This script never shows its own banner or grants consent there.
 * - Everywhere else: storage defaults to "granted". Visitors can opt out with the panel below.
 * - Any element with the attribute data-cookie-settings reopens the right choice:
 *   Google's CMP where consent is required, otherwise this site's opt-out panel.
 */
(function () {
  var KEY = "cmf-privacy-optout-v2";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // EU member states + EEA (IS, LI, NO) + UK + Switzerland.
  var CONSENT_REGIONS = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "IS", "LI", "NO", "GB", "CH"];

  gtag("consent", "default", {
    ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
    analytics_storage: "granted", functionality_storage: "granted", security_storage: "granted"
  });
  // Region-specific default wins for these visitors; Google's CMP updates it after they choose.
  gtag("consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted",
    region: CONSENT_REGIONS, wait_for_update: 500
  });
  gtag("set", "ads_data_redaction", true);

  // Google CMP API queue (the CMP itself is loaded by the AdSense tag).
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  // Only ever *withdraws* consent on load, so it can't override a CMP choice in regulated regions.
  function applyOptOut(c) {
    var u = {};
    if (c.analytics === false) u.analytics_storage = "denied";
    if (c.ads === false) { u.ad_storage = "denied"; u.ad_user_data = "denied"; u.ad_personalization = "denied"; }
    if (Object.keys(u).length) gtag("consent", "update", u);
  }
  var saved = read();
  if (saved) applyOptOut(saved);

  var CSS =
    ".cc{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:640px;margin:0 auto;" +
    "background:var(--sheet,#fff);color:var(--ink,#1b1b1b);border:1px solid var(--field,#7d8882);border-radius:8px;" +
    "box-shadow:0 8px 30px rgba(0,0,0,.18);padding:18px 20px;font:1rem/1.5 var(--body,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif);display:grid;gap:12px}" +
    ".cc h2{all:unset;display:block;font-weight:600;font-size:1.0625rem}" +
    ".cc p{margin:0}.cc a{color:var(--note,#0059b3)}" +
    ".cc-opts{display:grid;gap:8px;border-top:1px solid var(--rule,#ddd);padding-top:12px}" +
    ".cc-opts label{display:flex;gap:10px;align-items:flex-start}.cc-opts input{margin-top:4px;width:20px;height:20px;flex:none;accent-color:var(--note,#0059b3)}" +
    ".cc-opts small{display:block;color:var(--muted,#555);font-size:.875rem}" +
    ".cc-btns{display:flex;flex-wrap:wrap;gap:8px}" +
    ".cc button{font:500 .9375rem inherit;font-family:inherit;min-height:44px;padding:10px 18px;border-radius:4px;cursor:pointer;border:1px solid var(--note,#0059b3);background:transparent;color:var(--note,#0059b3)}" +
    ".cc button.cc-primary{background:var(--note,#0059b3);color:var(--sheet,#fff)}" +
    ".cc button:focus-visible{outline:2px solid var(--note,#0059b3);outline-offset:2px}" +
    ".cc[hidden],.cc [hidden]{display:none!important}" +
    "@media print{.cc{display:none!important}}";

  // This site's own panel, used only where consent isn't legally required (e.g. the US).
  var el, opener;
  // regionUnknown: Google's CMP didn't load, so the visitor may be in a consent region; start unticked.
  function showPanel(regionUnknown) {
    if (el) el.remove();
    var cur = read() || (regionUnknown ? { analytics: false, ads: false } : { analytics: true, ads: true });
    if (!document.getElementById("cc-style")) {
      var style = document.createElement("style");
      style.id = "cc-style"; style.textContent = CSS;
      document.head.appendChild(style);
    }
    el = document.createElement("section");
    el.className = "cc";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-labelledby", "cc-title");
    el.innerHTML =
      '<h2 id="cc-title">Your privacy choices</h2>' +
      '<p>We use Google Analytics to count visits and Google AdSense to show ads. You can turn either off. ' +
      'The numbers you type into the calculator are never sent to anyone either way. <a href="/privacy.html">Privacy Policy</a></p>' +
      '<div class="cc-opts">' +
      '<label><input type="checkbox" checked disabled> <span>Essential<small>Remembers this choice and your calculator inputs on this device. Always on.</small></span></label>' +
      '<label><input type="checkbox" id="cc-analytics"' + (cur.analytics !== false ? " checked" : "") + '> <span>Analytics<small>Google Analytics: anonymous page views and general location (country/region).</small></span></label>' +
      '<label><input type="checkbox" id="cc-ads"' + (cur.ads !== false ? " checked" : "") + '> <span>Advertising<small>Google AdSense: cookies used to show and measure ads, including personalized ads.</small></span></label>' +
      '</div>' +
      '<div class="cc-btns">' +
      '<button type="button" class="cc-primary" data-cc="save">Save my choices</button>' +
      '<button type="button" data-cc="none">Turn off all</button>' +
      '<button type="button" data-cc="close">Close</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector("#cc-analytics").focus();
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    el.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-cc");
      if (!act) return;
      if (act === "close") return close();
      var c = act === "none" ? { analytics: false, ads: false }
            : { analytics: el.querySelector("#cc-analytics").checked, ads: el.querySelector("#cc-ads").checked };
      c.ts = new Date().toISOString();
      try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (err) {}
      var ads = c.ads ? "granted" : "denied";
      gtag("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied", ad_storage: ads, ad_user_data: ads, ad_personalization: ads });
      window.dataLayer.push({ event: "privacy_choice_update", consent_analytics: c.analytics, consent_ads: c.ads });
      close();
    });
  }
  function close() {
    if (el) { el.remove(); el = null; }
    if (opener && opener.focus) opener.focus();
  }

  // Route "Cookie settings" to Google's CMP where it applies, otherwise to the panel above.
  function openSettings() {
    var done = false;
    var fallback = setTimeout(function () { if (!done) { done = true; showPanel(true); } }, 1500); // CMP blocked or not loaded
    window.googlefc.callbackQueue.push(function () {
      if (done) return;
      done = true; clearTimeout(fallback);
      var fc = window.googlefc, st = fc.getConsentStatus && fc.getConsentStatus();
      if (fc.ConsentStatusEnum && st !== fc.ConsentStatusEnum.CONSENT_NOT_REQUIRED && fc.showRevocationMessage) fc.showRevocationMessage();
      else showPanel(false);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (!t) return;
    e.preventDefault();
    opener = t;
    openSettings();
  });
})();
