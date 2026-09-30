#!/usr/bin/env node
/*
 * Builds the cost-of-living pages from official BEA Regional Price Parities (RPPs).
 *
 *   node scripts/build-cities.mjs            fetch the latest RPPs from FRED, save data/rpp.json, render pages
 *   node scripts/build-cities.mjs --offline  render pages from the saved data/rpp.json only
 *
 * Data: U.S. Bureau of Economic Analysis, Regional Price Parities by metropolitan area,
 * read through FRED (Federal Reserve Bank of St. Louis). No API key is needed.
 * Output: wealth/cost-of-living/index.html, wealth/cost-of-living/<slug>/index.html,
 * wealth/sitemap.xml and wealth/robots.txt.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://chartmyfreedom.com";
const WEB = join(ROOT, "wealth");
const OFFLINE = process.argv.includes("--offline");

// Matches the calculator's example household ($4,600 a month at national-average prices).
const EXAMPLE_MONTHLY = 4600;
const WITHDRAWAL_RATE = 0.04;

const SERIES = {
  all: "RPPALL",          // all items
  housing: "RPPSERVERENT", // housing rents
  goods: "RPPGOOD",        // goods
  other: "RPPSERVEOTH",    // other services
};

const { metros } = JSON.parse(await readFile(join(ROOT, "data/metros.json"), "utf8"));

// ---------- data ----------
async function fetchMetro(cbsa) {
  const ids = Object.values(SERIES).map(s => s + cbsa).join(",");
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${ids}`;
  const res = await fetch(url, { headers: { "User-Agent": "chartmyfreedom-build" } });
  if (!res.ok) throw new Error(`FRED returned ${res.status} for ${url}`);
  const [head, ...rows] = (await res.text()).trim().split(/\r?\n/).map(l => l.split(","));
  // newest row where every series has a value
  for (const row of rows.reverse()) {
    const vals = row.slice(1).map(Number);
    if (vals.every(v => Number.isFinite(v) && v > 0)) {
      const out = { year: Number(row[0].slice(0, 4)) };
      Object.keys(SERIES).forEach(k => { out[k] = Number(row[head.indexOf(SERIES[k] + cbsa)]); });
      return out;
    }
  }
  throw new Error(`No complete observation found for CBSA ${cbsa}`);
}

async function loadData() {
  const path = join(ROOT, "data/rpp.json");
  if (OFFLINE) return JSON.parse(await readFile(path, "utf8"));
  const data = { source: "U.S. Bureau of Economic Analysis, Regional Price Parities, via FRED", fetched: new Date().toISOString().slice(0, 10), metros: {} };
  for (const m of metros) {
    data.metros[m.cbsa] = await fetchMetro(m.cbsa);
    process.stdout.write(`  ${m.city}: ${data.metros[m.cbsa].all} (${data.metros[m.cbsa].year})\n`);
  }
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
  return data;
}

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = n => "$" + Math.round(n).toLocaleString("en-US");
const short = n => n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : "$" + Math.round(n / 1e3) + "k";
const diff = rpp => {
  const d = Math.round((rpp - 100) * 10) / 10;
  return d === 0 ? "the same as the U.S. average" : `${Math.abs(d)}% ${d > 0 ? "above" : "below"} the U.S. average`;
};
const diffShort = rpp => { const d = Math.round((rpp - 100) * 10) / 10; return (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) + "%"; };
const fiNumber = rpp => EXAMPLE_MONTHLY * 12 * (rpp / 100) / WITHDRAWAL_RATE;
const longDate = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

// Reuse the calculator's consent + tag snippets so every page loads them in the same order.
const indexHtml = await readFile(join(WEB, "index.html"), "utf8");
const tagHead = indexHtml.slice(indexHtml.indexOf("<!-- Cookie consent"), indexHtml.indexOf("</script>", indexHtml.indexOf("gtag('config'")) + 9)
  .replace('src="consent.js"', 'src="/consent.js"');
const tagBody = indexHtml.slice(indexHtml.indexOf("<!-- Google Tag Manager (noscript) -->"), indexHtml.indexOf("<!-- End Google Tag Manager (noscript) -->") + 42);
if (!tagHead.includes("GTM-") || !tagBody.includes("noscript")) throw new Error("Could not find the tag snippets in wealth/index.html");

function page({ path, title, description, schema, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${tagHead}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#10684a">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ChartMyFreedom">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/city.css">
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>
</head>
<body>
${tagBody}
<a class="skip" href="#main">Skip to content</a>
<div class="page">
  <header class="top">
    <a class="brand" href="/">ChartMyFreedom</a>
    <nav aria-label="Site"><a href="/">Calculator</a><a href="/cost-of-living/">Cost of living</a><a href="/privacy.html">Privacy</a><a href="#" data-cookie-settings>Cookies</a></nav>
  </header>
${body}
  <footer class="foot">
    <div>
      <h2 class="foot-h">Disclaimer</h2>
      <p>ChartMyFreedom is an educational calculator, not financial, investment, tax or legal advice. Price levels are averages for the whole metro area; your own costs depend on where you live in it and how you spend. Talk to a qualified, fee-only financial professional before making decisions.</p>
    </div>
    <div>
      <h2 class="foot-h">Privacy</h2>
      <p>These pages don't ask for any personal information. See the <a href="/privacy.html">Privacy Policy</a> for how the site uses cookies, analytics and ads, or change your choice in <a href="#" data-cookie-settings>Cookie settings</a>.</p>
    </div>
  </footer>
</div>
</body>
</html>
`;
}

const org = { "@type": "Organization", "@id": `${SITE}/#org`, name: "ChartMyFreedom", url: `${SITE}/` };
const dataset = year => ({
  "@type": "Dataset",
  name: `Regional Price Parities by Metropolitan Area, ${year}`,
  creator: { "@type": "GovernmentOrganization", name: "U.S. Bureau of Economic Analysis" },
  url: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area",
});

const sourcesBlock = (year, fetched) => `
      <section aria-labelledby="h-src">
        <h2 id="h-src">Source and method</h2>
        <p>Price levels are the <a href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area" rel="noopener">Regional Price Parities</a> published by the U.S. Bureau of Economic Analysis for ${year}, read from <a href="https://fred.stlouisfed.org/" rel="noopener">FRED</a> at the Federal Reserve Bank of St. Louis. A value of 100 is the national average; 110 means prices are 10% higher. Housing is the index for rents, which drives most of the difference between areas.</p>
        <p>The retirement figures scale the calculator's example household, which spends ${money(EXAMPLE_MONTHLY)} a month (${money(EXAMPLE_MONTHLY * 12)} a year) at national-average prices, by the area's all-items index, then divide by a ${WITHDRAWAL_RATE * 100}% withdrawal rate. Taxes are not included.</p>
        <p class="meta-line">Data for ${year}. Last updated <time datetime="${fetched}">${longDate(fetched)}</time>.</p>
      </section>`;

// ---------- render ----------
const data = await loadData();
const rows = metros.map(m => ({ ...m, ...data.metros[m.cbsa] })).filter(m => m.all);
if (rows.length !== metros.length) throw new Error("Missing data for some metros; run without --offline to fetch it");
const year = Math.max(...rows.map(r => r.year));
const ranked = [...rows].sort((a, b) => b.all - a.all);
const rank = slug => ranked.findIndex(r => r.slug === slug) + 1;

const cityTable = current => `
        <div class="table-wrap" tabindex="0" role="region" aria-label="Cost of living in the 20 largest metro areas, scrollable">
          <table>
            <caption class="sr-only">Regional price parities for the 20 largest U.S. metro areas, ${year}, most expensive first</caption>
            <thead><tr><th scope="col">Metro area</th><th scope="col">All items</th><th scope="col">vs. U.S.</th><th scope="col">Housing</th><th scope="col">Freedom number*</th></tr></thead>
            <tbody>
${ranked.map(r => `              <tr${r.slug === current ? ' class="current" aria-current="page"' : ""}><th scope="row">${r.slug === current ? esc(r.city) : `<a href="/cost-of-living/${r.slug}/">${esc(r.city)}</a>`}</th><td>${r.all.toFixed(1)}</td><td>${diffShort(r.all)}</td><td>${r.housing.toFixed(1)}</td><td>${short(fiNumber(r.all))}</td></tr>`).join("\n")}
            </tbody>
          </table>
        </div>
        <p class="note">*For the calculator's example household (${money(EXAMPLE_MONTHLY * 12)} a year at national prices) at a ${WITHDRAWAL_RATE * 100}% withdrawal rate. The U.S. average is ${short(fiNumber(100))}.</p>`;

let written = 0;
for (const m of rows) {
  const path = `/cost-of-living/${m.slug}/`;
  const yearly = EXAMPLE_MONTHLY * 12 * m.all / 100;
  const fi = fiNumber(m.all), fiUS = fiNumber(100);
  const gap = fi - fiUS;
  const calcLink = `/?expenses=${Math.round(EXAMPLE_MONTHLY * m.all / 100)}&amp;city=${m.slug}#result`;
  const title = `Cost of Living in ${m.city} (${year}): What It Takes to Retire There`;
  const description = `Prices in the ${m.city} metro area are ${diff(m.all)} (BEA, ${year}). See housing, goods and services costs and how much you'd need invested to retire in ${m.city}.`;
  const schema = { "@context": "https://schema.org", "@graph": [org,
    { "@type": "WebPage", "@id": `${SITE}${path}#webpage`, url: `${SITE}${path}`, name: title, description, inLanguage: "en-US",
      dateModified: data.fetched, publisher: { "@id": `${SITE}/#org` }, isBasedOn: dataset(year),
      about: { "@type": "Place", name: m.area } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Calculator", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Cost of living", item: `${SITE}/cost-of-living/` },
      { "@type": "ListItem", position: 3, name: m.city, item: `${SITE}${path}` }] }] };

  const body = `
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Calculator</a></li><li><a href="/cost-of-living/">Cost of living</a></li><li aria-current="page">${esc(m.city)}</li></ol></nav>
  <main id="main">
    <section class="intro" aria-labelledby="page-title">
      <p class="kicker">${esc(m.area)} metro area</p>
      <h1 id="page-title">Cost of living in ${esc(m.city)}</h1>
      <p class="lede">Prices across the ${esc(m.city)} metro area are <strong>${diff(m.all)}</strong>, ranking ${ordinal(rank(m.slug))} most expensive of the 20 largest U.S. metros in ${year}.</p>
    </section>

    <section class="panel" aria-labelledby="h-prices">
      <h2 id="h-prices">How prices compare</h2>
      <dl class="figures four">
        <div><dt>All items</dt><dd>${m.all.toFixed(1)}</dd><dd class="sub">${diffShort(m.all)} vs. U.S.</dd></div>
        <div><dt>Housing (rents)</dt><dd>${m.housing.toFixed(1)}</dd><dd class="sub">${diffShort(m.housing)} vs. U.S.</dd></div>
        <div><dt>Goods</dt><dd>${m.goods.toFixed(1)}</dd><dd class="sub">${diffShort(m.goods)} vs. U.S.</dd></div>
        <div><dt>Other services</dt><dd>${m.other.toFixed(1)}</dd><dd class="sub">${diffShort(m.other)} vs. U.S.</dd></div>
      </dl>
      <p class="note">Index where the U.S. average is 100. Source: U.S. Bureau of Economic Analysis, ${year}.</p>
    </section>

    <section class="panel" aria-labelledby="h-retire">
      <h2 id="h-retire">What it takes to retire in ${esc(m.city)}</h2>
      <p>A lifestyle that costs ${money(EXAMPLE_MONTHLY * 12)} a year at national-average prices costs about <strong>${money(yearly)} a year</strong> in ${esc(m.city)}. To cover that from investments at a ${WITHDRAWAL_RATE * 100}% withdrawal rate, you'd need about <strong>${money(fi)}</strong> invested, ${gap >= 0 ? `${money(gap)} more` : `${money(-gap)} less`} than the same lifestyle needs on average nationwide.</p>
      <p><a class="btn primary" href="${calcLink}">Run the calculator with ${esc(m.city)} prices</a></p>
      <p class="note">The button fills the calculator's example spending with ${money(EXAMPLE_MONTHLY * m.all / 100)} a month. If you've already entered your own numbers, they stay as they are, since your real spending already reflects where you live.</p>
    </section>

    <section aria-labelledby="h-compare">
      <h2 id="h-compare">How ${esc(m.city)} compares</h2>
${cityTable(m.slug)}
    </section>
${sourcesBlock(year, data.fetched)}
  </main>`;

  await mkdir(join(WEB, "cost-of-living", m.slug), { recursive: true });
  await writeFile(join(WEB, "cost-of-living", m.slug, "index.html"), page({ path, title, description, schema, body }));
  written++;
}

function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

// hub page
{
  const path = "/cost-of-living/";
  const title = `Cost of Living by City (${year}): The 20 Largest U.S. Metro Areas`;
  const cheapest = ranked[ranked.length - 1], dearest = ranked[0];
  const description = `Compare prices in the 20 largest U.S. metro areas using official BEA data for ${year}, from ${dearest.city} to ${cheapest.city}, and see how much you'd need to retire in each.`;
  const schema = { "@context": "https://schema.org", "@graph": [org,
    { "@type": "CollectionPage", "@id": `${SITE}${path}#webpage`, url: `${SITE}${path}`, name: title, description, inLanguage: "en-US",
      dateModified: data.fetched, publisher: { "@id": `${SITE}/#org` }, isBasedOn: dataset(year),
      hasPart: ranked.map(r => ({ "@type": "WebPage", name: `Cost of living in ${r.city}`, url: `${SITE}/cost-of-living/${r.slug}/` })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Calculator", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Cost of living", item: `${SITE}${path}` }] }] };
  const body = `
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Calculator</a></li><li aria-current="page">Cost of living</li></ol></nav>
  <main id="main">
    <section class="intro" aria-labelledby="page-title">
      <p class="kicker">Official BEA price data, ${year}</p>
      <h1 id="page-title">Cost of living by city</h1>
      <p class="lede">Where you live changes how much you need to retire. In ${year}, prices ranged from ${diff(dearest.all)} in ${esc(dearest.city)} to ${diff(cheapest.all)} in ${esc(cheapest.city)}.</p>
    </section>
    <section aria-labelledby="h-all">
      <h2 id="h-all">The 20 largest metro areas, most expensive first</h2>
${cityTable(null)}
    </section>
${sourcesBlock(year, data.fetched)}
  </main>`;
  await mkdir(join(WEB, "cost-of-living"), { recursive: true });
  await writeFile(join(WEB, "cost-of-living", "index.html"), page({ path, title, description, schema, body }));
}

// sitemap + robots
const urls = ["/", "/cost-of-living/", ...rows.map(r => `/cost-of-living/${r.slug}/`), "/privacy.html"];
await writeFile(join(WEB, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${data.fetched}</lastmod></url>`).join("\n")}
</urlset>
`);
await writeFile(join(WEB, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Wrote ${written} city pages, the hub page, sitemap.xml and robots.txt (data year ${year}).`);
