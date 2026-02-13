# English Tutor — Tutor de idiomas com IA

![gif](https://github.com/user-attachments/assets/d35c0301-e485-41e8-8ba4-cad9cafb10ff)

## 🌐 Aplicação em produção

**[👉 Acesse o English Tutor online](https://chat-ai-bice-delta.vercel.app/)**

---

## Sobre o projeto

**English Tutor** é um tutor de idiomas alimentado por IA que ajuda você a aprender **Inglês** e **Alemão** de forma interativa. A aplicação funciona como um assistente de conversação, permitindo praticar traduções, correções, explicações gramaticais e expressões mais naturais.

### Funcionalidades

- **Tradução** — Traduza frases e expressões do português para inglês ou alemão
- **Modo com explicações** — Obtenha correções, traduções e explicações detalhadas sobre o uso correto
- **Apenas corrigir (inglês)** — Corrija erros em frases em inglês com feedback estruturado
- **Inglês casual** — Converta frases formais para um inglês mais natural e coloquial
- **Reconhecimento de voz** — Grave suas perguntas por voz (Web Speech API)
- **Síntese de fala (TTS)** — Ouça as respostas do tutor em voz alta
- **Sugestões rápidas** — Clique em sugestões prontas para começar a praticar

### Tecnologias

- **Next.js 16** — Framework React com App Router
- **React 19** — Interface de usuário
- **Tailwind CSS** — Estilização
- **Groq SDK** — Modelo de IA para respostas em tempo real
- **TypeScript** — Tipagem estática

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Build para produção

```bash
npm run build
npm start
```

---

## Variáveis de ambiente

Configure um arquivo `.env.local` com sua chave da API Groq:

```env
GROQ_API_KEY=sua_chave_aqui
```

---

Desenvolvido com foco em praticar idiomas de forma natural e conversacional.
