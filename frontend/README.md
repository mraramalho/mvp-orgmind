# Frontend

Aplicação web do OrgMind implementada com React, TypeScript e Vite, usando npm e Node.js 26.x exclusivamente em containers.

Responsabilidades previstas:

- autenticação e sessão;
- navegação com React Router;
- estado remoto com TanStack Query;
- projetos, processos e membros;
- editor e visualizador com `bpmn-js`;
- chat e apresentação das análises de IA;
- testes de componentes e fluxos críticos.

A instância do `bpmn-js` deve permanecer em `useRef` e ser gerenciada pelo ciclo de vida do componente. Ela não deve ser armazenada em Context ou no cache do TanStack Query. Consulte o `AGENTS.md` antes de estruturar o editor.

## Comandos

Execute a partir da raiz:

```bash
docker compose run --rm frontend-test
docker compose run --rm frontend-lint
docker compose build frontend
```

Não assuma Node.js ou npm instalados no host. Dependências, servidor de desenvolvimento, testes, lint e build usam Docker Compose. Dependências ficam em volume Docker, não em `node_modules` fornecido pelo host.
