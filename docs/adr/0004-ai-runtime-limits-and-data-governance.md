# ADR 0004 — Limites de IA e governança de dados

- Status: aceito
- Data: 2026-08-17

## Contexto

O agente do OrgMind analisa processos que podem conter informações internas, dados pessoais e grande volume de contexto. O MVP precisa de comportamento previsível quanto a custo, latência, concorrência e privacidade, sem acoplar o domínio a um único fornecedor.

## Decisão

### Provedor e modelo

- OpenAI é a primeira implementação concreta.
- `gpt-4o-mini` é o modelo inicial da demonstração.
- Domínio e casos de uso dependem de interfaces próprias.
- SDK, payloads, autenticação e erros específicos da OpenAI permanecem na camada de infraestrutura.
- A seleção de modelo deve ser configuração validada, não constante espalhada pelo código.

### Limites por análise

| Configuração | Padrão | Faixa permitida ao Admin | Teto global |
|---|---:|---:|---:|
| Tokens de entrada | 32.000 | 8.000–64.000 | 64.000 |
| Tokens de saída | 1.500 | 256–4.000 | 4.000 |
| Timeout total | 60 s | 15–90 s | 90 s |
| Requisições/minuto/usuário | 10 | 1–30 | 30 |
| Requisições/hora/usuário | 100 | 10–300 | 300 |
| Concorrência por usuário | 2 | 1–3 | 3 |
| Concorrência por projeto | 5 | 1–10 | 10 |
| Processos por comparação | 5 | 2–10 | 10 |

Os tetos globais são controlados pela plataforma. Configurações de projeto nunca podem ultrapassá-los nem desativar controles de segurança.

### Orçamento

- Admin pode definir cota mensal de tokens por projeto.
- Alertar Admins ao alcançar 80% da cota.
- Ao alcançar 100%, bloquear novas análises ou exigir liberação administrativa conforme a política global.
- Registrar consumo de entrada e saída por chamada, usuário, projeto, modelo e finalidade.
- Metadados de consumo não incluem o conteúdo bruto do prompt ou da resposta.

### Timeout e tentativas

- Timeout total padrão de 60 segundos.
- No máximo duas novas tentativas além da original.
- Usar backoff exponencial com jitter, aproximadamente 1 segundo e depois 2–4 segundos.
- Repetir somente HTTP 429, erros 5xx, timeout e falhas transitórias de rede.
- Não repetir autenticação, autorização, validação, excesso de contexto ou outros erros 4xx não transitórios.
- O Admin pode escolher zero, uma ou duas novas tentativas, sem alterar o algoritmo ou superar o teto.
- Evitar duplicação de chamadas e cobranças com identificador de operação e coordenação de tentativas.

### Rate limiting e concorrência

- Aplicar limites por usuário e por projeto, além dos limites do provedor.
- As camadas são: teto global, configuração do projeto e limite efetivo do usuário.
- Atingir o limite retorna erro estruturado com orientação e tempo razoável para nova tentativa quando disponível.
- Mudanças administrativas registram ator, projeto, valor anterior, valor novo e data.

## Retenção

Retenção define por quanto tempo o OrgMind mantém os dados em seus próprios sistemas.

| Categoria | Padrão |
|---|---:|
| Histórico visível do chat | 90 dias após a última atividade |
| Metadados técnicos sem conteúdo | 30 dias |
| Logs de erro sem conteúdo bruto | 30 dias |
| Auditoria administrativa e de segurança | 1 ano |
| Prompts e respostas em logs | Não armazenar |
| Dados excluídos no banco ativo | Remoção imediata |
| Cópias remanescentes em backups | Expiração em até 30 dias |

Admin pode configurar o histórico do chat para 30, 90 ou 180 dias, ou até a exclusão do projeto. Admin não pode reduzir retenção obrigatória de auditoria nem habilitar conteúdo bruto em logs.

Excluir chat ou projeto remove o conteúdo do banco ativo e agenda a expiração das cópias em backups. Restrições legais futuras podem exigir suspensão de exclusão, mas precisam de decisão explícita e auditável.

## Minimização e pseudonimização

O Context Builder deve enviar apenas o necessário para responder à solicitação:

- remover e-mails, documentos pessoais, telefones, tokens, credenciais e identificadores desnecessários;
- substituir nomes de pessoas e clientes por identificadores estáveis quando a identidade não for relevante;
- nunca incluir dados de processos ou usuários não autorizados;
- selecionar trechos relevantes em vez de enviar todo o histórico indiscriminadamente;
- preservar nomes de atividades e informações indispensáveis à análise;
- não alegar anonimização completa quando a reidentificação ainda for possível.

O termo operacional adotado é “minimização e pseudonimização”. Anonimização irreversível só deve ser declarada quando tecnicamente comprovada.

## Observabilidade e auditoria

Logs podem conter:

- identificador da operação;
- usuário e projeto por identificadores internos;
- modelo e provedor;
- tokens de entrada e saída;
- duração, status e categoria de erro;
- quantidade de tentativas.

Logs não contêm prompt, resposta, BPMN XML, Markdown derivado, cookie, token, credencial ou dado pessoal bruto.

## Consequências

### Positivas

- Custos e latência previsíveis.
- Configuração administrativa sem remover proteções globais.
- Menor exposição de informações sensíveis.
- Troca futura de provedor preservada por interfaces.
- Regras verificáveis de retenção e exclusão.

### Custos

- Necessidade de medição de tokens e controle distribuído de concorrência.
- Jobs periódicos para retenção e exclusão.
- Pseudonimização requer testes para não degradar a análise.
- Orçamento e auditoria adicionam persistência operacional.

## Referências

- [OpenAI Docs — GPT-4o mini](https://developers.openai.com/api/docs/models/gpt-4o-mini)
- [OpenAI Docs — Rate limits](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI Docs — Your data](https://platform.openai.com/docs/guides/your-data)
