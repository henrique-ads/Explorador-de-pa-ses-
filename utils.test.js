const { validarBusca, formatarPopulacao, formatarNome } = require("./utils");

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
