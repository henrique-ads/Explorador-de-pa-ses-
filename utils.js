// Funcoes puras do Explorador de Paises (faceis de testar).
// No navegador, estas funcoes ficam disponiveis para o script.js
// (carregue utils.js antes de script.js no index.html).
// No Jest, elas sao importadas com require.

// Aceita buscas com pelo menos 2 letras (ignora espacos nas pontas).
function validarBusca(texto) {
  if (typeof texto !== "string") return false;
  return texto.trim().length >= 2;
}

// 1415000000 -> "1.415.000.000" (formato brasileiro)
function formatarPopulacao(numero) {
  if (typeof numero !== "number" || Number.isNaN(numero)) return "-";
  return numero.toLocaleString("pt-BR");
}

// "bRaSiL" -> "Brasil"
function formatarNome(nome) {
  if (typeof nome !== "string" || nome.trim() === "") return "";
  const limpo = nome.trim().toLowerCase();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}
// "  JAPÃO " -> "japao" (minusculas, sem acento e sem espacos nas pontas)
function normalizarTexto(texto) {
  if (typeof texto !== "string") return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// So exporta quando roda no Node/Jest (no navegador "module" nao existe).
if (typeof module !== "undefined" && module.exports) {
   module.exports = { validarBusca, formatarPopulacao, formatarNome, normalizarTexto };
}
