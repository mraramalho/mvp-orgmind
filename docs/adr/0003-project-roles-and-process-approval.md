# ADR 0003 — Papéis de projeto e aprovação de processos

- Status: aceito
- Data: 2026-08-17

## Contexto

O modelo inicial previa Admin, Contributor e Viewer, mas a história de aprovação usava o termo indefinido “responsável pelo projeto”. O produto precisa de uma capacidade explícita de aprovação, segregação entre autoria e aprovação e suporte a pessoas que desempenham mais de uma função no mesmo projeto.

## Decisão

Os papéis são atribuídos no escopo do projeto e são cumulativos. Um `ProjectMember` pode ter zero ou mais atribuições de papel ativas entre Admin, Contributor, Approver e Viewer.

### Matriz base

| Ação | Admin | Contributor | Approver | Viewer |
|---|:---:|:---:|:---:|:---:|
| Visualizar processo | — | ✓ | ✓ | ✓ |
| Criar processo | — | ✓ | — | — |
| Editar versão Draft | — | ✓ | — | — |
| Enviar para aprovação | — | ✓ | — | — |
| Aprovar ou rejeitar | — | — | ✓ | — |
| Administrar membros | ✓ | — | — | — |
| Arquivar projeto | ✓ | — | — | — |

As permissões efetivas são a união dos papéis. Admin é um papel administrativo e não herda implicitamente visualização, contribuição ou aprovação. Quando uma pessoa precisar dessas capacidades, deve receber também os papéis correspondentes.

### Regras contextuais

- Todo controle é aplicado no backend.
- O usuário só atua dentro do projeto em que recebeu o papel.
- Um usuário nunca aprova uma versão de sua própria autoria, mesmo acumulando Contributor e Approver.
- Approver visualiza o processo e o histórico necessários à decisão, mas não edita a versão submetida.
- Versões In Review ficam bloqueadas para edição.
- Versões Approved são imutáveis.
- Alterar um processo aprovado exige nova versão Draft.
- Remover um papel afeta novas operações imediatamente e não apaga o histórico anterior.

### Estados e transições

```text
Draft --enviar--> In Review --aprovar--> Approved
                         |
                         `--rejeitar--> Draft

Draft/In Review/Approved --arquivar--> Archived
```

- Contributor envia Draft para In Review.
- Approver aprova ou rejeita somente uma versão In Review.
- Aprovação e rejeição exigem justificativa.
- Cada decisão registra versão, projeto, decisão, justificativa, usuário e data.
- Rejeição preserva integralmente o histórico e devolve a versão para Draft.

### Persistência

A implementação deve representar atribuições cumulativas sem coluna de papel único em `project_members`. A solução relacional esperada é uma associação equivalente a `project_member_roles`, com unicidade por membro e papel.

O histórico de aprovação deve ser append-only no uso normal. Ele precisa distinguir envio, aprovação e rejeição, incluindo o ator e a justificativa.

### Administração

- Admin atribui e revoga papéis de membros do projeto.
- A API deve impedir que um projeto fique sem nenhum Admin ativo.
- A interface deve mostrar claramente quando um membro acumula papéis.
- Concessão e revogação de papel devem ser auditáveis.

## Consequências

### Positivas

- Responsabilidade de aprovação explícita.
- Segregação entre autoria e aprovação.
- Flexibilidade para equipes pequenas acumularem funções.
- Permissões administrativas não concedem acesso implícito ao conteúdo.
- Histórico verificável das decisões.

### Custos

- Associação adicional para múltiplos papéis.
- Autorização precisa combinar papéis e regras contextuais.
- Testes precisam cobrir combinações, revogação e autoaprovação.
- Fluxo de aprovação requer histórico persistente.
