'use strict';

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync:         jest.fn().mockResolvedValue(true),
  define:       jest.fn().mockReturnValue({}),
  query:        jest.fn().mockResolvedValue([]),
  transaction:  jest.fn(),
}));

jest.mock('../src/services/settingService', () => ({
  getSetting: jest.fn(async (key) => ({
    locker_monthly_price:   '15000',
    locker_quarterly_price: '30000',
    locker_setup_fee:       '25000',
  }[key])),
}));

const lockerPlans = require('../src/routes/lockerPlans');

describe('public locker pricing', () => {
  const app = express();
  app.use('/api/lockers', lockerPlans);

  test('is reachable without authentication', async () => {
    const res = await request(app).get('/api/lockers/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns the three locker prices as numbers', async () => {
    const res = await request(app).get('/api/lockers/plans');
    expect(res.body.data).toEqual({
      monthly:   15000,
      quarterly: 30000,
      setupFee:  25000,
    });
  });

  test('exposes only locker pricing, never other settings', async () => {
    const res = await request(app).get('/api/lockers/plans');
    const keys = Object.keys(res.body.data).sort();
    expect(keys).toEqual(['monthly', 'quarterly', 'setupFee']);
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toMatch(/bank/i);
    expect(serialised).not.toMatch(/account/i);
  });

  test('degrades to 0 rather than erroring when a price is unset', async () => {
    const { getSetting } = require('../src/services/settingService');
    getSetting.mockImplementationOnce(async () => null)
              .mockImplementationOnce(async () => null)
              .mockImplementationOnce(async () => null);
    const res = await request(app).get('/api/lockers/plans');
    expect(res.status).toBe(200);
    expect(res.body.data.monthly).toBe(0);
  });
});
