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
    console.log(err);
  }
};

export const newMessagesHeplerFun = async ({
  content,
  senderId,
  recipientId,
  conversationId,
  createdAt,
}: NewMessageData) => {
  console.log("New message data:>>>>>>>>>>>>>>>>", {
    content,
    senderId,
    recipientId,
    conversationId,
    createdAt,
  });
  if (await isMessageAllow(recipientId)) return;
  let messagRresult: MessageWithSenderAndRecipient | null = null;
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
        sender: true,
        recipient: true,
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

    if (messagRresult)
      sendNewMessageNotificationEmail(messagRresult.recipient.email, {
        senderName: messagRresult.sender.username,
        recipientName: messagRresult.recipient.username,
        conversationId: messagRresult.conversationId,
      });
    console.log("Message created:", messagRresult);
    console.log("Notification created:>>>>>>>>>>>>", notificationResult);
  } catch (error) {
    console.log("Error creating message:", error);
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
