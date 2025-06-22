import { Prisma } from "@prisma/client";

export interface NewMessageData {
  content: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  createdAt: Date;
}

export interface PriceChangeData {
  listingId: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  percentReduction: number;
  userId: string;
}

export type MessageWithSenderAndRecipient = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    recipient: true;
  };
}>;

export type NotificationWithSenderAndRecipient =
  Prisma.NotificationGetPayload<{}>;
