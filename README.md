# ✈ TERMINAL INTL

Explorador de países com visual de painel de partidas de aeroporto. Cada país vira um "voo": código do país como portão de embarque, capital, região e população como número de passageiros.

## Por que não usa a REST Countries API?

A API pública clássica (`restcountries.com`) foi descontinuada e a nova versão (`api.restcountries.com/v5`) agora exige cadastro e chave de API. Para manter o projeto 100% estático e sem chaves, os dados vêm de:

- [`mledoze/countries`](https://github.com/mledoze/countries) — dataset estático (JSON) com nome (inclusive tradução em português), capital, região, moedas, idiomas, área etc., servido via CDN (jsDelivr).
- [World Bank API](https://data.worldbank.org) — população mais recente por país (pública, sem chave).
- [flagcdn.com](https://flagcdn.com) — imagens de bandeiras por código do país.

## Rodando localmente

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abra http://localhost:8938

## Publicando no GitHub Pages

1. **Settings → Pages → Source**: branch `main`, pasta `/ (root)`.
2. Site disponível em `https://<usuario>.github.io/<repo>/`.

## Stack

HTML/CSS/JS puro, sem build step, sem backend.
