import { test } from 'node:test';
import { strictEqual, throws } from 'node:assert/strict';
import { signXpagProof, verifyXpagProof, type XpagProof } from './xpag-proof.server';

const secret = 'unit-test-only-signing-fixture';
const proof: XpagProof = { kind: 'quote', priceKey: '9', method: 'OXXO', currency: 'MXN', amount: 191.82, expiresAt: Date.now() + 30 * 60_000 };
test('signed quote binds the displayed MXN total', () => {
  const token = signXpagProof(proof, secret);
  strictEqual(verifyXpagProof(token, 'quote', secret).amount, 191.82);
});
test('changing a signed price is rejected', () => {
  const token = signXpagProof(proof, secret);
  const signature = token.split('.')[1];
  const altered = Buffer.from(JSON.stringify({ ...proof, amount: 1 })).toString('base64url');
  throws(() => verifyXpagProof(`${altered}.${signature}`, 'quote', secret));
});
test('expired quote cannot authorize a payment', () => {
  const token = signXpagProof({ ...proof, expiresAt: Date.now() - 1 }, secret);
  throws(() => verifyXpagProof(token, 'quote', secret));
});
test('a quote cannot be used to read a charge status', () => {
  throws(() => verifyXpagProof(signXpagProof(proof, secret), 'charge', secret));
});