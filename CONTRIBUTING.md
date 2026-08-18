# Contribuindo com o OrgMind

## Repositório oficial

- Git: `https://github.com/mraramalho/mvp-orgmind.git`
- Pull requests: `https://github.com/mraramalho/mvp-orgmind/pulls`

Todas as mudanças propostas devem ser enviadas por pull request para esse repositório. Antes de publicar uma branch, confirme que o remote `origin` aponta para a URL oficial.

## Antes de começar

1. Leia `AGENTS.md`.
2. Consulte a especificação do projeto.
3. Localize a história de usuário correspondente no roadmap.
4. Confirme que a mudança está dentro do MVP.
5. Verifique `docs/OPEN_DECISIONS.md` para não assumir silenciosamente uma decisão pendente.

## Ambiente de desenvolvimento

O projeto adota desenvolvimento container-only. Não instale nem use Go, Node.js, npm, PostgreSQL, MinIO, migrations, linters ou runners de teste diretamente no host.

Use comandos documentados com `docker compose` para instalar dependências, executar a aplicação, rodar testes e lint, gerar builds, aplicar migrations e executar seeds. O host precisa somente de Docker com Docker Compose e Git.

Se um comando documentado depender de outra instalação local, ele deve ser corrigido para executar em container.

## Desenvolvimento por história

Cada história deve entregar comportamento utilizável de ponta a ponta. Inclua na mesma entrega, conforme necessário:

- interface;
- API e regras de domínio;
- persistência e storage;
- autorização;
- testes;
- configuração e documentação.

Evite criar entregas isoladas somente de frontend, backend, banco ou infraestrutura quando elas não produzirem valor demonstrável por si mesmas.

## TDD

Use o seguinte ciclo:

1. descreva o comportamento esperado em um teste de aceitação;
2. adicione testes unitários de domínio relevantes;
3. implemente o mínimo para fazê-los passar;
4. cubra integrações com PostgreSQL, MinIO ou LLM quando aplicável;
5. adicione E2E para fluxos críticos;
6. refatore mantendo a suíte verde.

Fixtures BPMN devem ser pequenas, determinísticas e representar explicitamente o cenário testado.

## Segurança

- Faça autorização no backend para todos os recursos protegidos.
- Não inclua dados de processos não autorizados no contexto do agente.
- Não versione `.env`, tokens, senhas ou chaves.
- Use dados fictícios em seeds e fixtures.
- Valide entradas e trate erros sem expor informações sensíveis.

## Critérios para revisão

Antes de considerar uma mudança pronta, confirme:

- comportamento da história implementado de ponta a ponta;
- testes relevantes passando;
- lint e build passando;
- autorização coberta por teste quando aplicável;
- migrations reversíveis e revisadas quando aplicável;
- documentação e `.env.example` atualizados;
- nenhum componente fora do escopo introduzido sem decisão explícita.

Os comandos concretos serão documentados após a inicialização dos projetos Go e React.
