# OrgMind

O OrgMind é uma plataforma para mapeamento e análise inteligente de processos. O MVP permite criar projetos, desenhar e versionar processos BPMN, controlar o acesso por projeto e conversar com um agente de IA sobre os processos salvos.

Repositório oficial: [github.com/mraramalho/mvp-orgmind](https://github.com/mraramalho/mvp-orgmind)

Pull requests: [github.com/mraramalho/mvp-orgmind/pulls](https://github.com/mraramalho/mvp-orgmind/pulls)

## Estado atual

A fundação da US01 está concluída. Backend, frontend, PostgreSQL e MinIO executam via Docker Compose, com health checks, testes, lint e builds containerizados.

## Fluxo do MVP

```text
Usuário -> Projeto -> Processo -> Editor BPMN -> Versão salva
                                              |-> BPMN XML no MinIO
                                              |-> Markdown derivado
                                              `-> Análise pelo agente de IA
```

O BPMN XML é a fonte de verdade. O Markdown é uma representação derivada usada para fornecer contexto textual ao agente.

## Tecnologias planejadas

- React + TypeScript + Vite, executados em Node.js 26.x
- npm
- React Router para navegação
- TanStack Query para estado remoto e cache de API
- Estado local do React e Context restrito a preocupações transversais
- `bpmn-js`
- Go 1.25, módulo `github.com/mraramalho/mvp-orgmind`
- `chi`
- PostgreSQL com `pgx`
- `golang-migrate`
- MinIO
- Docker Compose
- OpenAI como primeiro provedor de LLM, usando `gpt-4o-mini` na demonstração e interfaces independentes de provedor

### Estado do editor BPMN

A instância do `bpmn-js` será mantida em `useRef` e gerenciada pelo ciclo de vida do componente React. Ela não será armazenada em Context ou no cache do TanStack Query. O React controla a interface ao redor do editor; o `bpmn-js` controla o canvas e o estado interno do diagrama; o TanStack Query controla somente dados carregados e persistidos pela API.

## Documentação

- [Especificação do projeto](SPECIFICATION.md)
- [Roadmap e backlog](ROADMAP.md)
- [Instruções para agentes de desenvolvimento](AGENTS.md)
- [Guia de contribuição](CONTRIBUTING.md)
- [Índice da documentação](docs/README.md)
- [ADR: ciclo de autenticação e sessão](docs/adr/0001-authentication-session-lifecycle.md)
- [ADR: senhas e recuperação de acesso](docs/adr/0002-password-and-account-recovery.md)
- [ADR: papéis e aprovação de processos](docs/adr/0003-project-roles-and-process-approval.md)
- [ADR: limites de IA e governança de dados](docs/adr/0004-ai-runtime-limits-and-data-governance.md)
- [ADR: desenvolvimento somente em containers](docs/adr/0005-container-only-development.md)
- [Decisões em aberto](docs/OPEN_DECISIONS.md)

## Estrutura do monorepo

```text
backend/    API e serviços Go
frontend/   aplicação React e editor BPMN
infra/      configurações de infraestrutura local e containers
docs/       ADRs, decisões e documentação complementar
```

Cada diretório contém um `README.md` com suas responsabilidades. As estruturas internas serão materializadas junto com a inicialização dos respectivos projetos, evitando diretórios vazios ou arquitetura especulativa.

## Execução local

O desenvolvimento é **container-only**. Não instale Go, Node.js, npm, PostgreSQL, MinIO, migrations ou ferramentas de teste/lint na máquina. O host precisa somente de Docker com Docker Compose e Git.

### Configuração

O Compose possui valores seguros apenas para desenvolvimento e funciona sem `.env`. Para personalizar, copie `.env.example` para `.env` e altere os valores locais. Nunca versione `.env`.

### Subir o ambiente

```bash
docker compose up -d --build
docker compose ps
```

Acessos:

- frontend: `http://localhost:5173`;
- API: `http://localhost:8080/health`;
- MinIO API: `http://localhost:9000`;
- MinIO Console: `http://localhost:9001`;
- PostgreSQL: `localhost:5432`.

### Validar

```bash
docker compose run --rm backend-test
docker compose run --rm backend-lint
docker compose run --rm frontend-test
docker compose run --rm frontend-lint
docker compose --profile tools run --rm smoke
```

O smoke test valida a API diretamente e também através do proxy `/api` do frontend.

### Logs e encerramento

```bash
docker compose logs -f backend frontend
docker compose down
```

`docker compose down` preserva os volumes. `docker compose down --volumes` também remove os dados locais do PostgreSQL, MinIO e caches e só deve ser usado intencionalmente.

Portas locais:

| Serviço | Porta |
|---|---:|
| Frontend | 5173 |
| API | 8080 |
| PostgreSQL | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## Princípios de desenvolvimento

- Histórias verticais, cobrindo todas as camadas necessárias.
- TDD orientado por comportamento.
- Autorização validada no backend.
- Segredos somente por configuração externa.
- Arquitetura simples e adequada ao prazo do MVP.
- Fatos, inferências e recomendações claramente separados nas respostas da IA.

Consulte o `AGENTS.md` antes de iniciar qualquer implementação.
