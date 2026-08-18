# Documentação do OrgMind

Este diretório concentra ADRs, decisões pendentes e documentação complementar. Os documentos normativos e operacionais de entrada permanecem na raiz para descoberta imediata por pessoas e agentes.

## Documentos normativos

Os documentos normativos abaixo permanecem na raiz junto aos demais documentos principais do projeto:

- [Especificação do projeto](../SPECIFICATION.md): objetivo, arquitetura, domínio, segurança, IA, testes e critério de pronto.
- [Roadmap e backlog](../ROADMAP.md): épicos, histórias, itens de trabalho e ordem recomendada.

## Documentos operacionais

- [AGENTS.md](../AGENTS.md): regras usadas por agentes de desenvolvimento.
- [README.md](../README.md): visão geral e entrada do repositório.
- [CONTRIBUTING.md](../CONTRIBUTING.md): fluxo de desenvolvimento e revisão.
- [ADR 0001 — Ciclo de autenticação e sessão](adr/0001-authentication-session-lifecycle.md): cookies, tokens, renovação, revogação e CSRF.
- [ADR 0002 — Senhas e recuperação de acesso](adr/0002-password-and-account-recovery.md): política, Argon2id, prevenção de enumeração e redefinição.
- [ADR 0003 — Papéis e aprovação de processos](adr/0003-project-roles-and-process-approval.md): papéis cumulativos, matriz de permissões e segregação de funções.
- [ADR 0004 — Limites de IA e governança de dados](adr/0004-ai-runtime-limits-and-data-governance.md): modelo inicial, consumo, tentativas, retenção e minimização.
- [ADR 0005 — Desenvolvimento somente em containers](adr/0005-container-only-development.md): pré-requisitos do host, comandos e isolamento de ferramentas.
- [Decisões em aberto](OPEN_DECISIONS.md): registro das escolhas que ainda precisam ser definidas; atualmente não há pendências.

## Documentação futura

Crie documentação adicional somente quando ela tiver uso concreto. Exemplos esperados durante a implementação:

- decisões arquiteturais relevantes em `docs/adr/`;
- modelo de dados e diagrama ER;
- contrato da API;
- guia de demonstração;
- estratégia de testes;
- modelos de ameaça e regras de autorização.

Evite duplicar requisitos entre documentos. Prefira links para a fonte normativa.
