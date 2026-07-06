import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as usersData from '../src/data/users';
import * as authService from '../src/services/authService';
import { verifyToken } from '../src/utils/jwt';
import { ApiError } from '../src/utils/ApiError';
import bcrypt from 'bcryptjs';

// The auth service is pure business logic on top of the users data layer, so we
// mock the data layer and assert the hashing/JWT/error behavior in isolation.
vi.mock('../src/data/users');

const mockedUsers = vi.mocked(usersData);

const baseUser = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Ada',
  darkMode: false,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.register', () => {
  it('hashes the password, creates the user, and returns a valid JWT', async () => {
    mockedUsers.findByEmail.mockResolvedValue(null);
    mockedUsers.createUser.mockImplementation(async (input) => {
      // Password must be hashed before it reaches the data layer.
      expect(input.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', input.passwordHash)).toBe(true);
      return { ...baseUser, email: input.email, name: input.name };
    });

    const result = await authService.register({
      email: 'a@b.com',
      password: 'password123',
      name: 'Ada',
    });

    expect(result.user.email).toBe('a@b.com');
    const payload = verifyToken(result.token);
    expect(payload.sub).toBe('u1');
    expect(payload.email).toBe('a@b.com');
  });

  it('rejects a duplicate email with 409', async () => {
    mockedUsers.findByEmail.mockResolvedValue({ ...baseUser, passwordHash: 'x' });
    await expect(
      authService.register({ email: 'a@b.com', password: 'password123', name: 'Ada' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('authService.login', () => {
  it('returns a token for correct credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    mockedUsers.findByEmail.mockResolvedValue({ ...baseUser, passwordHash });

    const result = await authService.login({ email: 'a@b.com', password: 'password123' });
    expect(verifyToken(result.token).sub).toBe('u1');
  });

  it('rejects a wrong password with 401', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    mockedUsers.findByEmail.mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      authService.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects an unknown email with 401 (no user enumeration)', async () => {
    mockedUsers.findByEmail.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'nope@b.com', password: 'whatever' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
