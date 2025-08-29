import prisma from "../src/lib/prismaClient.js";
import { FastifyRequest, FastifyReply } from "fastify";
import { AuthRequest } from "../types/auth.js";
import { NotificationType } from "../types/enums.js";
import {
  CreateConversationBody,
  PaginationQuery,
  SendMessageBody,
  ParamWithConversationId,
  ParamWithMessageId,
} from "../types/auth.js";

export const createConversation = async (
  req: AuthRequest<CreateConversationBody>,
  reply: FastifyReply,
) => {
  try {
    const { participantIds, initialMessage } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length === 0
    ) {
      return reply.code(400).send({
        success: false,
        error: { message: "participantIds array is required" },
      });
    }

    // Check if conversation already exists between these participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: participantIds.map((id) => ({
          participants: {
            some: { id },
          },
        })),
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    if (existingConversation) {
      return reply.send({
        success: true,
        data: existingConversation,
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
        lastMessage: initialMessage || "",
        lastMessageAt: new Date(),
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    // If there's an initial message, create it
    if (initialMessage) {
      await prisma.message.create({
        data: {
          content: initialMessage,
          sender: { connect: { id: senderId } },
          recipient: {
            connect: {
              id:
                participantIds.find((id) => id !== senderId) ||
                participantIds[0],
            },
          },
          conversation: { connect: { id: conversation.id } },
        },
      });
    }

    return reply.send({
      success: true,
      data: conversation,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to create conversation" },
    });
  }
};

export const getConversations = async (
  req: AuthRequest<unknown, PaginationQuery>,
  reply: FastifyReply,
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            name: true,
            email: true,
            phone: true,
            bio: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    // Format the response
    const formattedConversations = conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
    }));

    return reply.send({
      success: true,
      data: {
        items: formattedConversations,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to fetch conversations" },
    });
  }
};

export const sendMessage = async (
  req: AuthRequest<SendMessageBody>,
  reply: FastifyReply,
) => {
  try {
    const { recipientId, content, listingId } = req.body;

    // Validate required fields
    if (!recipientId) {
      return reply.code(400).send({
        success: false,
        error: { message: "recipientId is required" },
      });
    }

    if (!content?.trim()) {
      return reply.code(400).send({
        success: false,
        error: { message: "message content cannot be empty" },
      });
    }

    if (!listingId) {
      return reply.code(400).send({
        success: false,
        error: { message: "listingId is required" },
      });
    }

    const senderId = req.user.id;

    // Check if this is a listing message
    if (listingId) {
      // Find or create a conversation for this listing
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  id: senderId,
                },
              },
            },
            {
              participants: {
                some: {
                  id: recipientId,
                },
              },
            },
            { listingId },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              connect: [{ id: senderId }, { id: recipientId }],
            },
            listingId,
            lastMessage: content,
            lastMessageAt: new Date(),
          },
        });
      }

      const message = await prisma.message.create({
        data: {
          content,
          sender: { connect: { id: senderId } },
          recipient: { connect: { id: recipientId } },
          conversation: { connect: { id: conversation.id } },
          listing: listingId ? { connect: { id: listingId } } : undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });

      // Create notification for the recipient
      await prisma.notification.create({
        data: {
          user: { connect: { id: recipientId } },
          type: NotificationType.NEW_MESSAGE,
          content: `${req.user.username} sent you a message about your listing`,
          relatedListing: listingId
            ? { connect: { id: listingId } }
            : undefined,
          relatedUser: { connect: { id: senderId } },
        },
      });

      // Update conversation's last message
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: content,
          lastMessageAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        data: {
          message,
          conversation,
        },
      });
    }

    // Regular message handling (non-listing messages)
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                id: senderId,
              },
            },
          },
          {
            participants: {
              some: {
                id: recipientId,
              },
            },
          },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: senderId }, { id: recipientId }],
          },
          lastMessage: content,
          lastMessageAt: new Date(),
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        recipient: { connect: { id: recipientId } },
        conversation: { connect: { id: conversation.id } },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    // Create notification for the recipient
    await prisma.notification.create({
      data: {
        user: { connect: { id: recipientId } },
        type: NotificationType.NEW_MESSAGE,
        content: `${req.user.username} sent you a message about your listing`,
        relatedUser: { connect: { id: senderId } },
        relatedListing: listingId ? { connect: { id: listingId } } : undefined,
      },
    });

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    return reply.send({
      success: true,
      data: {
        message,
        conversation,
      },
    });
  } catch (error: any) {

    // Handle Prisma errors
    if (error.code === "P2025") {
      return reply.code(404).send({
        success: false,
        error: {
          message: "Recipient, listing, or conversation not found",
          details: error.message,
        },
      });
    }

    // Handle other database constraint errors
    if (error.code?.startsWith("P2")) {
      return reply.code(400).send({
        success: false,
        error: {
          message: "Invalid data provided",
          details: error.message,
        },
      });
    }

    return reply.code(500).send({
      success: false,
      error: {
        message: "Failed to send message",
        details: error.message,
      },
    });
  }
};

export const getMessages = async (
  req: AuthRequest<unknown, PaginationQuery, ParamWithConversationId>,
  reply: FastifyReply,
) => {
  try {
    const { conversationId } = req.params;
    const { page = "1", limit = "20" } = req.query as {
      page?: string;
      limit?: string;
    };
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        OR: [{ senderId: req.user.id }, { recipientId: req.user.id }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: Number(limit),
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        recipientId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return reply.send({
      success: true,
      messages: messages.reverse(),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: "Failed to get messages",
    });
  }
};

export const deleteMessage = async (
  req: AuthRequest<unknown, unknown, ParamWithMessageId>,
  reply: FastifyReply,
) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return reply.code(404).send({
        success: false,
        error: "Message not found",
      });
    }

    if (message.senderId !== req.user.id) {
      return reply.code(403).send({
        success: false,
        error: "Not authorized to delete this message",
      });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return reply.send({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: "Failed to delete message",
    });
  }
};

export const deleteConversation = async (
  req: AuthRequest<unknown, unknown, ParamWithConversationId>,
  reply: FastifyReply,
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: "Conversation not found or you are not a participant",
      });
    }

    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: {
        conversationId: conversationId,
      },
    });

    // Delete the conversation
    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    reply.send({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      error: "Failed to delete conversation",
    });
  }
};
