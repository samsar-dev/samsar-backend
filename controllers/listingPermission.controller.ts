import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface UserWithListings {
  id: string;
  role: 'FREE_USER' | 'PREMIUM_USER' | 'BUSINESS_USER' | 'ADMIN' | 'MODERATOR';
  maxListings: number | null;
  listingRestriction: string | null;
}

export const getListingPermission = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = request.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        maxListings: true,
        listingRestriction: true
      }
    }) as UserWithListings | null;

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const listingCount = await prisma.listing.count({
      where: { userId }
    });

    // Admins and moderators can always create listings
    const isAdmin = user.role === 'ADMIN';
    const isModerator = user.role === 'MODERATOR';
    const canCreate = isAdmin || isModerator || 
                     (user.maxListings !== null ? listingCount < user.maxListings : false);

    return {
      canCreate,
      maxListings: user.maxListings || 1,
      currentListings: listingCount,
      userRole: user.role,
      listingRestriction: user.listingRestriction || 'NONE'
    };
  } catch (error) {
    console.error('Error getting listing permission:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};
