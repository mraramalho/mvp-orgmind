# Backend

API do OrgMind em Go 1.25, executada exclusivamente em containers.

Este diretório receberá o módulo `github.com/mraramalho/mvp-orgmind`, organizado para manter domínio e casos de uso independentes de PostgreSQL, MinIO e OpenAI.

Responsabilidades previstas:

- API REST com `chi`;
- autenticação e autorização;
- domínio de projetos, processos e versões;
- persistência PostgreSQL com `pgx`;
- migrations com `golang-migrate`;
- armazenamento de artefatos no MinIO;
- parsing BPMN;
- interfaces e adaptadores de provedores de IA;
- testes unitários e de integração do backend.

## Comandos

Execute a partir da raiz:

```bash
docker compose run --rm backend-test
docker compose run --rm backend-lint
docker compose build backend
```

O endpoint inicial é `GET /health` e retorna o status e a versão da aplicação.

Não assuma Go instalado no host. Dependências, testes, formatação e build usam os targets do Docker Compose. Não adicione dependências de infraestrutura ao domínio.
