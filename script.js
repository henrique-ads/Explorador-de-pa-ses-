// ==========================================================
// TERMINAL INTL — Explorador de Países
// Dados: mledoze/countries (dataset estático) + população via
// World Bank API + bandeiras via flagcdn.com.
//
// A REST Countries API (restcountries.com) foi descontinuada e a
// nova versão exige cadastro/chave paga, por isso não é mais usada
// aqui — essas três fontes são públicas, gratuitas e sem chave.
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COUNTRIES_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json";
const POPULATION_URL = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&mrnev=1";
const FLAG = (cca2) => `https://flagcdn.com/${cca2.toLowerCase()}.svg`;

// ---------- Persistência (Supabase) ----------
// Troque pelos valores do seu projeto em Project Settings → API.
const SUPABASE_URL = "https://aqbkkfxsrxwgrzyhtjgf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tWotzId3u0IQf9sRbk6TkQ_c7sHSTOU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const resultsEl = document.getElementById("results");
const formEl = document.getElementById("search-form");
const inputEl = document.getElementById("search-input");
const tabsEl = document.getElementById("terminal-tabs");
const clockEl = document.getElementById("clock");
const destinosListEl = document.getElementById("destinos-list");
const destinosCountEl = document.getElementById("destinos-count");

let activeRegion = "all";
let allCountries = null; // carregado uma vez em init()
let meusDestinos = []; // cache local dos favoritos vindos do Supabase

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
      const jaSalvo = meusDestinos.some((d) => d.dados_extra?.cca3 === gate);

      card.innerHTML = `
        <span class="flight-card__gate">${gate}</span>
        <div class="flight-card__dest">
          <img class="flight-card__flag" src="${flagUrl}" alt="${flagAlt}" loading="lazy">
          <span class="flight-card__name">${name}</span>
        </div>
        <span class="flight-card__field"><span class="flight-card__field-label">CAPITAL</span>${capital}</span>
        <span class="flight-card__field"><span class="flight-card__field-label">REGIÃO</span>${region}</span>
        <span class="flight-card__field"><span class="flight-card__field-label">PAX</span>${population}</span>
        <button
          type="button"
          class="flight-card__fav-btn${jaSalvo ? " is-saved" : ""}"
          data-cca3="${gate}"
          ${jaSalvo ? "disabled" : ""}
        >${jaSalvo ? "✓ SALVO" : "★ EMBARCAR"}</button>
      `;

      const favBtn = card.querySelector(".flight-card__fav-btn");
      favBtn.addEventListener("click", () =>
        handleFavoritar(favBtn, { name, capital, region, cca3: gate, flagUrl })
      );

      resultsEl.appendChild(card);
    });
}

// ---------- Persistência: CRUD de favoritos (tabela "favoritos") ----------

// CREATE — salva um país como destino
async function salvarFavorito(nome, extra) {
  const { data, error } = await supabase
    .from("favoritos")
    .insert({ nome_item: nome, dados_extra: extra })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// READ — lista todos os destinos salvos, mais recentes primeiro
async function listarFavoritos() {
  const { data, error } = await supabase
    .from("favoritos")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data;
}

// UPDATE — alterna entre "desejado" e "visitado" (bônus)
async function alternarStatus(destino) {
  const novoStatus = destino.dados_extra?.status === "visitado" ? "desejado" : "visitado";
  const dados_extra = { ...destino.dados_extra, status: novoStatus };
  const { error } = await supabase.from("favoritos").update({ dados_extra }).eq("id", destino.id);
  if (error) throw error;
}

// DELETE — remove um destino salvo
async function removerFavorito(id) {
  const { error } = await supabase.from("favoritos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Handlers ligados à interface ----------

async function handleFavoritar(button, country) {
  button.disabled = true;
  button.textContent = "SALVANDO…";
  try {
    await salvarFavorito(country.name, { ...country, status: "desejado" });
    await refreshDestinos();
    button.textContent = "✓ SALVO";
    button.classList.add("is-saved");
  } catch (err) {
    button.disabled = false;
    button.textContent = "★ EMBARCAR";
    alert("Não foi possível salvar. Verifique a configuração do Supabase.");
  }
}

async function handleRemover(id) {
  try {
    await removerFavorito(id);
    await refreshDestinos();
  } catch (err) {
    alert("Não foi possível remover este destino.");
  }
}

async function handleAlternarStatus(destino) {
  try {
    await alternarStatus(destino);
    await refreshDestinos();
  } catch (err) {
    alert("Não foi possível atualizar o status.");
  }
}

async function refreshDestinos() {
  meusDestinos = await listarFavoritos();
  renderDestinos();
}

function renderDestinos() {
  destinosCountEl.textContent = meusDestinos.length;

  if (meusDestinos.length === 0) {
    destinosListEl.innerHTML = `<p class="board__empty">Nenhum destino salvo ainda. Clique em "★ EMBARCAR" em um país da lista abaixo.</p>`;
    return;
  }

  destinosListEl.innerHTML = "";
  meusDestinos.forEach((destino) => {
    const extra = destino.dados_extra || {};
    const visitado = extra.status === "visitado";

    const card = document.createElement("article");
    card.className = "destino-card";
    card.innerHTML = `
      <img class="destino-card__flag" src="${extra.flagUrl || ""}" alt="Bandeira de ${destino.nome_item}" loading="lazy">
      <span class="destino-card__name">${destino.nome_item}</span>
      <span class="destino-card__badge${visitado ? " is-visitado" : ""}">${visitado ? "VISITADO" : "DESEJADO"}</span>
      <div class="destino-card__actions">
        <button type="button" class="destino-card__btn" data-action="status">${visitado ? "Marcar desejado" : "Marcar visitado"}</button>
        <button type="button" class="destino-card__btn destino-card__btn--remove" data-action="remove">Excluir</button>
      </div>
    `;

    card.querySelector('[data-action="status"]').addEventListener("click", () => handleAlternarStatus(destino));
    card.querySelector('[data-action="remove"]').addEventListener("click", () => handleRemover(destino.id));

    destinosListEl.appendChild(card);
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

  const destinosPromise = refreshDestinos().catch(() => {
    destinosListEl.innerHTML = `<p class="board__error">⚠ Não foi possível carregar seus destinos. Verifique a configuração do Supabase (URL/chave) em script.js.</p>`;
  });

  try {
    allCountries = await loadAllCountries();
    await destinosPromise; // garante que já sabemos quais países estão salvos antes de desenhar a lista
    loadCountries({ region: activeRegion });
  } catch (err) {
    renderError("Torre de controle fora do ar. Verifique sua conexão e tente novamente.");
  }
}
init();