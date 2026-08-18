# OrgMind — Especificação do Projeto

# Objetivo

O OrgMind é uma plataforma para mapeamento e análise inteligente de processos. O MVP permite ao cliente criar projetos, desenhar processos BPMN, controlar acesso aos mapeamentos e conversar com um agente de IA que analisa os processos salvos.

# Escopo do MVP

O MVP deve entregar uma experiência vertical completa:

1. Usuário autentica.
2. Usuário cria um projeto.
3. Usuário cria um processo dentro do projeto.
4. Usuário desenha o processo usando `bpmn-js` embebido.
5. Usuário salva o processo.
6. O BPMN XML é armazenado como artefato original.
7. O sistema gera uma representação Markdown derivada do BPMN.
8. Usuários autorizados podem visualizar ou editar conforme sua permissão.
9. Um processo salvo pode ser analisado pelo agente de IA.
10. O agente responde perguntas e produz insights sobre o processo.
11. Processos autorizados de um mesmo projeto podem ser comparados.

# Princípios de arquitetura

- BPMN XML é a **fonte de verdade** do processo.
- Não transformar o BPMN em Markdown antes de preservar o XML original.
- Markdown é uma representação derivada para fornecer contexto textual à IA.
- MinIO é o storage físico dos artefatos.
- PostgreSQL armazena metadados, relacionamentos, permissões, versões e referências aos artefatos.
- Backend em Go.
- Frontend em React + TypeScript.
- Editor BPMN baseado em `bpmn-js`.
- Tudo deve ser executável via Docker/Docker Compose.
- O desenvolvimento é container-only: Go, Node.js, npm, PostgreSQL, MinIO, migrations, testes, lint e builds executam em containers.
- O host requer somente Docker com Docker Compose e Git; nenhuma tecnologia da aplicação deve exigir instalação direta.
- TDD: testes de comportamento/aceitação devem orientar a implementação.
- Cada História de Usuário é uma fatia vertical completa; não criar histórias separadas de frontend ou backend.

# Arquitetura inicial

```
React + TypeScript
        │
        │ REST
        ▼
      Go API
        │
   ┌────┼─────────────┐
   ▼    ▼             ▼
Postgres MinIO      LLM API
   │    │             │
   │    │        AI Context
   │    │             │
   └────┴─────────────┘
```

# BPMN

O editor deve ser integrado diretamente à página usando `bpmn-js`.

Fluxo principal:

```
bpmn-js
   ↓
BPMN 2.0 XML
   ↓
Go API
   ↓
Validação
   ↓
MinIO
   ↓
BPMN Parser
   ↓
Markdown derivado
   ↓
MinIO
```

Para o MVP, usar `encoding/xml` do Go para o parsing inicial. Não usar Docling para BPMN. Docling poderá ser avaliado futuramente para documentos externos como PDF/DOCX.

# Storage

O arquivo físico deve ficar no MinIO. O banco guarda apenas metadados e chaves/caminhos dos artefatos.

Exemplo conceitual:

```
tenant/{tenant_id}/projects/{project_id}/processes/{process_id}/versions/{version}/
    process.bpmn
    process.md
```

O caminho físico é uma implementação de storage; o domínio deve trabalhar preferencialmente com `artifact_id`/`storage_key`, evitando acoplamento excessivo ao MinIO.

# Modelo de domínio mínimo

Entidades principais:

- User
- Project
- ProjectMember
- Process
- ProcessVersion
- Artifact
- ChatSession
- ChatMessage

Status de processo/versão:

- Draft
- In Review
- Approved
- Archived

Permissões do MVP:

- Admin
- Contributor
- Approver
- Viewer

Os papéis são atribuídos no escopo do projeto e são cumulativos. Um membro pode possuir mais de um papel.

O modelo futuro poderá evoluir para Tenant → Capacity → Workspace → Project → Artifact e autorizações cross-workspace/cross-tenant. Isso **não é requisito do MVP de duas semanas**.

# Regras de autorização

- Todo acesso a projeto/processo deve ser autorizado no backend.
- Viewer pode visualizar processos autorizados.
- Contributor pode criar/editar processos autorizados.
- Admin pode administrar membros do projeto.
- Admin pode arquivar o projeto.
- Approver pode visualizar o processo, consultar seu histórico e aprovar ou rejeitar versões em revisão.
- Admin não recebe automaticamente permissão para editar ou aprovar; essas capacidades exigem os papéis correspondentes.
- Contributor pode enviar uma versão Draft para aprovação.
- Approver não pode editar a versão submetida.
- Um usuário não pode aprovar a própria versão, mesmo quando acumula Contributor e Approver.
- Aprovação e rejeição exigem justificativa e registram usuário e data.
- Aprovação realiza a transição In Review → Approved.
- Rejeição realiza a transição In Review → Draft, preservando o histórico da decisão.
- O agente só recebe contexto de processos aos quais o usuário atual tem acesso.
- Nunca confiar somente em controles de interface para segurança.
- Uma versão aprovada não deve ser alterada; novas alterações devem gerar nova versão.

Matriz de permissões base:

| Ação | Admin | Contributor | Approver | Viewer |
|---|:---:|:---:|:---:|:---:|
| Visualizar processo | — | ✓ | ✓ | ✓ |
| Criar processo | — | ✓ | — | — |
| Editar versão Draft | — | ✓ | — | — |
| Enviar para aprovação | — | ✓ | — | — |
| Aprovar ou rejeitar | — | — | ✓ | — |
| Administrar membros | ✓ | — | — | — |
| Arquivar projeto | ✓ | — | — | — |

As permissões efetivas são a união dos papéis atribuídos, limitada por regras contextuais como a proibição de autoaprovação. A decisão completa está em `docs/adr/0003-project-roles-and-process-approval.md`.

# Autenticação e ciclo de sessão

- O access token é um JWT de curta duração, válido por 10 minutos.
- O access JWT é enviado exclusivamente em cookie `HttpOnly`, `Secure` e `SameSite=Lax`, sem atributo `Domain`.
- O refresh token é opaco, gerado com aleatoriedade criptograficamente segura e nunca é armazenado em texto puro no banco.
- O PostgreSQL armazena o hash do refresh token, a sessão, a família de tokens, expirações e estado de revogação.
- O refresh token é rotacionado a cada uso por `POST /auth/refresh`; o token anterior é invalidado imediatamente.
- A reutilização de um refresh token já consumido revoga toda a família da sessão.
- A sessão expira após 7 dias de inatividade e possui duração absoluta máxima de 30 dias.
- Logout normal revoga a sessão atual; logout global, troca/recuperação de senha, desativação da conta ou suspeita de comprometimento revogam todas as sessões do usuário.
- Access e refresh tokens não podem ser armazenados em `localStorage` nem expostos ao JavaScript.
- Operações que alteram estado devem ter proteção CSRF, incluindo validação de origem e token CSRF.
- O access JWT identifica usuário e sessão, mas a autorização atual do recurso deve ser validada no backend.

A decisão completa está registrada em `docs/adr/0001-authentication-session-lifecycle.md`.

## Política de senha e recuperação de acesso

- Senhas devem ter no mínimo 15 caracteres e o sistema deve aceitar pelo menos 64 caracteres, incluindo espaços e Unicode.
- Não exigir regras artificiais de composição nem troca periódica sem evidência de comprometimento.
- Permitir colagem e uso de gerenciadores de senha.
- Bloquear senhas comuns, comprometidas ou relacionadas ao usuário ou ao produto.
- Armazenar senhas com Argon2id, salt aleatório individual e parâmetros versionados junto ao hash.
- Parâmetros iniciais: 64 MiB de memória, 3 iterações e paralelismo 2, calibrados no ambiente real para aproximadamente 100–250 ms.
- Login e recuperação não devem revelar se uma conta existe, está inativa ou não possui senha.
- Recuperação usa token opaco de 256 bits, armazena somente seu hash, expira em 30 minutos e permite um único uso.
- Solicitar novo token invalida os tokens de recuperação anteriores ainda ativos.
- Redefinir a senha revoga todas as sessões do usuário, não realiza login automático e gera notificação de segurança.
- Login e recuperação devem aplicar rate limiting por conta e por origem, sem bloqueio permanente explorável para negação de serviço.

A decisão completa está registrada em `docs/adr/0002-password-and-account-recovery.md`.

# Agente de IA

O agente inicialmente não precisa de GraphRAG.

Pipeline:

```
BPMN XML
   ↓
Parser
   ↓
Process Model
   ↓
Markdown estruturado
   ↓
Context Builder
   ↓
LLM
   ↓
Resposta estruturada
```

O agente deve conseguir responder inicialmente:

- resumo do processo;
- potenciais gargalos;
- sugestões de melhoria;
- atividades potencialmente redundantes;
- atividades que aparentam não agregar valor;
- inconsistências no processo;
- redundâncias/inconsistências entre processos autorizados.

# Regras para análise de IA

O agente deve separar:

1. **Fato observável** no BPMN/documentação.
2. **Inferência** baseada na estrutura do processo.
3. **Recomendação** de melhoria.

Não afirmar que uma atividade é um gargalo real quando o BPMN não contém métricas operacionais. Usar termos como **potencial gargalo** ou **ponto que merece investigação** quando apropriado.

As respostas estruturadas devem, sempre que possível, conter:

```json
{
  "finding": "...",
  "evidence": ["..."],
  "impact": "...",
  "recommendation": "...",
  "confidence": "low|medium|high"
}
```

## Modelo, limites e governança

- OpenAI é o primeiro provedor e `gpt-4o-mini` é o modelo inicial de demonstração.
- O domínio e os casos de uso dependem de interfaces; detalhes do SDK e do provedor ficam na infraestrutura.
- Limites padrão por análise: 32.000 tokens de entrada, 1.500 de saída e timeout total de 60 segundos.
- Em falhas transitórias, executar no máximo duas novas tentativas com backoff exponencial e jitter.
- Não repetir erros de autenticação, autorização, validação ou outros erros não transitórios.
- Limites padrão: 10 requisições por minuto e 100 por hora por usuário; concorrência máxima de 2 por usuário e 5 por projeto.
- Comparações incluem no máximo 5 processos por padrão.
- Admin pode configurar consumo, concorrência, retenção e orçamento dentro dos tetos globais da plataforma.
- Alterações administrativas registram ator, projeto, valores anterior e novo e data.
- Histórico de chat é retido por 90 dias após a última atividade por padrão.
- Prompts e respostas brutas não são armazenados em logs operacionais.
- O Context Builder minimiza e pseudonimiza dados antes do envio, sem destruir informações necessárias à análise.
- Exclusões removem dados do banco ativo e devem expirar dos backups em até 30 dias.

A decisão completa está em `docs/adr/0004-ai-runtime-limits-and-data-governance.md`.

# Chat

O chat deve estar associado ao processo e à sessão do usuário.

O agente deve receber:

- processo salvo;
- versão do processo;
- Markdown derivado;
- metadados relevantes;
- outros processos somente quando explicitamente solicitados e autorizados.

O histórico de conversa deve ser persistido.

# Comparação entre processos

Para comparação:

```
Processo A ─┐
            ├─ Context Builder ─→ LLM
Processo B ─┘
```

O agente deve apontar os processos envolvidos nas evidências e diferenciar:

- atividade equivalente;
- diferença de fluxo;
- redundância potencial;
- inconsistência potencial.

# Testes

A regra de desenvolvimento é **TDD**.

Prioridade:

1. Teste de aceitação da História de Usuário.
2. Testes de domínio/unidade.
3. Implementação.
4. Testes de integração.
5. Testes E2E para fluxos críticos.

Fixtures BPMN devem ser mantidas no repositório para testes determinísticos.

# Histórias de Usuário

Cada US deve entregar algo que o usuário consiga usar de ponta a ponta.

Não criar:

- US somente de frontend;
- US somente de backend;
- US somente de banco;
- US somente de infraestrutura.

Esses elementos são **itens de trabalho dentro de uma US**.

# Fora do MVP

Não introduzir no caminho crítico:

- GraphRAG;
- Knowledge Graph dedicado;
- Neo4j;
- Agentic RAG complexo;
- vector database obrigatório;
- multi-tenant completo;
- autorização cross-tenant;
- Capacity como entidade operacional;
- análise histórica avançada;
- métricas reais de tempo/custo;
- Docling para BPMN.

Esses itens podem ser considerados na evolução pós-MVP.

# Regras de engenharia

- Preferir soluções simples e comprovadas.
- Não reinventar componentes que já existem.
- Manter interfaces claras entre domínio, storage e provider de IA.
- LLM provider deve ser abstraído por interface para facilitar troca de modelo/provedor.
- Evitar acoplamento do domínio ao PostgreSQL, MinIO ou fornecedor de LLM.
- Validar entradas no backend.
- Registrar erros de forma estruturada.
- Não armazenar segredos no código.
- Configuração por variáveis de ambiente.
- Docker Compose deve reproduzir o ambiente de desenvolvimento.
- Todos os comandos de desenvolvimento e validação devem ser documentados via `docker compose`, sem assumir runtimes ou ferramentas instalados no host.

# Critério de pronto do MVP

O MVP é considerado funcional quando um usuário consegue, sem intervenção manual do desenvolvedor:

- autenticar;
- criar projeto;
- criar processo;
- desenhar BPMN;
- salvar processo;
- reabrir processo;
- visualizar processo como Viewer;
- conceder acesso a outro usuário;
- abrir o chat do processo salvo;
- solicitar resumo;
- solicitar potenciais gargalos;
- solicitar melhorias;
- solicitar redundâncias/atividades sem valor aparente;
- comparar processos autorizados;
- executar tudo via Docker Compose.

# Prioridade

A prioridade é **entregar valor demonstrável em duas semanas**, não construir a arquitetura definitiva da plataforma. Toda decisão técnica deve ser avaliada pela pergunta:

> Isso aumenta o valor entregue ao usuário dentro do prazo do MVP?
>

Se a resposta for não, deve ser postergado.
