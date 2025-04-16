import { Response } from "express";
import prisma from "../src/lib/prismaClient.js";
import { AuthRequest } from "../types/index.js";
import { NotificationType } from "../types/enums.js";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, content, listingId } = req.body;

    // Validate required fields
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: { message: "recipientId is required" },
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "message content cannot be empty" },
      });
    }

    if (!listingId) {
      return res.status(400).json({
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

      return res.json({
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

    res.json({
      success: true,
      data: {
        message,
        conversation,
      },
    });
  } catch (error: any) {
    console.error("Message error:", error);

    // Handle Prisma errors
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: {
          message: "Recipient, listing, or conversation not found",
          details: error.message,
        },
      });
    }

    // Handle other database constraint errors
    if (error.code?.startsWith("P2")) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid data provided",
          details: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to send message",
        details: error.message,
      },
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: req.user.id,
          },
        },
      },
      include: {
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
    });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get conversations",
    });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
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

    res.json({
      success: true,
      messages: messages.reverse(),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get messages",
    });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this message",
      });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
};
