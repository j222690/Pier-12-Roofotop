/**
 * Edge Function: send-push-notification
 *
 * Chamada pelo stripe-webhook após criar uma reserva confirmada.
 * Lê todas as push_subscriptions salvas no banco e envia uma
 * notificação Web Push assinada com as chaves VAPID.
 *
 * Variáveis de ambiente necessárias (Supabase → Edge Functions → Secrets):
 *   VAPID_PUBLIC_KEY   – chave pública VAPID (mesma do frontend)
 *   VAPID_PRIVATE_KEY  – chave privada VAPID (gerada junto com a pública)
 *   VAPID_SUBJECT      – ex: "mailto:seu@email.com"
 */

import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── VAPID helpers ─────────────────────────────────────────────────────────────

function base64UrlToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildVapidAuthHeader(
  endpoint: string,
  publicKeyB64: string,
  privateKeyB64: string,
  subject: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const now = Math.floor(Date.now() / 1000);

  // JWT header + payload
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: now + 43200, sub: subject };
  const encodedHeader = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key (raw VAPID private key is a 32-byte P-256 scalar)
  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    // Wrap raw key in PKCS8 envelope expected by WebCrypto
    buildPkcs8(privateKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSig = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  const jwt = `${signingInput}.${encodedSig}`;

  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

/**
 * Builds a minimal PKCS8 DER wrapper around a raw 32-byte P-256 private key.
 * This lets WebCrypto importKey("pkcs8") work without external libs.
 */
function buildPkcs8(rawPrivateKey: Uint8Array): ArrayBuffer {
  // SEC1 ECPrivateKey wrapping the raw bytes
  const sec1 = new Uint8Array([
    0x30, 0x77,                         // SEQUENCE
      0x02, 0x01, 0x01,                 // version = 1
      0x04, 0x20, ...rawPrivateKey,     // privateKey (32 bytes)
      0xa0, 0x0a,                       // [0] OID tag
        0x06, 0x08,                     // OID length
          0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // P-256 OID
      0xa1, 0x44,                       // [1] publicKey (omitted, 68 bytes placeholder)
        0x03, 0x42, 0x00,               //   BIT STRING
          0x04,                         //   uncompressed point marker
          ...new Uint8Array(64),        //   x,y coords (zeros — only private key matters for signing)
  ]);

  // PKCS8 wrapper around the SEC1 structure
  const oidEcPublicKey = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01];
  const oidP256        = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];

  const algorithmIdentifier = new Uint8Array([
    0x30, 0x13,
      0x06, oidEcPublicKey.length, ...oidEcPublicKey,
      0x06, oidP256.length,        ...oidP256,
  ]);

  const privateKeyInfo = new Uint8Array([
    0x30, ...encodeLength(2 + algorithmIdentifier.length + 2 + sec1.length + 2),
      0x02, 0x01, 0x00,           // version = 0
      ...algorithmIdentifier,
      0x04, ...encodeLength(sec1.length), ...sec1,
  ]);

  return privateKeyInfo.buffer;
}

function encodeLength(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n]);
  if (n < 0x100) return new Uint8Array([0x81, n]);
  return new Uint8Array([0x82, (n >> 8) & 0xff, n & 0xff]);
}

// ─── Send one push ─────────────────────────────────────────────────────────────

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const authHeader = await buildVapidAuthHeader(
      sub.endpoint,
      vapidPublic,
      vapidPrivate,
      vapidSubject
    );

    // Encrypt payload using Web Push encryption (RFC 8291 / aesgcm)
    // For simplicity we send an unencrypted payload via the "aes128gcm" draft
    // by encoding with the subscription keys. Using the native WebCrypto:
    const encrypted = await encryptPayload(sub.p256dh, sub.auth, payload);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Urgency: "high",
      },
      body: encrypted,
    });

    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Web Push payload encryption (RFC 8291 / aes128gcm) ───────────────────────

async function encryptPayload(
  p256dhBase64: string,
  authBase64: string,
  plaintext: string
): Promise<Uint8Array> {
  const receiverPublicKey = base64UrlToUint8Array(p256dhBase64);
  const authSecret = base64UrlToUint8Array(authBase64);
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // Generate sender ephemeral ECDH key pair
  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Import receiver public key
  const receiverKey = await crypto.subtle.importKey(
    "raw",
    receiverPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: receiverKey },
      senderKeyPair.privateKey,
      256
    )
  );

  // Export sender public key (65-byte uncompressed)
  const senderPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeyPair.publicKey)
  );

  // Salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive content encryption key and nonce (RFC 8291)
  const hkdf = async (
    ikm: Uint8Array,
    info: Uint8Array,
    salt: Uint8Array,
    length: number
  ): Promise<Uint8Array> => {
    const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    return new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt, info },
        key,
        length * 8
      )
    );
  };

  // PRK — pseudo-random key
  const prk = await hkdf(
    sharedSecret,
    buildInfo("auth", new Uint8Array(0), new Uint8Array(0)),
    authSecret,
    32
  );

  // Content encryption key (16 bytes)
  const cek = await hkdf(
    prk,
    buildInfo("aesgcm128", receiverPublicKey, senderPublicKeyRaw),
    salt,
    16
  );

  // Nonce (12 bytes)
  const nonce = await hkdf(
    prk,
    buildInfo("nonce", receiverPublicKey, senderPublicKeyRaw),
    salt,
    12
  );

  // AES-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const paddedPlaintext = new Uint8Array(plaintextBytes.length + 2);
  paddedPlaintext.set([0, 0]); // no padding
  paddedPlaintext.set(plaintextBytes, 2);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext)
  );

  // Build aes128gcm content (RFC 8188)
  // header: salt(16) + rs(4) + keyid_len(1) + sender_public_key(65)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false); // record size = 4096
  const header = new Uint8Array(16 + 4 + 1 + senderPublicKeyRaw.length);
  header.set(salt, 0);
  header.set(rs, 16);
  header[20] = senderPublicKeyRaw.length;
  header.set(senderPublicKeyRaw, 21);

  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header, 0);
  result.set(ciphertext, header.length);
  return result;
}

function buildInfo(type: string, clientKey: Uint8Array, serverKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  const result = new Uint8Array(typeBytes.length + 1 + clientKey.length + 1 + serverKey.length + 1);
  result.set(typeBytes, 0);
  result[typeBytes.length] = 0;
  result.set(clientKey, typeBytes.length + 1);
  result[typeBytes.length + 1 + clientKey.length] = 0;
  result.set(serverKey, typeBytes.length + 1 + clientKey.length + 1);
  return result;
}

// ─── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@pier12.com.br";

    if (!vapidPublic || !vapidPrivate) {
      throw new Error("VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY não configurados nos secrets da Edge Function.");
    }

    const body = await req.json() as {
      reservationId: string;
      reservation_name: string;
      reservation_date: string;
      reservation_time: string;
      guest_count: number;
      total_price: number;
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all push subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (subsError) throw new Error("Erro ao buscar subscriptions: " + subsError.message);
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "Nenhuma subscription registrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build notification payload
    const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(body.total_price)
    );
    const [year, month, day] = body.reservation_date.split("-");
    const dateFormatted = `${day}/${month}/${year}`;

    const notification = JSON.stringify({
      title: "🎉 Nova Reserva - Pier 12",
      body: `${body.reservation_name} • ${body.guest_count} pessoa${body.guest_count !== 1 ? "s" : ""} • ${dateFormatted} às ${body.reservation_time} • ${price}`,
      reservationId: body.reservationId,
    });

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subs.map((sub) =>
        sendPush(sub, notification, vapidPublic, vapidPrivate, vapidSubject)
      )
    );

    let sent = 0;
    const expired: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        if (r.value.ok) {
          sent++;
        } else if (r.value.status === 410 || r.value.status === 404) {
          // Subscription expired — remove from DB
          expired.push(subs[i].endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    console.log(`Push enviado: ${sent}/${subs.length} devices. Expirados removidos: ${expired.length}`);

    return new Response(JSON.stringify({ sent, total: subs.length, expiredRemoved: expired.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-push-notification error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
