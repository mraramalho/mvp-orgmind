# AGENTS.md

## Objetivo do repositório

Construir o MVP do OrgMind: uma plataforma para criar projetos, modelar e versionar processos BPMN, controlar acesso e analisar processos autorizados com um agente de IA.

O prazo e o critério de decisão são orientados à entrega de valor demonstrável. Evite introduzir componentes que não sejam necessários ao fluxo vertical do MVP.

Repositório oficial: `https://github.com/mraramalho/mvp-orgmind.git`.

Pull requests devem ser criados exclusivamente em `https://github.com/mraramalho/mvp-orgmind/pulls`.

## Fontes de verdade

Antes de implementar uma história, consulte:

1. `SPECIFICATION.md` para requisitos, arquitetura e regras de domínio.
2. `ROADMAP.md` para ordem, histórias e itens de trabalho.
3. Este arquivo para regras operacionais de desenvolvimento.

Em caso de conflito, não invente uma decisão de produto. Registre o conflito e peça confirmação.

## Escopo do MVP

O fluxo principal deve permitir que um usuário:

1. autentique-se;
2. crie e acesse projetos autorizados;
3. crie um processo;
4. desenhe o processo com `bpmn-js`;
5. salve e reabra uma versão BPMN;
6. conceda acesso por projeto;
7. visualize um processo conforme sua permissão;
8. converse com o agente sobre um processo salvo;
9. solicite resumo, potenciais gargalos, melhorias e redundâncias;
10. compare processos autorizados do mesmo projeto.

## Stack e arquitetura obrigatórias

- Frontend: React e TypeScript, inicialmente com Vite.
- Gerenciador de pacotes do frontend: npm.
- Runtime do frontend: Node.js 26.x, família estável atual na definição desta base.
- Roteamento: React Router.
- Estado remoto e cache de API: TanStack Query.
- Estado de interface: estado local do React e Context apenas quando houver compartilhamento real entre componentes.
- Editor: `bpmn-js` integrado à aplicação.
- Backend: Go 1.25 com API REST.
- Módulo Go: `github.com/mraramalho/mvp-orgmind`.
- Router HTTP do backend: `chi`.
- Driver e toolkit PostgreSQL: `pgx`.
- Migrations: `golang-migrate`.
- Banco: PostgreSQL para metadados, relações, permissões e mensagens.
- Artefatos: MinIO para BPMN XML e Markdown derivado.
- Execução local: Docker e Docker Compose.
- Desenvolvimento container-only: runtimes, infraestrutura, dependências e ferramentas executam exclusivamente em containers.
- IA: OpenAI como primeiro provedor, sempre encapsulado por interfaces que permitam outros provedores.
- Modelo inicial de demonstração: `gpt-4o-mini`.
- Parser BPMN inicial: `encoding/xml` do Go.

## Portas locais padrão

- Frontend: `5173`.
- API: `8080`.
- PostgreSQL: `5432`.
- MinIO API: `9000`.
- MinIO Console: `9001`.

Essas portas devem poder ser sobrescritas por variáveis de ambiente quando tecnicamente apropriado.

Fluxo arquitetural principal:

```text
React + TypeScript -> REST -> Go API
                              |-> PostgreSQL
                              |-> MinIO
                              `-> LLM API
```

## Estrutura esperada

```text
backend/       API, domínio, persistência, storage e integração com IA
frontend/      aplicação React, editor BPMN e chat
infra/         Docker, Compose e configurações de infraestrutura local
docs/          índice, decisões e documentação complementar
tests/         testes que não pertençam naturalmente ao backend ou frontend
```

Não crie diretórios vazios apenas para satisfazer esta árvore. Crie-os quando receberem o primeiro arquivo funcional.

## Ambiente container-only

Siga `docs/adr/0005-container-only-development.md`.

- Não exija instalação local de Go, Node.js, npm, PostgreSQL, MinIO, migrations, linters ou runners de teste.
- O host precisa apenas de Docker com Docker Compose e Git.
- Execute instalação de dependências, geração de código, testes, lint, build, migrations e seeds via `docker compose`.
- Use imagens com versões fixadas: Go 1.25 e Node.js 26.x.
- Monte o workspace nos containers de desenvolvimento e mantenha caches de dependências em volumes Docker nomeados.
- Não monte `node_modules` do host nem dependa de caches globais da máquina.
- Arquivos gerados pertencentes ao repositório devem ser escritos no workspace montado com permissões compatíveis.
- Documente comandos na forma containerizada; `go`, `npm`, `node` e clientes de banco não são pré-requisitos do host.
- Dockerfiles de produção devem usar multi-stage build e permanecer separados dos targets de desenvolvimento.

## Integração React e bpmn-js

O `bpmn-js` possui um modelo de execução imperativo e deve controlar diretamente o elemento de canvas fornecido a ele. Para evitar conflitos com o ciclo declarativo do React:

- Crie a instância de `Modeler` ou `Viewer` em um `useEffect` e armazene-a em `useRef`.
- Nunca armazene a instância do modeler, `eventBus`, `elementRegistry`, elementos BPMN ou outros objetos mutáveis do toolkit no Context, TanStack Query ou em estado serializável.
- Destrua a instância e remova listeners no cleanup do efeito.
- Use TanStack Query somente para dados remotos: metadados, versões, permissões, sessões e BPMN XML carregado/salvo pela API.
- Use estado local para seleção, painéis, modais e controles transitórios da tela.
- Use Context apenas para preocupações estáveis e transversais, como sessão autenticada, evitando transformá-lo em um store global do editor.
- Converta alterações do editor em XML nos pontos de salvamento/autosave definidos; não tente espelhar continuamente todo o grafo BPMN no estado React.
- Assine eventos do `eventBus` apenas quando necessários e encaminhe ao React somente dados mínimos e serializáveis.
- Mantenha o componente hospedeiro do canvas montado de forma estável; mudanças de rota ou chave não devem recriar o editor inadvertidamente.

React Router é responsável somente pela navegação. TanStack Query é responsável pelo estado do servidor. O `bpmn-js` permanece responsável pelo estado interno do diagrama durante a edição.

## Regras de domínio e persistência

- O BPMN XML original é a fonte de verdade do processo.
- Preserve o XML antes de gerar qualquer representação derivada.
- O Markdown é derivado, determinístico e destinado ao contexto da IA.
- Arquivos físicos ficam no MinIO; PostgreSQL guarda metadados e chaves de storage.
- O domínio deve usar `artifact_id` ou `storage_key`, sem acoplamento direto ao caminho físico.
- Entidades mínimas: User, Project, ProjectMember, Process, ProcessVersion, Artifact, ChatSession e ChatMessage.
- Papéis cumulativos do MVP: Admin, Contributor, Approver e Viewer.
- Estados: Draft, In Review, Approved e Archived.
- Uma versão aprovada é imutável; alterações produzem nova versão.
- Siga `docs/adr/0003-project-roles-and-process-approval.md` para autorização e aprovação.
- Admin administra membros e arquiva projetos, mas não recebe implicitamente permissão de edição ou aprovação.
- Contributor cria e edita versões Draft e pode enviá-las para aprovação.
- Approver visualiza histórico e aprova ou rejeita versões In Review, sem editar a versão submetida.
- Viewer somente visualiza processos autorizados.
- Um usuário pode acumular papéis no mesmo projeto, mas nunca pode aprovar a própria versão.
- Aprovação e rejeição exigem justificativa e registram usuário e data.
- Rejeição move a versão de In Review para Draft, preservando o histórico.

## Segurança e autorização

- Autorize todo acesso a projetos e processos no backend.
- Calcule permissões pela união dos papéis atribuídos ao membro no projeto e aplique também as restrições contextuais, como a proibição de autoaprovação.
- Nunca dependa exclusivamente de controles do frontend.
- O agente só pode receber processos acessíveis ao usuário atual.
- Comparações só podem incluir processos autorizados.
- Valide todas as entradas no backend.
- Não grave segredos, tokens ou credenciais no código ou no repositório.
- Use variáveis de ambiente e mantenha `.env.example` sem valores secretos.
- Siga `docs/adr/0001-authentication-session-lifecycle.md` para autenticação, cookies, renovação e revogação.
- Siga `docs/adr/0002-password-and-account-recovery.md` para política de senha, armazenamento e recuperação de acesso.
- Use access JWT com duração de 10 minutos em cookie `HttpOnly`, `Secure` e `SameSite=Lax`.
- Use refresh token opaco, aleatório e rotativo; não use JWT como refresh token.
- Armazene somente o hash do refresh token no PostgreSQL, associado à sessão e à família de tokens.
- A sessão expira após 7 dias de inatividade ou 30 dias de duração absoluta.
- Detectar reutilização de refresh token deve revogar toda a família da sessão.
- Proteja operações mutáveis contra CSRF; `SameSite` não é a única defesa.
- Não armazene access token ou refresh token em `localStorage` ou em estado acessível ao JavaScript.
- Exija no mínimo 15 caracteres e aceite pelo menos 64; permita espaços, Unicode, colagem e gerenciadores de senha.
- Não imponha regras arbitrárias de composição nem expiração periódica de senha.
- Bloqueie senhas comuns, comprometidas ou relacionadas ao usuário/produto.
- Armazene senhas somente com Argon2id, salt aleatório por senha e parâmetros registrados junto ao hash.
- Use inicialmente Argon2id com 64 MiB, 3 iterações e paralelismo 2, calibrando para aproximadamente 100–250 ms no ambiente real.
- Recuperação usa token opaco aleatório de 256 bits, hash no PostgreSQL, validade de 30 minutos e uso único.
- Não revele se uma conta existe em login ou recuperação; aplique rate limiting por conta e origem.
- Após redefinição de senha, revogue todas as sessões e não autentique automaticamente.

## Regras para IA

- Use OpenAI como a primeira implementação concreta.
- Defina interfaces no domínio/aplicação e mantenha SDKs, payloads e detalhes da OpenAI na camada de infraestrutura.
- Não permita que handlers, casos de uso ou entidades dependam diretamente do SDK da OpenAI.
- Preserve a possibilidade de adicionar outros provedores sem alterar regras de domínio ou contratos dos casos de uso.
- Siga `docs/adr/0004-ai-runtime-limits-and-data-governance.md` para limites, tentativas, rate limiting, retenção e minimização de dados.
- Use por padrão até 32.000 tokens de entrada e 1.500 tokens de saída por análise.
- Aplique timeout total de 60 segundos e no máximo duas novas tentativas com backoff exponencial e jitter somente para falhas transitórias.
- Aplique por padrão 10 requisições por minuto e 100 por hora por usuário, com concorrência máxima de 2 por usuário e 5 por projeto.
- Permita configuração pelo Admin dentro dos tetos globais definidos no ADR 0004; Admin nunca pode desativar proteções ou exceder os tetos.
- Não registre prompts ou respostas brutas em logs operacionais.
- Minimize e pseudonimize dados antes do envio ao provedor, preservando somente o contexto necessário para a análise.
- Retenha histórico de chat por 90 dias após a última atividade por padrão; permita ao Admin escolher somente os períodos aprovados no ADR 0004.
- Separe claramente fato observável, inferência e recomendação.
- Não apresente um gargalo como comprovado sem métricas operacionais.
- Prefira “potencial gargalo” ou “ponto que merece investigação”.
- Sempre que aplicável, use o contrato:

```json
{
  "finding": "...",
  "evidence": ["..."],
  "impact": "...",
  "recommendation": "...",
  "confidence": "low|medium|high"
}
```

- Valide respostas estruturadas do LLM e implemente tratamento seguro para respostas malformadas, erro e timeout.

## Processo de desenvolvimento

- Cada história de usuário deve ser uma fatia vertical: frontend, backend, persistência e testes necessários.
- Não decomponha o backlog em histórias separadas apenas por camada técnica.
- Trabalhe na ordem recomendada pelo roadmap, salvo instrução contrária.
- Faça alterações pequenas e diretamente ligadas à história atual.
- Prefira soluções simples, comprovadas e substituíveis.
- Mantenha interfaces claras entre domínio, PostgreSQL, MinIO e LLM.
- Registre erros de forma estruturada.
- Use o repositório oficial como destino do remote `origin`.
- Abra pull requests contra `mraramalho/mvp-orgmind`; não use forks ou repositórios alternativos como página oficial de revisão.

## Testes e validação

Adote TDD na seguinte ordem:

1. teste de aceitação ou comportamento da história;
2. testes de domínio e unidade;
3. implementação mínima;
4. testes de integração;
5. E2E para fluxos críticos.

Mantenha fixtures BPMN determinísticas no repositório. Antes de concluir uma alteração, execute os testes, lint e build das áreas afetadas. Se algum comando ainda não existir, informe isso claramente; não alegue que a validação foi executada.

Os comandos exatos serão adicionados quando os projetos Go e React forem inicializados. O objetivo operacional é disponibilizar comandos equivalentes a:

```text
docker compose up --build
backend: testes e lint Go
frontend: testes, lint e build TypeScript
E2E: fluxo crítico da história atual
```

## Fora do escopo atual

Não introduza no caminho crítico sem nova decisão explícita:

- GraphRAG ou Knowledge Graph dedicado;
- Neo4j ou vector database obrigatório;
- Agentic RAG complexo;
- multi-tenant completo ou autorização cross-tenant;
- Capacity como entidade operacional;
- Docling para BPMN;
- OCR ou document intelligence;
- métricas históricas avançadas de tempo e custo.

## Critério de conclusão

Uma tarefa só está concluída quando o comportamento solicitado funciona de ponta a ponta, as regras de autorização são respeitadas, os testes proporcionais ao risco passam e a documentação/configuração afetada está atualizada.
