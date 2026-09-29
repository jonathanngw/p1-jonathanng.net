/*
 * Cookie consent banner + Google Consent Mode v2.
 * Load this synchronously in <head> BEFORE the Google Tag Manager and gtag.js snippets:
 * it sets every Google storage type to "denied" by default, then re-applies the
 * visitor's saved choice (if any) and shows the banner until they choose.
 * Reopen it from any element with the attribute data-cookie-settings.
 */
(function () {
  var KEY = "cmf-cookie-consent-v1";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });
  gtag("set", "ads_data_redaction", true);

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function apply(c) {
    var ads = c.ads ? "granted" : "denied";
    gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: ads, ad_user_data: ads, ad_personalization: ads
    });
  }
  function save(c) {
    c.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    apply(c);
    window.dataLayer.push({ event: "cookie_consent_update", consent_analytics: c.analytics, consent_ads: c.ads });
  }

  var saved = read();
  if (saved) apply(saved);

  var CSS =
    ".cc{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:640px;margin:0 auto;" +
    "background:var(--sheet,#fff);color:var(--ink,#1b1b1b);border:1px solid var(--rule,#ccc);border-radius:8px;" +
    "box-shadow:0 8px 30px rgba(0,0,0,.18);padding:18px 20px;font:14px/1.5 var(--body,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif);display:grid;gap:12px}" +
    ".cc h2{all:unset;display:block;font-weight:600;font-size:15px}" +
    ".cc p{margin:0}.cc a{color:var(--note,#0066cc)}" +
    ".cc-opts{display:grid;gap:8px;border-top:1px solid var(--rule,#ddd);padding-top:12px}" +
    ".cc-opts label{display:flex;gap:10px;align-items:flex-start}.cc-opts input{margin-top:4px;accent-color:var(--note,#0066cc)}" +
    ".cc-opts small{display:block;color:var(--muted,#555);font-size:12px}" +
    ".cc-btns{display:flex;flex-wrap:wrap;gap:8px}" +
    ".cc button{font:500 13px inherit;font-family:inherit;padding:8px 14px;border-radius:4px;cursor:pointer;border:1px solid var(--note,#0066cc);background:transparent;color:var(--note,#0066cc)}" +
    ".cc button.cc-primary{background:var(--note,#0066cc);color:var(--sheet,#fff)}" +
    ".cc button:focus-visible{outline:2px solid var(--note,#0066cc);outline-offset:2px}" +
    ".cc[hidden],.cc [hidden]{display:none!important}" +
    "@media print{.cc{display:none!important}}";

  var el;
  function show() {
    if (el) { el.hidden = false; return; }
    var cur = read() || { analytics: false, ads: false };
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    el = document.createElement("section");
    el.className = "cc";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Cookie preferences");
    el.innerHTML =
      '<h2>Cookies on ChartMyFreedom.com</h2>' +
      '<p>We use Google Analytics to count visits and Google AdSense to show ads. Both set cookies only if you allow them. ' +
      'The numbers you type into the calculator are never sent to anyone either way. ' +
      '<a href="privacy.html">Privacy Policy</a></p>' +
      '<div class="cc-opts" hidden>' +
      '<label><input type="checkbox" checked disabled> <span>Essential<small>Remembers your cookie choice and your calculator inputs on this device. Always on.</small></span></label>' +
      '<label><input type="checkbox" id="cc-analytics"' + (cur.analytics ? " checked" : "") + '> <span>Analytics<small>Google Analytics: anonymous page views and general location (country/region).</small></span></label>' +
      '<label><input type="checkbox" id="cc-ads"' + (cur.ads ? " checked" : "") + '> <span>Advertising<small>Google AdSense: cookies used to show and measure ads, including personalized ads.</small></span></label>' +
      '</div>' +
      '<div class="cc-btns">' +
      '<button type="button" class="cc-primary" data-cc="all">Accept all</button>' +
      '<button type="button" data-cc="none">Reject all</button>' +
      '<button type="button" data-cc="custom">Customize</button>' +
      '</div>';
    document.body.appendChild(el);
    var opts = el.querySelector(".cc-opts");
    el.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-cc");
      if (!act) return;
      if (act === "custom") {
        opts.hidden = false;
        e.target.textContent = "Save my choices";
        e.target.setAttribute("data-cc", "save");
        return;
      }
      var c = act === "all" ? { analytics: true, ads: true }
            : act === "none" ? { analytics: false, ads: false }
            : { analytics: el.querySelector("#cc-analytics").checked, ads: el.querySelector("#cc-ads").checked };
      save(c);
      el.hidden = true;
    });
  }

  function init() {
    if (!saved) show();
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-cookie-settings]");
      if (!t) return;
      e.preventDefault();
      if (el) { el.remove(); el = null; }
      show();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
