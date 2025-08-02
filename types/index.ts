import { Prisma } from "@prisma/client";

// Central type exports
export * from "./auth.js";
export * from "./shared.js";

// Prisma-specific types
export type InputJsonValue = Prisma.InputJsonValue;

// User preferences types
export interface UserPreferences {
  [key: string]: any; // Add index signature for Prisma JSON compatibility
  language: string;
  theme: "light" | "dark";
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    enabledTypes?: string[];
    emailNotifications: {
      newMessage: boolean;
      listingUpdates: boolean;
      promotions: boolean;
    };
  };
  currency: string;
  timezone: string;
  dateFormat: string;
}

// Message types
export interface MessageData {
  senderId: string;
  recipientId: string;
  content: string;
  listingId?: string;
}

// Conversation types
export interface ConversationData {
  userId: string;
  listingId?: string;
}
