import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
const proofSchema = z.object({
  kind: z.enum(['quote', 'charge']),
  priceKey: z.enum(['9', '15', '19', '25', '29', '35']),
  method: z.enum(['OXXO', 'SPEI', 'NEQUI', 'BREB', 'PIX']),
  currency: z.enum(['MXN', 'COP', 'BRL']),
  amount: z.number().positive().finite(),
  expiresAt: z.number().int().positive(),
  requestNumber: z.string().max(128).optional(),
  externalId: z.string().max(128).optional(),
});
export type XpagProof = z.infer<typeof proofSchema>;
export function signXpagProof(proof: XpagProof, secret: string) {
  const body = Buffer.from(JSON.stringify(proofSchema.parse(proof))).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('hex')}`;
}
export function verifyXpagProof(token: string, kind: XpagProof['kind'], secret: string): XpagProof {
  if (token.length > 4096) throw new Error('Pagamento inválido.');
  const parts = token.split('.');
  const body = parts[0];
  const signed = parts[1];
  if (parts.length !== 2 || !body || !signed || !/^[a-f0-9]{64}$/.test(signed)) throw new Error('Pagamento inválido.');
  const expected = createHmac('sha256', secret).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signed, 'hex'))) throw new Error('Pagamento inválido.');
  const proof = proofSchema.parse(JSON.parse(Buffer.from(body, 'base64url').toString()));
  if (proof.kind !== kind || proof.expiresAt <= Date.now()) throw new Error('Cotação expirada. Atualize o preço para continuar.');
  return proof;
}