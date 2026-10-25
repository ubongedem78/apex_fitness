const crypto = require('crypto');
const { validateWebhookSignature } = require('../src/utils/paystack');

const SECRET = 'sk_test_dummy';

function sign(body) {
  return crypto.createHmac('sha512', SECRET).update(JSON.stringify(body)).digest('hex');
}

describe('Paystack webhook signature validation', () => {
  test('valid signature passes', () => {
    const body = { event: 'charge.success', data: { reference: 'REF-001' } };
    const sig = sign(body);
    expect(validateWebhookSignature(body, sig)).toBe(true);
  });

  test('tampered body fails', () => {
    const body = { event: 'charge.success', data: { reference: 'REF-001' } };
    const sig = sign(body);
    const tampered = { ...body, data: { reference: 'REF-HACKED' } };
    expect(validateWebhookSignature(tampered, sig)).toBe(false);
  });

  test('wrong secret fails', () => {
    const body = { event: 'charge.success', data: { reference: 'REF-001' } };
    const wrongSig = crypto
      .createHmac('sha512', 'wrong_secret')
      .update(JSON.stringify(body))
      .digest('hex');
    expect(validateWebhookSignature(body, wrongSig)).toBe(false);
  });

  test('empty body with valid signature passes', () => {
    const body = {};
    const sig = sign(body);
    expect(validateWebhookSignature(body, sig)).toBe(true);
  });
});
