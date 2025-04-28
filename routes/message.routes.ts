import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  createConversation,
  getConversations,
  deleteConversation,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(authenticate);

// Conversations routes
router.get(
  "/conversations",
  getConversations as unknown as express.RequestHandler,
);
router.post(
  "/conversations",
  createConversation as unknown as express.RequestHandler,
);
router.delete(
  "/conversations/:conversationId",
  deleteConversation as unknown as express.RequestHandler,
);

// Messages routes
router.post("/", sendMessage as unknown as express.RequestHandler);
router.get(
  "/:conversationId",
  getMessages as unknown as express.RequestHandler,
);
router.delete(
  "/:messageId",
  deleteMessage as unknown as express.RequestHandler,
);

// Listing message routes
router.post(
  "/listings/messages",
  sendMessage as unknown as express.RequestHandler,
);

export default router;
