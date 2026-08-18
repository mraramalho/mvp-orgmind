# OrgMind — Roadmap e Backlog do MVP (2 semanas)

# Objetivo do MVP

Entregar em duas semanas uma versão utilizável do OrgMind na qual o cliente consegue criar projetos, desenhar e salvar processos BPMN, controlar acesso por projeto e conversar com um agente de IA capaz de analisar processos e gerar insights.

## Princípios

- Cada História de Usuário é uma fatia vertical completa: frontend + backend + persistência + testes necessários.
- TDD: testes de aceitação/comportamento antes da implementação.
- BPMN XML é a fonte de verdade do processo.
- MinIO armazena os artefatos físicos; PostgreSQL armazena metadados e referências.
- Markdown é um artefato derivado para fornecer contexto textual ao agente.
- GraphRAG, Knowledge Graph e vector search ficam fora do caminho crítico do MVP.
- O agente deve distinguir fatos observáveis no processo de inferências/sugestões.

# Especificações do MVP

[OrgMind — Especificação do Projeto](https://app.notion.com/p/OrgMind-Especifica-o-do-Projeto-3be280c8a1b7819d96e7ce30ae5c8d8b?pvs=21)

# Roadmap

## Épico 1 — Fundação e execução local

**Objetivo:** ter uma aplicação executável, testável e containerizada.

### US01 — Executar o OrgMind localmente

Como desenvolvedor, quero subir frontend, backend, PostgreSQL e MinIO com Docker Compose para ter um ambiente reproduzível.

Todo o desenvolvimento desta história é container-only. O host não deve precisar de Go, Node.js, npm, PostgreSQL, MinIO ou ferramentas auxiliares instaladas diretamente.

**Itens de trabalho**

- [x]  Definir estrutura de diretórios do monorepo (backend/, frontend/, infra/, docs/).
- [x]  Inicializar módulo Go (go.mod) no backend.
- [x]  Inicializar projeto frontend (Vite + React + TypeScript).
- [x]  Criar Dockerfile do backend (build multi-stage).
- [x]  Criar Dockerfile do frontend.
- [x]  Criar docker-compose.yml com serviços backend, frontend, postgres e minio.
- [x]  Criar targets/serviços para executar npm, Go, testes, lint e build exclusivamente em containers; migrations e seeds seguirão o mesmo padrão quando forem introduzidos na US02.
- [x]  Configurar volumes nomeados para caches de dependências, sem reutilizar `node_modules` ou caches globais do host.
- [x]  Configurar volumes persistentes para postgres e minio no compose.
- [x]  Implementar endpoint `GET /health` no backend Go retornando status e versão.
- [x]  Criar chamada de smoke-check no frontend consultando `/health`.
- [x]  Criar arquivo `.env.example` com todas as variáveis necessárias.
- [x]  Implementar carregamento de variáveis de ambiente no backend (ex: viper/godotenv).
- [x]  Criar teste automatizado que sobe os containers via compose e valida o `/health`.
- [x]  Validar e documentar o bootstrap em uma máquina contendo apenas Docker Compose e Git.

### US02 — Persistir dados do MVP

Como sistema, quero persistir usuários, projetos, processos, versões, permissões e mensagens para manter o estado da aplicação.

**Itens de trabalho**

- [ ]  Desenhar diagrama ER com as 8 entidades da especificação.
- [ ]  Escolher ferramenta de migration (ex: golang-migrate).
- [ ]  Criar migration da tabela users.
- [ ]  Criar migration da tabela projects.
- [ ]  Criar migration da tabela project_members e da atribuição cumulativa de papéis por projeto.
- [ ]  Criar migration da tabela processes.
- [ ]  Criar migration da tabela process_versions.
- [ ]  Criar migration da tabela artifacts.
- [ ]  Criar migration da tabela chat_sessions.
- [ ]  Criar migration da tabela chat_messages.
- [ ]  Definir interface de repositório por entidade (Go).
- [ ]  Implementar repositório concreto por entidade (pgx/sqlx).
- [ ]  Criar teste de integração por repositório (testcontainers).
- [ ]  Criar seed com admin, projeto exemplo e processo exemplo.

---

## Épico 2 — Usuários e autorização

**Objetivo:** garantir que somente usuários autorizados visualizem e editem projetos/processos.

### US03 — Entrar no OrgMind

Como usuário, quero autenticar no sistema para acessar somente os recursos permitidos.

**Itens de trabalho**

- [ ]  Implementar a estratégia definida nos ADRs 0001 e 0002.
- [ ]  Implementar hashing de senha com Argon2id e rehash quando os parâmetros ficarem obsoletos.
- [ ]  Implementar bloqueio de senhas comuns ou comprometidas.
- [ ]  Criar endpoint `POST /auth/login` com resposta neutra para credenciais inválidas.
- [ ]  Implementar access JWT de 10 minutos e refresh token opaco rotativo.
- [ ]  Criar endpoints `POST /auth/refresh` e `POST /auth/logout`.
- [ ]  Criar persistência de sessões, famílias e hashes de refresh tokens.
- [ ]  Criar `POST /auth/password-recovery` com resposta neutra e envio assíncrono.
- [ ]  Criar `POST /auth/password-reset` com token opaco, uso único e validade de 30 minutos.
- [ ]  Revogar todas as sessões após recuperação de senha e enviar notificação de segurança.
- [ ]  Aplicar rate limiting por conta e origem em login, refresh e recuperação.
- [ ]  Implementar proteção CSRF nas operações autenticadas que alteram estado.
- [ ]  Criar middleware Go de validação de JWT com injeção do usuário no contexto da requisição.
- [ ]  Proteger rotas privadas com o middleware de autenticação.
- [ ]  Criar tela de login no frontend.
- [ ]  Implementar cookies `HttpOnly`, `Secure` e `SameSite=Lax`, sem armazenamento de tokens no JavaScript.
- [ ]  Criar teste unitário de hashing de senha.
- [ ]  Criar teste do endpoint de login (sucesso e falha).
- [ ]  Criar testes de rotação, reutilização e revogação de refresh token.
- [ ]  Criar testes de enumeração, rate limiting e recuperação de senha.
- [ ]  Criar teste do middleware (token válido, inválido e ausente).
- [ ]  Criar teste E2E do fluxo de login.

### US04 — Administrar acesso a um projeto

Como administrador, quero atribuir um ou mais papéis de Viewer, Contributor, Approver ou Admin a membros do projeto para controlar suas capacidades.

**Itens de trabalho**

- [ ]  Criar membership de projeto.
- [ ]  Implementar papéis cumulativos Admin, Contributor, Approver e Viewer no escopo do projeto.
- [ ]  Implementar a matriz de permissões do ADR 0003.
- [ ]  Garantir que Admin não herde implicitamente edição ou aprovação.
- [ ]  Criar endpoints de concessão/revogação.
- [ ]  Criar interface de gerenciamento de membros.
- [ ]  Aplicar autorização nas APIs de projeto/processo.
- [ ]  Criar testes de autorização por papel, combinação de papéis e projeto.

---

## Épico 3 — Projetos e organização dos processos

**Objetivo:** permitir que o cliente organize seus mapeamentos.

### US05 — Criar e gerenciar projetos

Como cliente, quero criar projetos para organizar meus mapeamentos de processos.

**Itens de trabalho**

- [ ]  Criar projeto.
- [ ]  Listar projetos acessíveis.
- [ ]  Visualizar projeto.
- [ ]  Editar nome/descrição.
- [ ]  Arquivar projeto.
- [ ]  Criar tela de projetos.
- [ ]  Criar testes de aceitação.

### US06 — Criar um processo dentro de um projeto

Como cliente, quero criar um processo dentro de um projeto para iniciar seu mapeamento.

**Itens de trabalho**

- [ ]  Criar entidade processo.
- [ ]  Associar processo ao projeto.
- [ ]  Criar status inicial do processo.
- [ ]  Criar tela de processos do projeto.
- [ ]  Criar fluxo de criação de processo.
- [ ]  Criar testes de aceitação.

---

## Épico 4 — Editor e ciclo de vida BPMN

**Objetivo:** entregar a principal ferramenta de mapeamento.

### US07 — Desenhar um processo BPMN

Como Contributor, quero desenhar meu processo usando um editor BPMN integrado para criar o mapa do processo.

**Itens de trabalho**

- [ ]  Integrar bpmn-js embebido na aplicação.
- [ ]  Criar toolbar/editor.
- [ ]  Criar novo diagrama BPMN.
- [ ]  Permitir adicionar tarefas, eventos, gateways, pools/lanes e fluxos essenciais.
- [ ]  Carregar BPMN existente.
- [ ]  Testar criação e edição do diagrama.

### US08 — Salvar uma versão do processo

Como Contributor, quero salvar meu mapeamento para que o processo possa ser consultado posteriormente e utilizado pelo agente de IA.

**Itens de trabalho**

- [ ]  Exportar BPMN XML do bpmn-js.
- [ ]  Criar validação de XML contra o schema BPMN 2.0 antes do upload.
- [ ]  Armazenar XML original no MinIO.
- [ ]  Persistir metadados da versão no PostgreSQL.
- [ ]  Implementar versionamento básico.
- [ ]  Criar testes de integração.

### US09 — Visualizar um processo salvo

Como Viewer, quero visualizar um processo salvo sem poder editá-lo.

**Itens de trabalho**

- [ ]  Criar modo somente leitura do bpmn-js.
- [ ]  Carregar versão salva do MinIO.
- [ ]  Aplicar autorização de leitura.
- [ ]  Bloquear operações de edição para Viewer.
- [ ]  Criar teste E2E de visualização.

### US10 — Aprovar um processo

Como Approver, quero aprovar ou rejeitar uma versão enviada para revisão para identificar qual versão está oficialmente aprovada.

**Itens de trabalho**

- [ ]  Criar estados Draft, In Review, Approved e Archived.
- [ ]  Permitir que Contributor envie uma versão Draft para aprovação.
- [ ]  Permitir que Approver aprove ou rejeite somente versões In Review.
- [ ]  Impedir que o autor aprove a própria versão, mesmo acumulando o papel Approver.
- [ ]  Bloquear edição da versão enquanto estiver In Review.
- [ ]  Exigir justificativa para aprovação e rejeição.
- [ ]  Registrar usuário, data, decisão e justificativa no histórico.
- [ ]  Implementar transição In Review → Approved para aprovação.
- [ ]  Implementar transição In Review → Draft para rejeição, preservando o histórico.
- [ ]  Bloquear edição da versão aprovada.
- [ ]  Criar testes de transição, autorização, acumulação de papéis e autoaprovação.

---

## Épico 5 — Preparação do conhecimento para IA

**Objetivo:** transformar o BPMN salvo em contexto compreensível pelo agente sem introduzir complexidade desnecessária.

### US11 — Gerar representação textual do processo

Como sistema, quero transformar o BPMN salvo em Markdown estruturado para fornecer contexto ao agente.

**Itens de trabalho**

- [ ]  Implementar parser BPMN XML em Go com encoding/xml.
- [ ]  Extrair atividades, eventos, gateways e fluxos.
- [ ]  Extrair participantes/lanes quando disponíveis.
- [ ]  Gerar Markdown determinístico.
- [ ]  Armazenar Markdown derivado no MinIO.
- [ ]  Registrar status da geração.
- [ ]  Criar testes unitários com BPMNs representativos.

### US12 — Disponibilizar contexto do processo ao agente

Como agente, quero receber o processo salvo em um formato estruturado para analisá-lo.

**Itens de trabalho**

- [ ]  Criar Context Builder.
- [ ]  Carregar Markdown da versão autorizada.
- [ ]  Incluir metadados relevantes do processo.
- [ ]  Limitar contexto ao projeto/processo autorizado.
- [ ]  Criar testes garantindo isolamento entre projetos.

---

## Épico 6 — Agente de IA e chat

**Objetivo:** transformar os processos em uma experiência de análise assistida por IA.

### US13 — Conversar com o agente sobre um processo

Como cliente, quero conversar com um agente sobre um processo salvo para fazer perguntas e obter respostas contextualizadas.

**Itens de trabalho**

- [ ]  Integrar provider de LLM por interface abstrata.
- [ ]  Implementar OpenAI com `gpt-4o-mini` como primeira implementação concreta.
- [ ]  Criar prompt base do agente.
- [ ]  Criar sessão de chat.
- [ ]  Persistir mensagens.
- [ ]  Criar endpoint de chat.
- [ ]  Implementar tratamento de erro/timeout na chamada ao LLM.
- [ ]  Implementar timeout, tentativas e classificação de erros conforme ADR 0004.
- [ ]  Implementar rate limiting e concorrência por usuário e projeto.
- [ ]  Implementar configuração administrativa limitada por tetos globais.
- [ ]  Implementar orçamento mensal por projeto, alerta em 80% e bloqueio/controle em 100%.
- [ ]  Implementar minimização e pseudonimização no Context Builder.
- [ ]  Garantir que logs não armazenem prompts ou respostas brutas.
- [ ]  Implementar retenção e exclusão do histórico de chat.
- [ ]  Criar interface de chat integrada ao visualizador BPMN.
- [ ]  Garantir que o agente só receba processos salvos e autorizados.
- [ ]  Criar testes de autorização e integração.
- [ ]  Criar testes de limites, tentativas, concorrência, retenção e remoção de dados sensíveis.

### US14 — Gerar resumo do processo

Como cliente, quero solicitar um resumo do processo para entender rapidamente seu objetivo, etapas e decisões.

**Itens de trabalho**

- [ ]  Criar prompt de resumo.
- [ ]  Definir schema JSON da resposta estruturada.
- [ ]  Implementar parsing/validação da resposta do LLM contra o schema, com fallback para resposta malformada.
- [ ]  Exibir resumo na interface.
- [ ]  Criar teste com fixture BPMN.

### US15 — Identificar potenciais gargalos

Como cliente, quero identificar potenciais gargalos para encontrar pontos que merecem investigação.

**Itens de trabalho**

- [ ]  Criar prompt de diagnóstico de gargalos.
- [ ]  Exigir evidências observáveis no processo.
- [ ]  Diferenciar potencial gargalo de gargalo comprovado.
- [ ]  Implementar parsing/validação da resposta do LLM contra o schema JSON (finding/evidence/impact/recommendation/confidence), com fallback para resposta malformada.
- [ ]  Exibir atividade, evidência e nível de confiança.
- [ ]  Criar teste com processo contendo múltiplos caminhos/aprovações.

### US16 — Sugerir melhorias

Como cliente, quero receber sugestões de melhoria para identificar oportunidades de simplificação do processo.

**Itens de trabalho**

- [ ]  Criar prompt de melhoria.
- [ ]  Exigir justificativa para cada sugestão.
- [ ]  Separar observação de recomendação.
- [ ]  Implementar parsing/validação da resposta do LLM contra o schema JSON, com fallback para resposta malformada.
- [ ]  Exibir sugestões categorizadas.
- [ ]  Criar teste de aceitação.

### US17 — Identificar atividades redundantes ou sem valor aparente

Como cliente, quero identificar atividades potencialmente redundantes ou que aparentam não agregar valor para direcionar uma revisão do processo.

**Itens de trabalho**

- [ ]  Criar prompt de redundância.
- [ ]  Criar prompt de atividades sem valor aparente.
- [ ]  Pedir evidência textual/estrutural.
- [ ]  Evitar afirmações categóricas quando o BPMN não fornece evidência suficiente.
- [ ]  Implementar parsing/validação da resposta do LLM contra o schema JSON, com fallback para resposta malformada.
- [ ]  Criar testes com processos de exemplo.

### US18 — Identificar inconsistências entre processos

Como cliente, quero comparar processos de um projeto para identificar inconsistências e redundâncias entre mapeamentos.

**Itens de trabalho**

- [ ]  Selecionar dois ou mais processos autorizados.
- [ ]  Construir contexto comparativo.
- [ ]  Criar prompt de comparação.
- [ ]  Identificar atividades equivalentes, divergências e possíveis redundâncias.
- [ ]  Implementar parsing/validação da resposta do LLM contra o schema JSON, com fallback para resposta malformada.
- [ ]  Exibir evidências apontando os processos envolvidos.
- [ ]  Criar teste de comparação.

---

## Épico 7 — Qualidade, segurança e entrega

**Objetivo:** tornar o MVP demonstrável e confiável.

### US19 — Garantir cobertura de testes do fluxo principal

Como equipe de desenvolvimento, quero validar os fluxos críticos do produto para reduzir regressões antes da entrega.

**Itens de trabalho**

- [ ]  Testes unitários do domínio.
- [ ]  Testes de integração API + PostgreSQL + MinIO.
- [ ]  Testes de autorização.
- [ ]  Testes E2E dos fluxos principais.
- [ ]  Fixtures BPMN para testes.
- [ ]  Testes dos prompts/contratos estruturados do agente.

### US20 — Entregar ambiente reproduzível de demonstração

Como equipe, quero subir o MVP com um comando para realizar uma demonstração consistente.

**Itens de trabalho**

- [ ]  Docker Compose final.
- [ ]  Seed com 2 processos demonstrativos: um simples e um com gargalo evidente.
- [ ]  Configuração de LLM por variável de ambiente.
- [ ]  README de execução.
- [ ]  Script de inicialização.
- [ ]  Checklist de demo.

# Ordem de execução recomendada

**Semana 1**

1. US01 — Fundação
2. US02 — Persistência
3. US03 — Autenticação
4. US05 — Projetos
5. US06 — Processos
6. US07 — Editor BPMN
7. US08 — Salvar versão
8. US09 — Visualização

**Semana 2**

1. US04 — Acesso por projeto
2. US10 — Aprovação
3. US11 — BPMN → Markdown
4. US12 — Context Builder
5. US13 — Chat com agente
6. US14 — Resumo
7. US15 — Gargalos
8. US16 — Melhorias
9. US17 — Redundâncias/sem valor
10. US18 — Comparação entre processos
11. US19 — Testes e hardening
12. US20 — Demo/release

# Fora do MVP de duas semanas

- GraphRAG.
- Knowledge Graph dedicado.
- Digraph.
- Agentic RAG complexo.
- Multi-tenant completo com autorização cross-tenant.
- Capacity como entidade operacional.
- Vector database como requisito obrigatório.
- OCR/document intelligence.
- Docling no caminho BPMN.
- Métricas reais de tempo/custo para comprovar gargalos.
- Análise histórica avançada de versões.

# Critério de sucesso do MVP

O MVP está pronto quando um usuário consegue:

1. entrar no sistema;
2. criar um projeto;
3. criar um processo;
4. desenhar o processo no bpmn-js;
5. salvar uma versão;
6. visualizar a versão posteriormente;
7. autorizar outro usuário a visualizar/editar o projeto;
8. abrir o chat do processo salvo;
9. pedir resumo, gargalos, melhorias, redundâncias e atividades sem valor aparente;
10. comparar processos autorizados do mesmo projeto e obter possíveis inconsistências.

A entrega deve funcionar integralmente via Docker e possuir testes automatizados para os fluxos críticos.

[OrgMind — Especificação do Projeto](https://app.notion.com/p/OrgMind-Especifica-o-do-Projeto-3be280c8a1b7819d96e7ce30ae5c8d8b?pvs=21)
