import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { SignOptions, Secret } from 'jsonwebtoken';

type JWTExpiresIn = '24h' | '7d' | number;

export const SESSION_COOKIE_NAME = 'session_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

// Helper to append a cookie without overriding existing Set-Cookie headers
const appendSetCookie = (reply: FastifyReply, cookie: string) => {
  const existing = reply.raw.getHeader('Set-Cookie');

  if (!existing) {
    reply.raw.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    reply.raw.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    reply.raw.setHeader('Set-Cookie', [existing as string, cookie]);
  }
};

export const setSessionCookie = (reply: FastifyReply, token: string, maxAge: number) => {
  const options = {
    Path: '/',
    Secure: process.env.NODE_ENV === 'production',
    HttpOnly: true,
    SameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    "Max-Age": maxAge,
    Domain: process.env.NODE_ENV === 'production' ? '.samsar.app' : undefined
  } as const;

  const cookie = `${SESSION_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) =>
      typeof v === 'boolean' ? k : `${k}=${v}`,
    )
    .join('; ')}`;

  appendSetCookie(reply, cookie);
};

export const setRefreshCookie = (reply: FastifyReply, token: string, maxAge: number) => {
  const options = {
    Path: '/auth/refresh',
    Secure: process.env.NODE_ENV === 'production',
    HttpOnly: true,
    SameSite: 'Lax',
    "Max-Age": maxAge,
    ...(process.env.COOKIE_DOMAIN && { Domain: process.env.COOKIE_DOMAIN })
  } as const;

  const cookie = `${REFRESH_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) =>
      typeof v === 'boolean' ? k : `${k}=${v}`,
    )
    .join('; ')}`;

  appendSetCookie(reply, cookie);
};

export const clearSessionCookies = (reply: FastifyReply) => {
  const options = {
    path: '/',
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  };

  reply.raw.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Max-Age=0; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`);
  
  const refreshOptions = {
    path: '/auth/refresh',
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  };

  reply.raw.setHeader('Set-Cookie', `${REFRESH_COOKIE_NAME}=; Max-Age=0; ${Object.entries(refreshOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`);
};

export const generateToken = (payload: any, expiresIn: JWTExpiresIn): string => {
  const options: SignOptions = {
    expiresIn: typeof expiresIn === 'number' ? expiresIn : expiresIn,
    algorithm: 'HS256' as const
  };
  const secret: Secret = config.jwtSecret;
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { [key: string]: any };
    return decoded;
  } catch (error) {
    throw error;
  }
};
