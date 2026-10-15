const { validarBusca, formatarPopulacao, formatarNome, normalizarTexto } = require("./utils");
test("rejeita busca vazia ou com 1 letra", () => {
  expect(validarBusca("")).toBe(false);
  expect(validarBusca(" a ")).toBe(false);
});

test("aceita busca valida", () => {
  expect(validarBusca("brasil")).toBe(true);
});

test("formata populacao no padrao brasileiro", () => {
  expect(formatarPopulacao(1000000)).toBe("1.000.000");
});

test("populacao invalida vira traco", () => {
  expect(formatarPopulacao(undefined)).toBe("-");
});

test("formata nome com inicial maiuscula", () => {
  expect(formatarNome("bRaSiL")).toBe("Brasil");
});

test("remove acentos e deixa em minusculas", () => {
  expect(normalizarTexto("  JAPÃO ")).toBe("japao");
  expect(normalizarTexto("São Tomé e Príncipe")).toBe("sao tome e principe");
});

test("mantem texto que ja esta sem acento", () => {
  expect(normalizarTexto("brasil")).toBe("brasil");
});

test("entrada que nao e texto vira string vazia", () => {
  expect(normalizarTexto(null)).toBe("");
  expect(normalizarTexto(undefined)).toBe("");
});