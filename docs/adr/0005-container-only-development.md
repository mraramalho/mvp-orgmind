# ADR 0005 — Desenvolvimento somente em containers

- Status: aceito
- Data: 2026-08-17

## Contexto

O OrgMind combina Go, Node.js, PostgreSQL, MinIO e ferramentas auxiliares. Instalações locais criariam diferenças de versão, configuração e sistema operacional, reduzindo a reprodutibilidade.

## Decisão

Todo runtime, infraestrutura e ferramenta de desenvolvimento do projeto executa em containers.

### Pré-requisitos do host

- Docker com suporte a Docker Compose.
- Git para clonar, versionar e publicar alterações.

O host não precisa instalar Go, Node.js, npm, PostgreSQL, MinIO, `golang-migrate`, linters, runners de teste ou clientes administrativos.

### Operações containerizadas

Devem existir comandos via `docker compose` para:

- inicializar e atualizar dependências Go e npm;
- executar frontend e backend em desenvolvimento;
- executar testes unitários, integração e E2E;
- executar lint e análise estática;
- gerar builds;
- aplicar e reverter migrations;
- executar seeds;
- subir PostgreSQL e MinIO;
- realizar health checks e smoke tests.

### Imagens e versões

- Go 1.25 em imagem fixada por versão.
- Node.js 26.x em imagem fixada por versão.
- PostgreSQL e MinIO com versões fixadas; não usar tags flutuantes como `latest`.
- Atualizações de versão são mudanças revisáveis e precisam passar por testes.

### Workspace e dependências

- Código-fonte é montado nos containers de desenvolvimento.
- Dependências e caches usam volumes Docker nomeados.
- `node_modules` do host não é montado nem reutilizado.
- Caches globais de Go ou npm do host não são utilizados.
- Arquivos gerados pertencentes ao repositório são escritos no workspace com permissões adequadas ao usuário do host.

### Desenvolvimento e produção

- Dockerfiles usam multi-stage build.
- Targets de desenvolvimento podem incluir hot reload e ferramentas adicionais.
- Imagens finais não incluem compiladores, caches, dependências de desenvolvimento ou segredos.
- A configuração de desenvolvimento não reduz controles obrigatórios de produção.

### Documentação

README, contribuição e instruções operacionais apresentam comandos containerizados. Comandos como `go test` ou `npm test` podem aparecer como processos internos do container, nunca como requisitos do host.

## Consequências

### Positivas

- Ambiente consistente entre pessoas e CI.
- Menos conflitos de versão e configuração.
- Bootstrap previsível em novas máquinas.
- Maior proximidade entre desenvolvimento e entrega.

### Custos

- Docker torna-se dependência obrigatória.
- Hot reload e acesso a arquivos exigem cuidado entre sistemas operacionais.
- Volumes e permissões precisam ser tratados explicitamente.
- Comandos simples possuem uma camada adicional de Compose.
