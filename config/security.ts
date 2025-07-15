import { FastifyInstance, FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";

const ONE_YEAR = 365 * 24 * 60 * 60; // 1 year in seconds

// Security headers configuration
export const configureSecurityHeaders = (fastify: FastifyInstance) => {
  // Configure helmet with security headers
  fastify.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        blockAllMixedContent: [],
        fontSrc: ["'self'", 'https:', 'data:'],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'"],
        imgSrc: [
          "'self'",
          'data:',
          'https:',
          'http:',
          'https://*.tile.openstreetmap.org',
          'https://*.googleapis.com',
          'https://*.gstatic.com'
        ],
        objectSrc: ["'none'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://maps.googleapis.com',
          'https://*.stripe.com',
          'https://js.stripe.com'
        ],
        scriptSrcAttr: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net'
        ],
        connectSrc: [
          "'self'",
          'https://*.google-analytics.com',
          'https://*.analytics.google.com',
          'https://*.stripe.com',
          'wss://*',
          'ws://*',
          'https://api.mapbox.com'
        ],
        formAction: [
          "'self'",
          'https://*.stripe.com',
          'https://*.paypal.com'
        ],
        upgradeInsecureRequests: [],
        // Report violations to our CSP reporting endpoint
        reportUri: process.env.NODE_ENV === 'production' 
          ? '/api/security/csp-report' 
          : null,
      },
      reportOnly: process.env.NODE_ENV !== 'production',
    },
    hsts: {
      maxAge: ONE_YEAR,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
  });
};

// Secure cookies configuration
export const configureSecureCookies = (fastify: FastifyInstance) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'your-strong-cookie-secret',
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const, // Always use lax for cross-origin
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      domain: isProduction ? '.samsar.app' : undefined,
      // Remove partitioned flag for cross-origin compatibility
      // partitioned: true
    }
  });
  };
;

// Security middleware
type SecurityHeaders = {
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Feature-Policy'?: string;
  [key: string]: string | undefined;
};

export const securityMiddleware = (fastify: FastifyInstance): void => {
  // Add security headers hook
  fastify.addHook('onSend', (request, reply, payload, done) => {
    try {
      // Remove X-Powered-By header (redundant with helmet, but just in case)
      reply.header('X-Powered-By', 'Samsar App');
      
      // Define security headers with TypeScript types
      const securityHeaders: SecurityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // Feature Policy (legacy, replaced by Permissions-Policy but kept for compatibility)
        'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'"
      };
      
      // Set all security headers with type safety
      for (const [header, value] of Object.entries(securityHeaders)) {
        if (value && !reply.getHeader(header)) {
          try {
            reply.header(header, value);
          } catch (error) {
            fastify.log.warn(`Failed to set security header ${header}:`, error);
          }
        }
      }
      
      done();
    } catch (error) {
      fastify.log.error('Error in security middleware:', error);
      // Continue with the response even if there was an error setting headers
      done();
    }
  });
};

// CSP Reporting endpoint
type CspReport = {
  'csp-report'?: {
    'document-uri'?: string;
    referrer?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'disposition'?: string;
    'blocked-uri'?: string;
    'status-code'?: number;
    'script-sample'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
};

export const setupCSPReporting = (fastify: FastifyInstance): void => {
  fastify.post<{ Body: CspReport }>(
    '/api/security/csp-report', 
    { logLevel: 'warn' },
    async (request, reply) => {
      try {
        const report = request.body;
        // Log CSP violations with structured data
        if (report?.['csp-report']) {
          fastify.log.warn({
            msg: 'CSP Violation',
            report: report['csp-report'],
            timestamp: new Date().toISOString()
          });
        } else {
          fastify.log.warn('Malformed CSP report received:', report);
        }
        
        return reply.code(204).send(); // No content response
      } catch (error) {
        fastify.log.error('Error processing CSP report:', error);
        return reply.code(400).send({ 
          status: 'error', 
          message: 'Invalid report format' 
        });
      }
    }
  );
};

// Rate limiting configuration
type RateLimitConfig = {
  [key: string]: {
    max: number;
    timeWindow: string | number;
    keyGenerator?: (req: FastifyRequest) => string;
    errorResponseBuilder?: (req: FastifyRequest, context: { after: string; max: number }) => {
      statusCode: number;
      error: string;
      message: string;
      code: string;
    };
    cache?: number;
    whitelist?: string[];
    skipOnError?: boolean;
  };
};

export const rateLimitConfig: RateLimitConfig = {
  global: {
    max: 100, // 100 requests per minute per IP by default
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      try {
        // Use X-Forwarded-For header if behind a proxy, otherwise use the direct IP
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
               req.socket.remoteAddress ||
               'unknown-ip';
      } catch (error) {
        req.log.warn('Failed to generate rate limit key:', error);
        return 'error-ip';
      }
    },
    errorResponseBuilder: (req, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${context.after}.`,
        code: 'RATE_LIMIT_EXCEEDED',
      };
    },
    skipOnError: true, // Continue processing even if Redis is down
  },
  
  // Stricter limits for authentication endpoints
  auth: {
    max: 5, // 5 requests per minute
    timeWindow: '1 minute',
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    }),
  },
  
  // Public API endpoints (more generous limits)
  publicApi: {
    max: 1000, // 1000 requests per hour
    timeWindow: '1 hour',
  },
  
  // Admin endpoints (stricter controls)
  admin: {
    max: 30, // 30 requests per minute
    timeWindow: '1 minute',
    whitelist: process.env.ADMIN_IPS?.split(',') || [],
  },
};
