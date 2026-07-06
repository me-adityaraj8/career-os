import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

/** Sign a JWT for an authenticated user. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

/** Verify and decode a JWT. Throws if invalid/expired. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
