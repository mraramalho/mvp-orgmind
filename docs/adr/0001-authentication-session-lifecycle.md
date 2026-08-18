# ADR 0001 — Ciclo de autenticação e sessão

- Status: aceito
- Data: 2026-08-17

## Contexto

O OrgMind usa uma SPA React e uma API Go. O MVP precisa autenticar usuários sem expor tokens ao JavaScript, permitir renovação segura, revogar sessões comprometidas e proteger requisições autenticadas enviadas automaticamente pelo navegador.

Um único JWT de longa duração dificulta revogação e amplia o impacto de vazamentos. Cookies `HttpOnly` reduzem a exposição direta a JavaScript, mas exigem proteção específica contra CSRF.

## Decisão

Usar dois níveis de credencial:

1. access token JWT de curta duração;
2. refresh token opaco, rotativo e associado a uma sessão persistida no PostgreSQL.

### Access token

- Validade: 10 minutos.
- Claims mínimas: `sub`, `sid`, `iss`, `aud`, `iat` e `exp`.
- Não armazenar permissões completas ou dados sensíveis no JWT.
- Validar assinatura, algoritmo permitido, expiração, issuer, audience e sessão.
- A autorização do projeto/processo continua sendo validada no backend.

Cookie de produção:

```http
Set-Cookie: __Host-orgmind-access=<jwt>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600
```

### Refresh token

- Não é JWT.
- Gerado com fonte criptograficamente segura.
- Validade por inatividade: 7 dias.
- Duração absoluta da sessão: 30 dias.
- Somente o hash é armazenado no PostgreSQL.
- Associado a `user_id`, `session_id`, família, criação, último uso, expirações e revogação.
- Rotacionado em toda chamada bem-sucedida a `POST /auth/refresh`.
- O token anterior é consumido e invalidado de forma atômica.
- Reutilização de token consumido revoga toda a família da sessão.

Cookie de produção:

```http
Set-Cookie: __Host-orgmind-refresh=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

Cookies não definem `Domain`. `Max-Age` nunca ultrapassa a validade da credencial correspondente. Access e refresh tokens não são gravados em `localStorage`, `sessionStorage` ou estado acessível ao JavaScript.

### Renovação

1. O frontend recebe uma resposta indicando access token expirado.
2. Faz uma única tentativa coordenada de `POST /auth/refresh`.
3. O backend valida sessão, hash, expiração e estado do refresh token.
4. O backend consome o token e emite atomicamente novo access JWT e novo refresh token.
5. Requisições concorrentes aguardam o mesmo resultado de renovação, evitando múltiplas rotações paralelas.
6. Falha definitiva encerra o estado autenticado no cliente.

### Revogação e logout

- Logout normal revoga a sessão atual e expira os dois cookies.
- Logout global revoga todas as sessões do usuário.
- Troca ou recuperação de senha, desativação da conta, reutilização de refresh token ou suspeita de comprometimento revogam todas as sessões aplicáveis.
- A remoção usa os mesmos nomes, path e atributos empregados na criação dos cookies.

### Proteção CSRF e origem

- `SameSite=Lax` é defesa complementar, não exclusiva.
- Operações mutáveis exigem token CSRF.
- Validar `Origin` e, quando necessário, `Referer` contra uma allowlist explícita.
- APIs autenticadas aceitam conteúdo JSON esperado e rejeitam content types inesperados.
- CORS com credenciais permite somente origens explícitas; nunca usar origem curinga.

### Desenvolvimento local

Produção exige HTTPS e cookies `Secure`. A configuração local deve preservar os mesmos nomes e políticas sempre que o ambiente permitir. Qualquer exceção para desenvolvimento deve ser explícita, limitada ao ambiente local e impossível de ativar acidentalmente em produção.

## Consequências

### Positivas

- Janela curta para abuso de access token.
- Renovação sem expor credenciais ao JavaScript.
- Revogação por sessão e por usuário.
- Detecção de reutilização de refresh token.
- Possibilidade de alterar permissões sem depender de JWTs longos.

### Custos

- Persistência e limpeza periódica de sessões.
- Rotação atômica e tratamento de concorrência.
- Implementação e teste de proteção CSRF.
- Mais estados de erro no fluxo de autenticação.

## Referências

- [OAuth 2.0 Security Best Current Practice — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN — Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
