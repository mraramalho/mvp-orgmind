# ADR 0002 — Política de senha e recuperação de acesso

- Status: aceito
- Data: 2026-08-17

## Contexto

O OrgMind precisa autenticar usuários por e-mail e senha sem impor regras que induzam padrões previsíveis. Também precisa armazenar credenciais de forma resistente a ataques offline e recuperar acesso sem revelar a existência de contas ou criar credenciais reutilizáveis.

Esta decisão complementa o ADR 0001. O ciclo de cookies, access JWT, refresh token e revogação de sessões continua definido naquele documento.

## Decisão

### Criação e alteração de senha

- Exigir no mínimo 15 caracteres enquanto senha for o único fator de autenticação.
- Aceitar pelo menos 64 caracteres.
- Permitir espaços, Unicode, colagem e gerenciadores de senha.
- Normalizar Unicode de maneira consistente antes da derivação, sem alterar silenciosamente a intenção do usuário.
- Não exigir combinações obrigatórias de maiúsculas, minúsculas, números ou símbolos.
- Não expirar senhas periodicamente; exigir troca quando houver recuperação, comprometimento ou ação administrativa justificada.
- Não usar dicas ou perguntas de segurança.
- Verificar a nova senha contra lista de senhas comuns, comprometidas e termos relacionados ao usuário ou ao OrgMind.
- Um medidor de força pode orientar o usuário, mas não substitui os critérios acima.

### Armazenamento

Usar Argon2id com parâmetros iniciais:

```text
memória:       64 MiB
iterações:     3
paralelismo:   2
salt:          16 bytes aleatórios por senha
hash:          32 bytes
```

- Calibrar os parâmetros no ambiente de produção para aproximadamente 100–250 ms por verificação, considerando resistência a abuso de recursos.
- Armazenar algoritmo, versão e parâmetros junto ao hash para permitir rehash após login bem-sucedido.
- Nunca armazenar senha em texto puro, criptografia reversível ou logs.
- Pepper é opcional; se adotada, fica fora do banco em mecanismo de secrets e exige plano de rotação.

### Login e prevenção de enumeração

- Responder “E-mail ou senha inválidos” para conta inexistente, senha incorreta, conta inativa ou conta sem senha utilizável.
- Manter comportamento e tempo de resposta suficientemente uniformes.
- Aplicar rate limiting por conta normalizada e por origem.
- Usar atraso progressivo para falhas repetidas, sem bloqueio permanente explorável como negação de serviço.
- Registrar eventos de segurança sem incluir senha, token ou outros segredos.

### Solicitação de recuperação

Endpoint:

```http
POST /auth/password-recovery
```

- Sempre responder com mensagem neutra: “Se existir uma conta associada, enviaremos as instruções.”
- Processar o envio de e-mail de forma assíncrona.
- Aplicar rate limiting por e-mail normalizado, origem e janela de tempo.
- Não construir a URL de recuperação a partir do header `Host`; usar uma origem confiável configurada no servidor.

### Token de recuperação

- Token opaco com 32 bytes aleatórios, equivalentes a 256 bits.
- Armazenar somente o hash do token no PostgreSQL.
- Associar a usuário, finalidade, criação, expiração e consumo.
- Validade de 30 minutos e uso único.
- Nova solicitação invalida tokens anteriores ainda ativos do mesmo usuário e finalidade.
- Não incluir e-mail ou informação sensível na URL.
- Enviar somente por HTTPS no ambiente de produção.

### Redefinição

Endpoint:

```http
POST /auth/password-reset
```

Em uma transação lógica/atômica, o backend deve:

1. validar hash, finalidade, expiração e estado do token;
2. validar a nova senha;
3. gerar o hash Argon2id;
4. substituir a credencial;
5. consumir o token;
6. revogar todas as sessões e famílias de refresh tokens do usuário;
7. registrar o evento de segurança.

Após a redefinição:

- não autenticar automaticamente;
- encaminhar o usuário ao login;
- enviar notificação de segurança sem incluir a senha;
- fornecer orientação para contato de suporte caso a ação não tenha sido solicitada.

### Alteração por usuário autenticado

- Exigir a senha atual antes da alteração.
- Aplicar a mesma política e bloqueio de senhas comprometidas.
- Revogar as demais sessões.
- Renovar a sessão atual somente após reautenticação bem-sucedida.
- Enviar notificação de segurança.

## Consequências

### Positivas

- Senhas mais resistentes sem regras previsíveis de composição.
- Derivação resistente a ataques offline.
- Recuperação de uso único e curta duração.
- Menor risco de enumeração de contas.
- Sessões antigas deixam de funcionar após recuperação.

### Custos

- Argon2id precisa de calibração e monitoramento de recursos.
- Lista de senhas comprometidas exige fonte local ou integração cuidadosamente projetada.
- Recuperação depende de entrega confiável de e-mail.
- Rate limiting distribuído exige armazenamento consistente entre instâncias.

## Referências

- [NIST SP 800-63B — Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
