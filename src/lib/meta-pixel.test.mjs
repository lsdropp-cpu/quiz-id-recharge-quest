import { expect, test } from 'bun:test';
import { isMetaPaidPurchase, META_PIXEL_ID, metaScope } from './meta-pixel';

test('uses the supplied Facebook pixel', () => {
  expect(META_PIXEL_ID).toBe('1193530602870876');
});
test('only XPag confirmed and completed payments qualify as purchases', () => {
  for (const status of ['confirmed', 'completed']) {
    expect(isMetaPaidPurchase({ requestNumber: 'local_test', status, amount: 191.82, currency: 'MXN' })).toBe(true);
  }
  for (const status of ['pending', 'failed', 'expired', 'waiting_payment']) {
    expect(isMetaPaidPurchase({ requestNumber: 'local_test', status, amount: 191.82, currency: 'MXN' })).toBe(false);
  }
});
test('requires a valid transaction and original positive amount and currency', () => {
  const base = { requestNumber: 'local_test', status: 'confirmed', amount: 191.82, currency: 'MXN' };
  for (const charge of [{ ...base, amount: 0 }, { ...base, amount: NaN }, { ...base, currency: '' }, { ...base, requestNumber: '' }]) {
    expect(isMetaPaidPurchase(charge)).toBe(false);
  }
});
test('keeps Meta on the main local checkout funnel only', () => {
  expect(metaScope('/local')).toBe(true);
  expect(metaScope('/recharge')).toBe(true);
  expect(metaScope('/recharge2')).toBe(false);
  expect(metaScope('/br/recharge')).toBe(false);
});