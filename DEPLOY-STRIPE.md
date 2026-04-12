# 🔧 Como configurar o pagamento Stripe (checkout)

O botão "Reservar" chama uma **Edge Function do Supabase** chamada `create-checkout`.
Para funcionar, ela precisa estar **deployada** e com a **chave da Stripe configurada**.

---

## Passo 1 — Instalar o Supabase CLI

```bash
npm install -g supabase
```

---

## Passo 2 — Fazer login e linkar o projeto

```bash
supabase login
supabase link --project-ref qlhpgflndrxdoplmwddd
```

(O project-ref já está preenchido com o seu projeto)

---

## Passo 3 — Configurar a chave secreta da Stripe

No [Dashboard da Stripe](https://dashboard.stripe.com/apikeys), copie a **Secret key** (começa com `sk_live_...` ou `sk_test_...`).

Depois configure como secret no Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_SUA_CHAVE_AQUI
```

Para verificar se foi salvo:
```bash
supabase secrets list
```

---

## Passo 4 — Fazer deploy da Edge Function

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

---

## Passo 5 — Configurar o Webhook da Stripe

No [Dashboard da Stripe > Webhooks](https://dashboard.stripe.com/webhooks), adicione um endpoint:

- **URL:** `https://qlhpgflndrxdoplmwddd.supabase.co/functions/v1/stripe-webhook`
- **Eventos:** `checkout.session.completed`

Depois copie o **Webhook signing secret** (começa com `whsec_...`) e configure:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI
```

---

## ✅ Teste

Após o deploy, tente fazer uma reserva. Se ainda der erro, abra o console do navegador (F12 > Console) e veja a mensagem exata de erro — agora o app mostra o erro real do servidor.

Para ver os logs da função no Supabase:
```bash
supabase functions logs create-checkout
```

---

## ⚠️ Modo de teste vs produção

- Use `sk_test_...` para testar sem cobrar de verdade
- Use `sk_live_...` apenas quando estiver pronto para produção
- No modo teste, use o cartão `4242 4242 4242 4242` com qualquer data futura e CVV
