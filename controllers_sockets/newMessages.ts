import prisma from "../src/lib/prismaClient.js";
import { io } from "../server.js";
import { usersSocketId } from "../server.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../constants/socketEvent.js";
import {
  MessageWithSenderAndRecipient,
  NewMessageData,
  NotificationWithSenderAndRecipient,
} from "../types/socket.js";
import { Prisma } from "@prisma/client";
import { sendNewMessageNotificationEmail } from "../utils/email.temp.utils.js";
import { firebaseNotificationService } from "../services/firebase-admin.service.js";

export const newMessages = async ({
  content,
  senderId,
  recipientId,
  conversationId,
  createdAt,
}: NewMessageData) => {
  let messageNotifications = true;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: recipientId,
      },
      select: {
        messageNotifications: true,
      },
    });
    if (user && user.messageNotifications) {
      messageNotifications = user.messageNotifications;
    }

    if (messageNotifications)
      newMessagesHeplerFun({
        content,
        senderId,
        recipientId,
        conversationId,
        createdAt,
      });
  } catch (err) {
  }
};

export const newMessagesHeplerFun = async ({
  content,
  senderId,
  recipientId,
  conversationId,
  createdAt,
}: NewMessageData) => {
  if (await isMessageAllow(recipientId)) return;
  let messagRresult: any = null;
  let notificationResult: NotificationWithSenderAndRecipient | null = null;
  try {
    messagRresult = await prisma.message.create({
      data: {
        content: content,
        senderId: senderId,
        recipientId: recipientId,
        conversationId: conversationId,
        createdAt: createdAt,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
            fcmToken: true,
          },
        },
      },
    });
    notificationResult = await prisma.notification.create({
      data: {
        type: "NEW_MESSAGE",
        content: content,
        userId: recipientId,
        relatedId: conversationId,
        read: false,
        createdAt: createdAt,
      },
      include: {
        user: true,
      },
    });

    if (messagRresult) {
      // Send email notification
      sendNewMessageNotificationEmail(messagRresult.recipient.email, {
        senderName: messagRresult.sender.username,
        recipientName: messagRresult.recipient.username,
        conversationId: messagRresult.conversationId,
      });

      // Send push notification if recipient has FCM token
      if (messagRresult.recipient.fcmToken) {
        try {
          await firebaseNotificationService.sendMessageNotification(
            messagRresult.recipient.fcmToken,
            {
              title: `💬 ${messagRresult.sender.username}`,
              body: content.length > 50 ? content.substring(0, 50) + "..." : content,
              senderId: messagRresult.senderId,
              senderName: messagRresult.sender.username,
              conversationId: messagRresult.conversationId,
              messageId: messagRresult.id,
            }
          );
        } catch (error) {
        }
      } else {
      }
    }
  } catch (error) {
  }
  const recipientSocketId = usersSocketId.get(recipientId);
  if (recipientSocketId && messagRresult && notificationResult) {
    io.to(recipientSocketId).emit(NEW_MESSAGE, {
      id: messagRresult.id,
      senderId: messagRresult.senderId,
      recipientId: recipientId,
      content: messagRresult.content,
      createdAt: messagRresult.createdAt,
      read: messagRresult.read,
      conversationId: messagRresult.conversationId,
    });
    io.to(recipientSocketId).emit(NEW_MESSAGE_ALERT, {
      id: notificationResult.id,
      type: notificationResult.type,
      content: notificationResult.content,
      createdAt: notificationResult.createdAt.toISOString(),
      read: notificationResult.read,
      userId: recipientId,
      relatedId: notificationResult.relatedId,
    });
  }
};

async function isMessageAllow(recipientId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: recipientId,
    },
    select: {
      allowMessaging: true,
    },
  });
  if (user?.allowMessaging) {
    return true;
  }
  return false;
}
