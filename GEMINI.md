# Contexto do Projeto: Amortizatech (Juros)

**Amortizatech** é uma aplicação web financeira (Full-stack) focada na simulação e gestão de Crédito Habitação. O objetivo principal é permitir aos utilizadores simular empréstimos, comparar cenários, visualizar planos de amortização e acompanhar a evolução das taxas Euribor. O projeto inclui funcionalidades avançadas como amortização antecipada, gestão de perfil de utilizador e persistência de simulações.

---

## Tech Stack & Arquitetura

*   **Core Framework:** **Nuxt 4** (Modo de compatibilidade atual: `2025-01-15`).
*   **Linguagem:** TypeScript (Strict typing obrigatório).
*   **UI/UX:** **Nuxt UI** (v3/v4) com Tailwind CSS.
*   **Backend:** Nuxt Server (Nitro).
*   **Base de Dados:** PostgreSQL.
*   **ORM:** **Drizzle ORM** (Schema-first approach).
*   **Autenticação:** Better Auth.
*   **Validação de Dados:** Zod.
*   **Testes:** Vitest + @nuxt/test-utils.
*   **Package Manager:** Bun.
*   **Analytics:** PostHog (integração condicional).
*   **Deploy:** Docker (Compose disponível).

---

## Integrações & Serviços Externos

*   **Pagamentos:** **Lemon Squeezy** (Modelo Lifetime Deals).
    *   Gestão via Webhooks (`order_created`).
    *   Controlo de estado `isPro` no utilizador.
*   **Email Transacional:** **Resend**.
    *   Verificação de conta, Recuperação de password, Notificações de perfil.
*   **Dados Externos:** Atualização automática de taxas Euribor (Cron Jobs).
*   **CI/CD:** **GitHub Actions**.
    *   Pipeline automatizado: Lint -> Typecheck -> Testes -> Build.

---

## Estrutura e Conteúdos Principais

*   **`app/`**: Código fonte Frontend (Pages, Components, Composables, Layouts).
    *   `pages/simulation/`: Lógica central de simulação.
    *   `components/`: Gráficos (`AmortizationChart.vue`), Widgets.
    *   `composables/`: Lógica de negócio reutilizável (`useLoanCalculator`, `useFinancial`).
*   **`server/`**: Camada Backend.
    *   `api/`: Endpoints REST (`simulations`, `euribor`, `auth`, `billing`, `webhooks`).
    *   `database/`: Definições de Schema Drizzle (`schema.ts`, `auth-schema.ts`).
    *   `utils/`: Lógica pura de backend (`financial.ts`, `euribor.ts`, `email-templates.ts`).
*   **Dados Importantes (`schema.ts`)**:
    *   `simulations`: Guarda dados do empréstimo, tabela de amortização (JSONB) e resumos.
    *   `euribor_rates`: Histórico de taxas (3m, 6m, 12m).
    *   `users`: Campos extra para billing (`subscriptionId`, `customerId`, `isPro`).

---

## Regras MESTRAS para Agentes de AI

Qualquer alteração ou geração de código deve obedecer estritamente a estas diretrizes:

1.  **Functional Programming (FP) Only:**
    *   🚫 **Proibido:** Classes, herança, `this`, ou OOP patterns.
    *   ✅ **Obrigatório:** Pure functions, composition, immutability, e separação clara entre dados e comportamento.
    *   Use `const` para definições e evite side-effects fora de "boundaries" controladas.

2.  **Nuxt 4 & Best Practices:**
    *   Validar sempre se a funcionalidade existe no Nuxt 4 antes de implementar.
    *   Usar *Auto-imports* nativos do Nuxt (não importar `ref`, `computed`, `useFetch` manualmente a menos que necessário).
    *   Usar `useRuntimeConfig` para variáveis de ambiente.

3.  **UI Library (Nuxt UI):**
    *   Nunca criar componentes CSS do zero se existir um equivalente no **Nuxt UI**.
    *   Usar os tokens de design do sistema (cores, espaçamento) via props do Nuxt UI ou classes utilitárias do Tailwind.

4.  **Segurança & Robustez:**
    *   A API deve validar **todos** os inputs com **Zod** antes de processar.
    *   Nunca expor chaves privadas no cliente.
    *   Garantir que endpoints protegidos verificam a sessão do utilizador (Better Auth).
    *   **Pagamentos:** Validar sempre assinaturas de webhooks (HMAC) antes de processar.

5.  **Ambientes:**
    *   O código deve assumir a existência de ambientes distintos: `local` (testes/dev) e `prod`.
    *   Migrations de base de dados devem ser tratadas via Drizzle Kit, nunca manualmente.

6.  **Código Auto-explicativo (Clean Code):**
    *   🚫 **Proibido:** Comentários óbvios (ex: `// função que soma dois números`).
    *   ✅ **Obrigatório:** Nomes de variáveis e funções descritivos (`calculateMonthlyInstallment` vs `calc`).
    *   Seguir regras de Robert C. Martin (SOLID adaptado a FP, funções pequenas e focadas).

7.  **Testes:**
    *   Features de lógica de negócio (ex: cálculos financeiros) **devem** ter Testes Unitários (Vitest).
    *   Garantir que novos componentes não quebram o build (`npm run typecheck`).
