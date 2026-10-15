# Diário SMV

App web para acompanhar o plano alimentar **SMV · 6ª edição**: refeições do dia (com opções e sugestão automática), água com meta ajustada ao treino, extras, peso/bioimpedância/IMC, resumo semanal e calendário.

HTML + CSS + JavaScript puros. Sem build, sem servidor, sem dependências.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Telas do app |
| `styles.css` | Visual (identidade SMV, modo claro/escuro) |
| `app.js` | Lógica, gráficos, backup |
| `plano.js` | **O plano alimentar** — o único arquivo a editar quando a nutricionista mandar um plano novo |
| `sw.js` + `manifest.webmanifest` + `icons/` | Instalação no celular e uso offline (PWA) |

## Publicar no GitHub Pages (≈10 min)

1. Crie um repositório em github.com → **New** → nome, ex.: `diario-smv` → **Public** → *Create*.
2. **Add file → Upload files** → arraste todo o conteúdo desta pasta (inclusive `icons/` e `.nojekyll`) → *Commit changes*.
3. **Settings → Pages** → *Source: Deploy from a branch* → Branch `main`, pasta `/ (root)` → *Save*.
4. Em 1–2 min o app fica em `https://SEU-USUARIO.github.io/diario-smv/`.

Pelo terminal (alternativa ao passo 2):

```bash
git init && git add . && git commit -m "Diário SMV"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/diario-smv.git
git push -u origin main
```

## Instalar no celular

- **iPhone:** Safari → Compartilhar → *Adicionar à Tela de Início*.
- **Android:** Chrome → ⋮ → *Instalar app*.

## Dados e privacidade

- Os registros ficam **só no aparelho** (`localStorage`). Nada é enviado para servidor.
- Não há sincronização entre aparelhos: use **Perfil → Exportar/Importar backup** (arquivo `.json`).
- Limpar os dados do navegador apaga os registros — faça backup periodicamente (o app lembra a cada 14 dias).
- O repositório público expõe o **código e o plano** (`plano.js`), não os registros.

## Atualizar o plano

Edite `plano.js` direto no GitHub (ícone de lápis) e faça *Commit*. A nova versão aparece na próxima vez que o app for aberto. Para mudanças grandes de layout, aumente `VERSAO` em `sw.js`.
