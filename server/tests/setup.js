process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_minimum';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_minimum';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_dummy';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || null;
process.env.DB_NAME = 'apexfitness_test';
