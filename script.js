// ==========================================================
// TERMINAL INTL — Explorador de Países
// Dados: mledoze/countries (dataset estático) + população via
// World Bank API + bandeiras via flagcdn.com.
//
// A REST Countries API (restcountries.com) foi descontinuada e a
// nova versão exige cadastro/chave paga, por isso não é mais usada
// aqui — essas três fontes são públicas, gratuitas e sem chave.
// ==========================================================

const COUNTRIES_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json";
const POPULATION_URL = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&mrnev=1";
const FLAG = (cca2) => `https://flagcdn.com/${cca2.toLowerCase()}.svg`;

const resultsEl = document.getElementById("results");
const formEl = document.getElementById("search-form");
const inputEl = document.getElementById("search-input");
const tabsEl = document.getElementById("terminal-tabs");
const clockEl = document.getElementById("clock");

let activeRegion = "all";
let allCountries = null; // carregado uma vez em init()

// ---------- Relógio do painel (só atmosfera, não bloqueia nada) ----------
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  clockEl.textContent = `${hh}:${mm}:${ss}`;
}
tickClock();
setInterval(tickClock, 1000);

// ---------- Helpers de formatação ----------
function formatPopulation(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function getCurrencyLabel(currencies) {
  if (!currencies) return "—";
  const first = Object.values(currencies)[0];
  return first ? (first.symbol || first.name || "—") : "—";
}

function displayName(country) {
  return country.translations?.por?.common || country.name.common;
}

// ---------- Renderização ----------
function renderLoading() {
  resultsEl.innerHTML = `<p class="board__loading">Consultando torre de controle…</p>`;
}

function renderError(message) {
  resultsEl.innerHTML = `<p class="board__error">⚠ ${message}</p>`;
}

function renderEmpty() {
  resultsEl.innerHTML = `<p class="board__empty">NENHUM VOO ENCONTRADO PARA ESSE DESTINO. Tente outro nome de país.</p>`;
}

function renderCountries(countries) {
  resultsEl.innerHTML = "";

  countries
    .sort((a, b) => displayName(a).localeCompare(displayName(b)))
    .forEach((country, index) => {
      const card = document.createElement("article");
      card.className = "flight-card";
      card.style.animationDelay = `${Math.min(index * 30, 400)}ms`;

      const gate = country.cca3 || "???";
      const name = displayName(country);
      const capital = country.capital ? country.capital[0] : "Sem capital";
      const region = country.region || "—";
      const population = formatPopulation(country.population || 0);
      const flagUrl = country.flags?.svg || country.flags?.png || "";
      const flagAlt = country.flags?.alt || `Bandeira de ${name}`;

      card.innerHTML = `
        <span class="flight-card__gate">${gate}</span>
        <div class="flight-card__dest">
          <img class="flight-card__flag" src="${flagUrl}" alt="${flagAlt}" loading="lazy">
          <span class="flight-card__name">${name}</span>
        </div>
        <span class="flight-card__field"><span class="flight-card__field-label">CAPITAL</span>${capital}</span>
        <span class="flight-card__field"><span class="flight-card__field-label">REGIÃO</span>${region}</span>
        <span class="flight-card__field"><span class="flight-card__field-label">PAX</span>${population}</span>
        <span class="flight-card__status">EMBARCANDO</span>
      `;

      resultsEl.appendChild(card);
    });
}

// ---------- Carregamento e normalização dos dados ----------
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("fetch-error");
  return response.json();
}

function normalize(raw, populationByCca3) {
  return {
    name: { common: raw.name.common, official: raw.name.official },
    capital: raw.capital,
    region: raw.region,
    population: populationByCca3.get(raw.cca3) || 0,
    flags: { svg: FLAG(raw.cca2), alt: `Bandeira de ${raw.name.common}` },
    cca3: raw.cca3,
    currencies: raw.currencies,
    languages: raw.languages,
    translations: raw.translations,
  };
}

async function loadAllCountries() {
  const [countries, population] = await Promise.all([
    fetchJSON(COUNTRIES_URL),
    fetchJSON(POPULATION_URL).catch(() => null),
  ]);

  const populationByCca3 = new Map();
  if (population) {
    (population[1] || []).forEach((row) => {
      if (row.value) populationByCca3.set(row.countryiso3code, row.value);
    });
  }

  return countries
    .filter((c) => c.independent !== false || c.unMember)
    .map((c) => normalize(c, populationByCca3));
}

// ---------- Filtragem local (busca e região) ----------
function filterCountries({ name = "", region = "all" } = {}) {
  let list = allCountries;

  if (name.trim()) {
    const q = name.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.common.toLowerCase().includes(q) ||
        c.name.official.toLowerCase().includes(q) ||
        (c.translations?.por?.common || "").toLowerCase().includes(q) ||
        (c.translations?.por?.official || "").toLowerCase().includes(q)
    );
  }

  if (region !== "all") {
    const target = region.charAt(0).toUpperCase() + region.slice(1);
    return list.filter((c) => c.region === target);
  }

  return list;
}

function loadCountries(query = {}) {
  if (!allCountries) return; // ainda carregando via init()

  renderLoading();
  const found = filterCountries(query);
  if (found.length === 0) {
    renderEmpty();
    return;
  }
  renderCountries(found);
}

// ---------- Eventos ----------
formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const term = inputEl.value;
  loadCountries({ name: term, region: activeRegion });
});

tabsEl.addEventListener("click", (event) => {
  const tab = event.target.closest(".terminal-tab");
  if (!tab) return;

  tabsEl.querySelectorAll(".terminal-tab").forEach((t) => {
    t.classList.remove("is-active");
    t.setAttribute("aria-selected", "false");
  });
  tab.classList.add("is-active");
  tab.setAttribute("aria-selected", "true");

  activeRegion = tab.dataset.region;
  inputEl.value = "";
  loadCountries({ region: activeRegion });
});

// ---------- Carga inicial ----------
async function init() {
  renderLoading();
  try {
    allCountries = await loadAllCountries();
    loadCountries({ region: activeRegion });
  } catch (err) {
    renderError("Torre de controle fora do ar. Verifique sua conexão e tente novamente.");
  }
}
init();
