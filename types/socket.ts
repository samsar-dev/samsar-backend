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
