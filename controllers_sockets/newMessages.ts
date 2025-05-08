import prisma from "../src/lib/prismaClient.js";
import { io } from "../server.js";
import { usersSocketId } from "../server.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../constants/socketEvent.js";
import { NewMessageData } from "../types/socket.js";

export const newMessages = async ({
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
  let messagRresult;
  let notificationResult;
  try {
    messagRresult = await prisma.message.create({
      data: {
        content: content,
        senderId: senderId,
        recipientId: recipientId,
        conversationId: conversationId,
        createdAt: createdAt,
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
    console.log("Message created:", messagRresult);
    console.log("Notification created:>>>>>>>>>>>>", notificationResult);
  } catch (error) {
    console.log("Error creating message:", error);
  }
  const recipientSocketId = usersSocketId.get(recipientId);
  if (recipientSocketId) {
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
