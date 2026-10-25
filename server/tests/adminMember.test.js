'use strict';

jest.mock('../src/config/database', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync:         jest.fn().mockResolvedValue(true),
  define:       jest.fn().mockReturnValue({}),
  query:        jest.fn().mockResolvedValue([]),
  transaction:  jest.fn((fn) => fn({})),
}));

jest.mock('../src/services/settingService', () => ({
  getJoiningFee: jest.fn().mockResolvedValue(0),
}));
jest.mock('../src/services/membershipService', () => ({
  isFirstTimeSubscriber: jest.fn().mockResolvedValue(false),
}));

jest.mock('../src/models', () => ({
  User:          { findByPk: jest.fn() },
  Subscription:  {},
  Booking:       {},
  Payment:       {},
  MembershipPlan:{},
  Class:         {},
  Trainer:       {},
  Location:      {},
  Notification:  {},
}));

jest.mock('../src/utils/pagination', () => ({
  paginate:         jest.fn(),
  paginateResponse: jest.fn(),
}));

const { User } = require('../src/models');
const memberService = require('../src/services/admin/memberService');

describe('adminMemberService.update - privilege safety', () => {
  beforeEach(() => jest.clearAllMocks());

  test('drops `role` even when supplied in the body', async () => {
    const update = jest.fn().mockResolvedValue(true);
    User.findByPk.mockResolvedValue({ role: 'member', update });

    await memberService.update('member-id', { firstName: 'Ada', role: 'admin' });

    const applied = update.mock.calls[0][0];
    expect(applied.role).toBeUndefined();
    expect(applied.firstName).toBe('Ada');
  });

  test('refuses to edit a non-member (staff/admin) account', async () => {
    const update = jest.fn();
    User.findByPk.mockResolvedValue({ role: 'admin', update });

    await expect(memberService.update('admin-id', { firstName: 'X' }))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(update).not.toHaveBeenCalled();
  });

  test('404 when the target user does not exist', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(memberService.update('missing', { firstName: 'X' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
