# Infraestrutura

Configuração de execução local e empacotamento do OrgMind.

O ambiente é container-only. Docker com Docker Compose é a única dependência operacional do host; Git é usado para versionamento.

Responsabilidades previstas:

- Dockerfiles do backend e frontend;
- configurações auxiliares do Docker Compose;
- inicialização local de PostgreSQL e MinIO;
- scripts e configurações de health check;
- recursos necessários ao ambiente reproduzível de demonstração.

O arquivo `docker-compose.yml` permanecerá na raiz do repositório para permitir a execução direta com `docker compose`. Configurações específicas dos serviços podem ser mantidas neste diretório.

Portas locais reservadas:

| Serviço | Porta |
|---|---:|
| Frontend | 5173 |
| API | 8080 |
| PostgreSQL | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

Segredos não devem ser versionados. Variáveis necessárias serão documentadas em `.env.example` durante a implementação da US01.

O Compose deverá oferecer serviços ou targets para desenvolvimento, testes, lint, build, migrations e seeds. Caches de Go e npm devem usar volumes nomeados e não depender da máquina host.

## Comandos

```bash
docker compose up -d --build
docker compose ps
docker compose --profile tools run --rm smoke
docker compose down
```

O serviço `minio-init` cria de forma idempotente o bucket configurado por `MINIO_BUCKET`. O encerramento normal preserva os volumes `postgres-data` e `minio-data`.
