const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../src/utils/jwt');

const mockUser = { id: 'user-123', email: 'test@apexfitness.ng', role: 'member' };

describe('JWT utilities', () => {
  test('generateAccessToken produces a verifiable token', () => {
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });

  test('generateRefreshToken produces a verifiable token', () => {
    const token = generateRefreshToken(mockUser);
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(mockUser.id);
  });

  test('access token expires in 2 hours', () => {
    const token = generateAccessToken(mockUser);
    const decoded = verifyAccessToken(token);
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(2 * 60 * 60);
  });

  test('refresh token expires in 30 days', () => {
    const token = generateRefreshToken(mockUser);
    const decoded = verifyRefreshToken(token);
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(30 * 24 * 60 * 60);
  });

  test('tampered token fails verification', () => {
    const token = generateAccessToken(mockUser);
    expect(() => verifyAccessToken(token + 'tampered')).toThrow();
  });

  test('access token embeds the token version (tv) for revocation', () => {
    const decoded = verifyAccessToken(generateAccessToken({ ...mockUser, tokenVersion: 4 }));
    expect(decoded.tv).toBe(4);
  });

  test('refresh token embeds the token version (tv) for revocation', () => {
    const decoded = verifyRefreshToken(generateRefreshToken({ ...mockUser, tokenVersion: 7 }));
    expect(decoded.tv).toBe(7);
  });

  test('tv defaults to 0 when the user has no tokenVersion', () => {
    const decoded = verifyAccessToken(generateAccessToken(mockUser));
    expect(decoded.tv).toBe(0);
  });
});
