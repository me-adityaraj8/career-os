import bcrypt from 'bcryptjs';
import * as usersData from '../data/users';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import type { User } from '../types';

const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  token: string;
  user: User;
}

/**
 * Register a new user. Hashes the password with bcrypt and returns a signed JWT.
 * Throws 409 if the email is already taken.
 */
export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  const existing = await usersData.findByEmail(input.email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await usersData.createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  return { token: signToken({ sub: user.id, email: user.email }), user };
}

/**
 * Authenticate with email/password. Uses a constant-ish flow (always compares a
 * hash) and returns a generic error so we don't leak whether the email exists.
 */
export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const found = await usersData.findByEmail(input.email);
  // Compare against a dummy hash when the user is missing to reduce timing signal.
  const hash = found?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv';
  const ok = await bcrypt.compare(input.password, hash);

  if (!found || !ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const user: User = {
    id: found.id,
    email: found.email,
    name: found.name,
    darkMode: found.darkMode,
    createdAt: found.createdAt,
  };
  return { token: signToken({ sub: user.id, email: user.email }), user };
}
