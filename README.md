# ✈ TERMINAL INTL

Explorador de países com visual de painel de partidas de aeroporto. Cada país vira um "voo": código do país como portão de embarque, capital, região e população como número de passageiros. Nesta etapa, o painel ganhou memória: você pode "embarcar" um país para uma lista pessoal de destinos, salva em banco de dados real.

- **Repositório GitHub:** https://github.com/henrique-ads/Explorador-de-pa-ses-
- **Aplicação (GitHub Pages):** https://henrique-ads.github.io/Explorador-de-pa-ses-/
- **Imagem no Docker Hub:** https://hub.docker.com/r/henriqueads/bootcamp2-app

## Dupla

| Nome                              | Matrícula      | GitHub                                         | Contribuição                                               |
| --------------------------------- | -------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Henrique                          | «matrícula»    | [henrique-ads](https://github.com/henrique-ads) | Explorador de Países (app, Supabase, Docker, testes e CI)  |
| Kauê Rodrigues de Oliveira Rocha  | 22606256       | [Oliveira-hubn](https://github.com/Oliveira-hubn) | Investfy (pasta `investfy/`)                               |

## Rodando com Docker

```bash
docker run -d -p 8080:80 henriqueads/bootcamp2-app:latest
```

Abra http://localhost:8080 — a aplicação sobe idêntica em qualquer máquina com Docker instalado, sem precisar clonar o repositório.

## Por que não usa a REST Countries API?

A API pública clássica (`restcountries.com`) foi descontinuada e a nova versão (`api.restcountries.com/v5`) agora exige cadastro e chave de API. Para manter o projeto 100% estático e sem chaves, os dados vêm de:

- [`mledoze/countries`](https://github.com/mledoze/countries) — dataset estático (JSON) com nome (inclusive tradução em português), capital, região, moedas, idiomas, área etc., servido via CDN (jsDelivr).
- [World Bank API](https://data.worldbank.org) — população mais recente por país (pública, sem chave).
- [flagcdn.com](https://flagcdn.com) — imagens de bandeiras por código do país.

## Persistência de dados

Banco escolhido: **Supabase (PostgreSQL)**, plano gratuito. Cada visita ao painel carrega os destinos salvos direto do banco — os dados sobrevivem ao fechar o navegador.

**Tabela `favoritos`:**

| Coluna         | Tipo                    | Descrição                                              |
| -------------- | ----------------------- | -------------------------------------------------------- |
| `id`           | uuid / bigint (PK)      | Identificador do registro                                 |
| `criado_em`    | timestamp (default now) | Data/hora em que o país foi salvo                         |
| `nome_item`    | text                     | Nome do país (em português)                                |
| `dados_extra`  | jsonb                    | `{ cca3, capital, region, flagUrl, status }`, onde `status` é `"desejado"` ou `"visitado"` |

**O que é salvo:** ao clicar em "★ EMBARCAR" em qualquer card do painel, o país entra na seção "MEUS DESTINOS" com status inicial `desejado`. É possível alternar para `visitado` (update) ou excluir o destino (delete) a qualquer momento — tudo refletido direto no banco.

Políticas de acesso (RLS) na tabela estão abertas para o papel `anon` (leitura e escrita), o que é aceitável apenas para esta etapa de estudo — **não deve ser usado em produção real**, onde cada usuário deveria autenticar e só acessar seus próprios registros.

## Sidequests

- **SQ1 · .dockerignore:** arquivo `.dockerignore` na raiz exclui `.git`, `README.md`, `serve.ps1` e arquivos de editor da imagem — deixa o build mais rápido e a imagem menor, já que nenhum desses arquivos é necessário para servir a página.
- **SQ2 · Versionamento de imagem:** publicadas as tags `1.0`, `1.1` e `latest` no Docker Hub.
- **SQ3 · Descrição no Docker Hub:** overview preenchido com o que é a aplicação, o comando `docker run` e o link deste repositório.
- **SQ4 · Explorando a orquestração:** print em `evidencias/docker-ps-dois-containers.png` mostrando `docker ps` com dois containers rodando (portas 8080 e 8081).

  **Se eu tivesse 100 containers, como gerenciaria?** Rodar e monitorar 100 containers manualmente com `docker run`/`docker ps` não escalaria — seria preciso orquestração. O **Kubernetes** resolve isso agrupando containers em **pods** (a menor unidade que ele gerencia, geralmente um container ou um pequeno grupo deles), organizando pods repetidos em **réplicas** de um mesmo serviço (o ReplicaSet garante que sempre haja N cópias saudáveis rodando, reiniciando as que falham), e distribuindo tudo isso entre várias máquinas físicas ou virtuais chamadas de nós, que juntas formam um **cluster**. Com isso, escalar de 1 para 100 containers vira uma questão de mudar um número de réplicas, e o próprio cluster cuida de onde rodar cada um, substituir os que caem e balancear a carga entre eles.

## Investfy (pasta `investfy/`)

Painel de cotações da B3 feito pelo Kauê, trazido do repositório [Oliveira-hubn/investimentos-app](https://github.com/Oliveira-hubn/investimentos-app). Permite consultar o preço atual, a variação do dia e outros indicadores de ações negociadas na bolsa brasileira.

**API utilizada:** [Brapi](https://brapi.dev), endpoint `GET https://brapi.dev/api/quote/{ticker}` (dados de PETR4, VALE3, ITUB4 e MGLU3, disponíveis sem autenticação).

**Funcionalidades:**
- Selecionar um ativo (PETR4, VALE3, ITUB4 ou MGLU3) e consultar sua cotação atual
- Visualizar preço, variação percentual do dia, abertura, fechamento anterior, máxima, mínima e volume negociado
- Ver o horário da última atualização da consulta
- Acompanhar uma faixa de ticker rolando no topo com o preço dos 4 ativos disponíveis
- Salvar ativos favoritos no Supabase (seção "Meus favoritos")
- Receber mensagem amigável caso a API esteja indisponível ou o ativo não seja encontrado

**Como abrir:** com o servidor local rodando (seção abaixo), acesse http://localhost:8938/investfy/. No GitHub Pages: https://henrique-ads.github.io/Explorador-de-pa-ses-/investfy/. Versão original no ar: https://oliveira-hubn.github.io/investimentos-app/

O Investfy não entra na imagem Docker: o `Dockerfile` copia só os arquivos do Explorador de Países.

## Rodando localmente (sem Docker)

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abra http://localhost:8938

## Publicando no GitHub Pages

1. **Settings → Pages → Source**: branch `main`, pasta `/ (root)`.
2. Site disponível em `https://<usuario>.github.io/<repo>/`.

## Stack

HTML/CSS/JS puro (sem build step), Supabase para persistência, Nginx + Docker para empacotamento e distribuição.
