import { FastifyRequest, FastifyReply } from 'fastify';

export const diagnosticController = {
  // Health check endpoint
  async health(request: FastifyRequest, reply: FastifyReply) {
    const headers = request.headers;
    const ip = request.ip;
    
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'Railway Backend',
      ip: ip,
      country: headers['cf-ipcountry'] || 'Unknown',
      ray: headers['cf-ray'] || 'No Cloudflare',
      userAgent: headers['user-agent'],
      accessible: true
    });
  },

  // Detailed headers for debugging
  async headers(request: FastifyRequest, reply: FastifyReply) {
    const headers = request.headers;
    const ip = request.ip;
    
    // Extract Cloudflare specific headers
    const cloudflareHeaders = {
      'cf-ipcountry': headers['cf-ipcountry'],
      'cf-ray': headers['cf-ray'],
      'cf-connecting-ip': headers['cf-connecting-ip'],
      'cf-visitor': headers['cf-visitor'],
      'cf-request-id': headers['cf-request-id']
    };

    // Extract Vercel specific headers
    const vercelHeaders = {
      'x-vercel-id': headers['x-vercel-id'],
      'x-vercel-cache': headers['x-vercel-cache'],
      'x-vercel-execution-region': headers['x-vercel-execution-region']
    };

    // Extract Railway specific headers
    const railwayHeaders = {
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-forwarded-proto': headers['x-forwarded-proto'],
      'x-forwarded-host': headers['x-forwarded-host']
    };

    return reply.send({
      timestamp: new Date().toISOString(),
      clientIp: ip,
      realIp: headers['cf-connecting-ip'] || headers['x-forwarded-for'] || ip,
      country: headers['cf-ipcountry'] || 'Unknown',
      userAgent: headers['user-agent'],
      cloudflare: cloudflareHeaders,
      vercel: vercelHeaders,
      railway: railwayHeaders,
      allHeaders: headers,
      geoblockingCheck: {
        isCloudflare: !!headers['cf-ray'],
        isVercel: !!headers['x-vercel-id'],
        isRailway: !!headers['x-forwarded-for'],
        country: headers['cf-ipcountry'],
        potentialBlock: headers['cf-ipcountry'] === 'SY' ? 'WARNING: Syrian IP detected' : 'No geo-blocking detected'
      }
    });
  },

  // Test endpoint specifically for Syrian users
  async syriaTest(request: FastifyRequest, reply: FastifyReply) {
    const country = request.headers['cf-ipcountry'];
    const ip = request.ip;
    const realIp = request.headers['cf-connecting-ip'] || request.headers['x-forwarded-for'] || ip;

    // Log this request for analysis

    return reply.send({
      message: 'If you can see this, the backend is accessible from Syria',
      timestamp: new Date().toISOString(),
      yourIp: realIp,
      detectedCountry: country,
      isFromSyria: country === 'SY',
      backendProvider: 'Railway',
      status: 'SUCCESS - Backend accessible',
      nextSteps: country === 'SY' ? [
        '✅ Railway backend is accessible from Syria',
        '❌ Check if Vercel frontend is blocked',
        '💡 Consider using a non-Vercel mirror for Syrian users'
      ] : [
        'This test is designed for Syrian users',
        'Your country code: ' + (country || 'Unknown')
      ]
    });
  },

  // Connectivity test for different providers
  async providerTest(request: FastifyRequest, reply: FastifyReply) {
    const country = request.headers['cf-ipcountry'];
    const isCloudflare = !!request.headers['cf-ray'];
    const isVercel = !!request.headers['x-vercel-id'];
    
    return reply.send({
      timestamp: new Date().toISOString(),
      country: country,
      providers: {
        cloudflare: {
          detected: isCloudflare,
          ray: request.headers['cf-ray'],
          status: isCloudflare ? 'Connected via Cloudflare' : 'Direct connection'
        },
        vercel: {
          detected: isVercel,
          id: request.headers['x-vercel-id'],
          region: request.headers['x-vercel-execution-region'],
          status: isVercel ? 'Proxied via Vercel' : 'Direct to Railway'
        },
        railway: {
          detected: true,
          status: 'Railway backend accessible'
        }
      },
      recommendations: country === 'SY' ? {
        frontend: isVercel ? 'WARNING: Vercel may be geo-blocked in Syria' : 'Frontend accessible',
        backend: 'Railway backend is accessible',
        solution: 'Consider hosting frontend mirror outside Vercel for Syrian users'
      } : {
        status: 'All providers accessible from your location'
      }
    });
  }
};
