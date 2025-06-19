import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, User } from '@prisma/client';
import { sendNewsletterEmail } from '../utils/newsletterEmail.js';
import { UserPayload } from '../types/auth.js';

const prisma = new PrismaClient();

// Define the request body type for the newsletter
interface NewsletterData {
  subject: string;
  content: string;
  isHtml: boolean;
}

// Use the AuthRequest type from auth.ts
type AuthenticatedRequest = FastifyRequest & {
  user: UserPayload;
};

// Define a type for subscriber data
interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  newsletterSubscribed: boolean | null;
}

// Helper function to check if a user is subscribed to the newsletter
function isSubscribed(user: User): boolean {
  // Cast to any to access the newsletterSubscribed field which might not be in the type definition yet
  const userWithNewsletter = user as any;
  const isSubscribed = userWithNewsletter.newsletterSubscribed === true || 
                      userWithNewsletter.newsletterSubscribed === null || 
                      userWithNewsletter.newsletterSubscribed === undefined;
  return isSubscribed;
}

export const sendNewsletter = async (req: AuthenticatedRequest, reply: FastifyReply) => {
  try {
    const { subject, content, isHtml } = req.body as NewsletterData;
    const adminId = req.user.id;

    // Get all users who are verified and not deleted
    const users = await prisma.user.findMany({
      where: { 
        emailVerified: true,
        accountStatus: 'ACTIVE'
      }
    });

    // Filter users who are subscribed (either explicitly or by default)s
    const subscribers = users.filter(isSubscribed).map(user => {
      const userWithNewsletter = user as any;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        newsletterSubscribed: userWithNewsletter.newsletterSubscribed
      } as Subscriber;
    });

    if (subscribers.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'No active subscribers found',
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        await sendNewsletterEmail(subscriber.email, subject, content, isHtml);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        failedCount++;
        if (subscriber.email) {
          failedEmails.push(subscriber.email);
        }
      }
    }

    // Log the newsletter send
    console.log('Newsletter sent:', {
      subject,
      sentCount,
      failedCount,
      failedEmails,
      sentBy: adminId,
      isHtml,
      timestamp: new Date().toISOString()
    });

    return reply.status(200).send({
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        totalRecipients: subscribers.length,
        sentCount,
        failedCount,
        failedEmails,
      },
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to send newsletter',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getNewsletterStats = async (req: AuthenticatedRequest, reply: FastifyReply) => {
  try {
    // Get all users who are verified and not deleted
    const users = await prisma.user.findMany({
      where: { 
        emailVerified: true,
        accountStatus: 'ACTIVE'
      }
    });

    // Count users who are subscribed (either explicitly or by default)
    const totalSubscribers = users.filter(isSubscribed).length;

    // For now, we're not storing newsletter history
    const lastNewsletter = null;

    return reply.status(200).send({
      success: true,
      data: {
        totalSubscribers,
        lastNewsletterSent: lastNewsletter ? (lastNewsletter as any).createdAt : null,
      },
    });
  } catch (error) {
    console.error('Error getting newsletter stats:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to get newsletter stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
