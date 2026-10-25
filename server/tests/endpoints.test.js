'use strict';

const request = require('supertest');

jest.mock('../src/config/database', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  define: jest.fn().mockReturnValue({}),
  query: jest.fn().mockResolvedValue([]),
  transaction: jest.fn(),
}));

jest.mock('../src/services/authService');
jest.mock('../src/services/classService');
jest.mock('../src/services/locationService');
jest.mock('../src/services/membershipService');
jest.mock('../src/services/bookingService');
jest.mock('../src/services/paymentService');
jest.mock('../src/services/userService');
jest.mock('../src/services/trainerService');
jest.mock('../src/services/contactService');
jest.mock('../src/services/webhookService');

jest.mock('../src/models', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
  User:          { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  MembershipPlan:{},
  Location:      {},
  Class:         {},
  Trainer:       {},
  Subscription:  {},
  Booking:       {},
  Payment:       {},
  Waitlist:      {},
  Review:        {},
  Notification:  {},
  Promotion:     {},
  AuditLog:      {},
}));

jest.mock('../src/utils/email', () => ({
  sendWelcomeEmail:          jest.fn().mockResolvedValue(true),
  sendPasswordOtp:           jest.fn().mockResolvedValue(true),
  sendPaymentReceipt:        jest.fn().mockResolvedValue(true),
  sendBookingConfirmation:   jest.fn().mockResolvedValue(true),
  sendBookingCancellation:   jest.fn().mockResolvedValue(true),
  sendWaitlistNotification:  jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/paystack', () => ({
  initializeTransaction:    jest.fn().mockResolvedValue({ data: { authorization_url: 'https://checkout.paystack.com/abc123' } }),
  verifyTransaction:        jest.fn(),
  initializeSubscription:   jest.fn().mockResolvedValue({ data: {} }),
  cancelSubscription:       jest.fn().mockResolvedValue(true),
  validateWebhookSignature: jest.fn().mockReturnValue(true),
}));

const app = require('../index');

const authService      = require('../src/services/authService');
const locationService  = require('../src/services/locationService');
const membershipService = require('../src/services/membershipService');
const classService     = require('../src/services/classService');
const bookingService   = require('../src/services/bookingService');
const paymentService   = require('../src/services/paymentService');
const { User }         = require('../src/models');
const { generateAccessToken, generateRefreshToken } = require('../src/utils/jwt');

const MOCK_USER = {
  id: 'user-uuid-001',
  firstName: 'Ubong',
  lastName: 'Edem',
  email: 'ubong@apexfitness.ng',
  role: 'member',
  isActive: true,
  toJSON() { return { ...this, _id: this.id }; },
  update: jest.fn().mockResolvedValue(true),
};

const MOCK_PLAN = {
  id: 'plan-uuid-001',
  name: 'Monthly',
  price: '30000.00',
  billingCycle: 'monthly',
  locationAccess: 'all',
  isActive: true,
};

const MOCK_LOCATION = {
  id: 'loc-uuid-001',
  name: 'Victoria Island',
  city: 'Lagos',
};

const MOCK_CLASS = {
  id: 'class-uuid-001',
  name: 'Morning HIIT',
  classType: 'hiit',
  date: '2026-07-01',
  startTime: '06:00',
  capacity: 20,
  bookedCount: 5,
  status: 'scheduled',
};

const VALID_REGISTER = {
  firstName: 'Ubong',
  lastName: 'Edem',
  email: 'ubong@apexfitness.ng',
  password: 'SecurePass123!',
  phone: '+2348012345678',
};

function makeToken(overrides = {}) {
  return generateAccessToken({ ...MOCK_USER, ...overrides });
}

function setupAuthUser(user = MOCK_USER) {
  User.findByPk.mockResolvedValue(user);
}

describe('GET /health', () => {
  test('200 with status ok and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('CORS preflight', () => {
  test('OPTIONS returns 204 with CORS headers for allowed origin', async () => {
    const res = await request(app)
      .options('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
  });

  test('disallowed origin does not receive its own origin reflected', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com');

    expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.com');
  });
});

describe('Unknown routes', () => {
  test('404 for unknown path', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    authService.register.mockResolvedValue({
      user: MOCK_USER,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  test('201 with user and tokens for valid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_REGISTER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(MOCK_USER.email);
  });

  test('409 when email already registered', async () => {
    const err = Object.assign(new Error('An account with that email address already exists'), { statusCode: 409 });
    authService.register.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_REGISTER);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email address already exists/i);
  });

  test('400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'only@email.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_REGISTER, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  test('400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_REGISTER, password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('200 with tokens for valid credentials', async () => {
    authService.login.mockResolvedValue({
      user: MOCK_USER,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'SecurePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('401 for wrong credentials', async () => {
    const err = Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    authService.login.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'WrongPass!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('403 for suspended account', async () => {
    const err = Object.assign(new Error('Account suspended. Please contact support.'), { statusCode: 403 });
    authService.login.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'SecurePass123!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });

  test('400 for missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'SecurePass123!' });

    expect(res.status).toBe(400);
  });

  test('400 for missing password field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  test('200 with new access token for valid refresh token', async () => {
    authService.refresh.mockResolvedValue({ accessToken: 'new-access-token' });

    const refreshToken = generateRefreshToken(MOCK_USER);
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('400 when refresh token missing', async () => {
    const err = Object.assign(new Error('Refresh token required'), { statusCode: 400 });
    authService.refresh.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  test('401 for invalid refresh token', async () => {
    const err = Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    authService.refresh.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bad.token.here' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  test('200 for any request (stateless logout)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});

describe('GET /api/auth/me', () => {
  test('200 returns user data with valid token', async () => {
    setupAuthUser();
    authService.getMe.mockResolvedValue({ user: MOCK_USER });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(MOCK_USER.email);
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });

  test('401 TOKEN_REVOKED when the token version is stale', async () => {

    setupAuthUser({ ...MOCK_USER, tokenVersion: 3 });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_REVOKED');
  });
});

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    authService.forgotPassword.mockResolvedValue({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  });

  test('200 for registered email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: MOCK_USER.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  test('200 for unregistered email (no info leak)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@nowhere.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  test('400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/locations', () => {
  test('200 returns list of locations', async () => {
    locationService.getAll.mockResolvedValue({ locations: [MOCK_LOCATION] });

    const res = await request(app).get('/api/locations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locations[0].name).toBe('Victoria Island');
  });
});

describe('GET /api/locations/:id', () => {
  test('200 returns a single location', async () => {
    locationService.getOne.mockResolvedValue({ location: MOCK_LOCATION });

    const res = await request(app).get('/api/locations/loc-uuid-001');
    expect(res.status).toBe(200);
    expect(res.body.data.location.name).toBe('Victoria Island');
  });

  test('404 for non-existent location', async () => {
    const err = Object.assign(new Error('Location not found'), { statusCode: 404 });
    locationService.getOne.mockRejectedValue(err);

    const res = await request(app).get('/api/locations/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/memberships/plans', () => {
  test('200 returns active plans', async () => {
    membershipService.getPlans.mockResolvedValue({ plans: [MOCK_PLAN] });

    const res = await request(app).get('/api/memberships/plans');
    expect(res.status).toBe(200);
    expect(res.body.data.plans[0].name).toBe('Monthly');
    expect(res.body.data.plans[0].price).toBe('30000.00');
  });
});

describe('GET /api/memberships/plans/:id', () => {
  test('200 returns a single plan', async () => {
    membershipService.getPlanById.mockResolvedValue({ plan: MOCK_PLAN });

    const res = await request(app).get('/api/memberships/plans/plan-uuid-001');
    expect(res.status).toBe(200);
    expect(res.body.data.plan.billingCycle).toBe('monthly');
  });

  test('404 for non-existent plan', async () => {
    const err = Object.assign(new Error('Plan not found'), { statusCode: 404 });
    membershipService.getPlanById.mockRejectedValue(err);

    const res = await request(app).get('/api/memberships/plans/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/classes', () => {
  test('200 returns paginated class list', async () => {
    classService.getAll.mockResolvedValue({
      classes: [MOCK_CLASS],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const res = await request(app).get('/api/classes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('200 with classType filter passed to service', async () => {
    classService.getAll.mockResolvedValue({ classes: [MOCK_CLASS], total: 1, page: 1, totalPages: 1 });

    const res = await request(app).get('/api/classes?classType=hiit');
    expect(res.status).toBe(200);
    expect(classService.getAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ classType: 'hiit' })
    );
  });
});

describe('GET /api/classes/:id', () => {
  test('200 returns class detail', async () => {
    classService.getOne.mockResolvedValue({ class: MOCK_CLASS, userBookingStatus: null });

    const res = await request(app).get('/api/classes/class-uuid-001');
    expect(res.status).toBe(200);
    expect(res.body.data.class.name).toBe('Morning HIIT');
  });

  test('404 for non-existent class', async () => {
    const err = Object.assign(new Error('Class not found'), { statusCode: 404 });
    classService.getOne.mockRejectedValue(err);

    const res = await request(app).get('/api/classes/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('Protected routes reject unauthenticated requests', () => {
  const routes = [
    ['GET',    '/api/bookings'],
    ['POST',   '/api/bookings'],
    ['GET',    '/api/payments'],
    ['GET',    '/api/users/me'],
    ['GET',    '/api/users/subscriptions'],
    ['POST',   '/api/memberships/subscribe'],
    ['DELETE', '/api/memberships/cancel'],
  ];

  test.each(routes)('%s %s → 401 without token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/bookings', () => {
  test('200 returns booking list for authenticated member', async () => {
    setupAuthUser();
    bookingService.getAll.mockResolvedValue({ bookings: [], total: 0, page: 1, totalPages: 0 });

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/bookings', () => {
  test('201 creates booking for member with active subscription', async () => {
    setupAuthUser();
    bookingService.create.mockResolvedValue({ booking: { id: 'booking-001', classId: 'class-uuid-001', status: 'booked' } });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ classId: 'class-uuid-001' });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('booked');
  });

  test('403 when member has no active subscription', async () => {
    setupAuthUser();
    const err = Object.assign(new Error('You need an active membership to book classes'), { statusCode: 403 });
    bookingService.create.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ classId: 'class-uuid-001' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/active membership/i);
  });

  test('409 when class already booked', async () => {
    setupAuthUser();
    const err = Object.assign(new Error('You have already booked this class'), { statusCode: 409 });
    bookingService.create.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ classId: 'class-uuid-001' });

    expect(res.status).toBe(409);
  });

  test('400 when classId missing from body', async () => {
    setupAuthUser();

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/memberships/subscribe', () => {
  test('201 returns Paystack checkout URL', async () => {
    setupAuthUser();
    membershipService.subscribe.mockResolvedValue({
      checkoutUrl: 'https://checkout.paystack.com/abc123',
      reference: 'APEX-ABCD1234',
      paymentId: 'payment-001',
      amount: 30000,
    });

    const res = await request(app)
      .post('/api/memberships/subscribe')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ planId: 'plan-uuid-001' });

    expect(res.status).toBe(201);
    expect(res.body.data.checkoutUrl).toMatch(/paystack/i);
    expect(res.body.data.reference).toMatch(/^APEX-/);
  });

  test('404 for non-existent or inactive plan', async () => {
    setupAuthUser();
    const err = Object.assign(new Error('Plan not found or inactive'), { statusCode: 404 });
    membershipService.subscribe.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/memberships/subscribe')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ planId: 'bad-plan-id' });

    expect(res.status).toBe(404);
  });

  test('400 for missing planId', async () => {
    setupAuthUser();
    const err = Object.assign(new Error('planId is required'), { statusCode: 400 });
    membershipService.subscribe.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/memberships/subscribe')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/payments', () => {
  test('200 returns payment history', async () => {
    setupAuthUser();
    paymentService.getAll.mockResolvedValue({ payments: [], total: 0, page: 1, totalPages: 0 });

    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('strips server-only secrets from the response at any nesting depth', async () => {
    setupAuthUser();

    paymentService.getAll.mockResolvedValue({
      data: [{
        id: 'pay-1',
        paystackReference: 'APEX-KEEP-ME',
        Subscription: {
          id: 'sub-1',
          paystackAuthorizationCode: 'AUTH_leak',
          paystackSubscriptionCode: 'SUB_leak',
        },
        User: { id: 'u-1', email: 'a@b.com', passwordHash: 'HASH_leak' },
      }],
      pagination: { total: 1 },
    });

    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${makeToken()}`);

    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('AUTH_leak');
    expect(raw).not.toContain('SUB_leak');
    expect(raw).not.toContain('HASH_leak');
    expect(raw).toContain('APEX-KEEP-ME');
  });
});

describe('GET /api/users/me', () => {
  test('200 returns current user profile', async () => {
    setupAuthUser();
    const userService = require('../src/services/userService');
    userService.getMe.mockResolvedValue({ user: MOCK_USER });

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(MOCK_USER.email);
  });
});

describe('lockers route mounting - public pricing must not weaken auth', () => {
  test('GET /api/lockers/plans is public', async () => {
    const res = await request(app).get('/api/lockers/plans');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('monthly');
  });

  test('GET /api/lockers/my still requires a token', async () => {
    const res = await request(app).get('/api/lockers/my');
    expect(res.status).toBe(401);
  });

  test('POST /api/lockers/subscribe still requires a token', async () => {
    const res = await request(app).post('/api/lockers/subscribe').send({});
    expect(res.status).toBe(401);
  });

  test('DELETE /api/lockers/cancel still requires a token', async () => {
    const res = await request(app).delete('/api/lockers/cancel');
    expect(res.status).toBe(401);
  });

  test('GET /api/settings still requires a token', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });
});
