// Provide deterministic env for unit tests so importing the config module (which
// requires DATABASE_URL/JWT_SECRET) never depends on a real .env or database.
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'test_secret';
process.env.NODE_ENV = 'test';
