import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../src/lib/prismaClient.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { uploadToR2 } from "../config/cloudflareR2.js";
import { Prisma, User } from "@prisma/client";
import {
  AuthRequest,
  UserPreferences,
  InputJsonValue,
} from "../types/index.js";
import { MultipartFile } from "@fastify/multipart";

interface UpdateData {
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  bio?: string;
  profilePicture?: string;
  preferences?: Prisma.InputJsonValue;
  dateOfBirth?: string;
  street?: string;
  city?: string;
}

interface UploadResult {
  url: string;
}

// Define type for user with preferences
type UserWithPreferences = User & {
  preferences: UserPreferences | null;
};

// Define route parameters type
interface UserPublicDetailsParams {
  id: string;
}

/**
 * Get the user's profile
 */
export const getUserProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
      include: {
        listings: {
          include: {
            images: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
        status: 404,
        data: null,
      });
    }

    reply.status(200).send({
      success: true,
      data: user,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    reply.status(500).send({
      success: false,
      error: "Error fetching user profile",
      status: 500,
      data: null,
    });
  }
};

/**
 * Get the user's public profile
 */
export const getUserPublicDetails = async (
  request: FastifyRequest<{ Params: UserPublicDetailsParams }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: {
          include: {
            images: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      console.log("User not found");
      return reply.status(404).send({
        success: false,
        error: "User not found",
        status: 404,
        data: null,
      });
    }
    console.log("User found:", user);

    return reply.status(200).send({
      success: true,
      data: user,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    reply.status(500).send({
      success: false,
      error: "Error fetching user profile",
      status: 500,
      data: null,
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
    });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
        status: 404,
        data: null,
      });
    }

    const updates: UpdateData = {};

    const {
      email,
      phone,
      username,
      password,
      currentPassword,
      bio,
      dateOfBirth,
      street,
      city,
    } = request.body as any;

    if (email && !validator.isEmail(email)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid email format",
        status: 400,
        data: null,
      });
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({
          success: false,
          error: "Email already in use",
          status: 400,
          data: null,
        });
      }
      updates.email = email.trim();
    }
    // Only validate phone if it's provided and not empty
    if (phone !== undefined && phone !== "" && !/[0-9]/.test(phone)) {
      return reply.status(400).send({
        success: false,
        error: "Phone number is invalid",
        status: 400,
        data: null,
      });
    }
    // Handle fields that can be completely removed when empty
    if (username) updates.username = username.trim();

    // For optional fields, use undefined to remove them completely when empty
    if (phone !== undefined) {
      updates.phone = phone === "" ? undefined : phone.trim();
    }

    if (bio !== undefined) {
      updates.bio = bio === "" ? undefined : bio.trim();
    }

    if (dateOfBirth !== undefined) {
      updates.dateOfBirth = dateOfBirth === "" ? undefined : dateOfBirth.trim();
    }

    if (street !== undefined) {
      updates.street = street === "" ? undefined : street.trim();
    }

    if (city !== undefined) {
      updates.city = city === "" ? undefined : city.trim();
    }

    if (password) {
      // Verify current password first
      if (!currentPassword) {
        return reply.status(400).send({
          success: false,
          error: "Current password is required",
          status: 400,
          data: null,
        });
      }

      // Check if current password is correct
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return reply.status(401).send({
          success: false,
          error: "Current password is incorrect",
          status: 401,
          data: null,
        });
      }

      // Validate new password requirements
      if (password.length < 8) {
        return reply.status(400).send({
          success: false,
          error: "Password must be at least 8 characters long",
          status: 400,
          data: null,
        });
      }
      if (!/[A-Z]/.test(password)) {
        return reply.status(400).send({
          success: false,
          error: "Password must contain at least one uppercase letter",
          status: 400,
          data: null,
        });
      }
      if (!/[a-z]/.test(password)) {
        return reply.status(400).send({
          success: false,
          error: "Password must contain at least one lowercase letter",
          status: 400,
          data: null,
        });
      }
      if (!/[0-9]/.test(password)) {
        return reply.status(400).send({
          success: false,
          error: "Password must contain at least one number",
          status: 400,
          data: null,
        });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Check if profilePicture URL was set by the middleware
    if (request.body && (request.body as any).profilePicture) {
      updates.profilePicture = (request.body as any).profilePicture;
    }

    const updatedUser = await prisma.user.update({
      where: { id: (request.user as any).id },
      data: updates,
    });

    reply.status(200).send({
      success: true,
      data: updatedUser,
      status: 200,
    });
  } catch (error) {
    console.error("Update error:", error);
    reply.status(500).send({
      success: false,
      error: "Error updating profile",
      status: 500,
      data: null,
    });
  }
};

/**
 * Get listings of current user
 */
export const getUserListings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { userId: (request.user as any).id },
      include: {
        images: true,
        favorites: true,
      },
    });

    reply.status(200).send({
      success: true,
      data: { listings },
      status: 200,
    });
  } catch (error) {
    console.error("Listings fetch error:", error);
    reply.status(500).send({
      success: false,
      error: "Error fetching user listings",
      status: 500,
      data: null,
    });
  }
};

/**
 * Delete user and related data
 */
interface DeleteUserRequest {
  password: string;
}

export const deleteUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log("Delete user request received");
    console.log("Request user:", request.user);

    const body = (await request.body) as DeleteUserRequest;
    console.log("Request body received:", { ...body, password: "[REDACTED]" });
    const { password } = body;

    if (!password) {
      return reply.status(400).send({
        success: false,
        error: "Password is required",
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
    });
    if (!user) {
      return reply
        .status(404)
        .send({ success: false, error: "User not found", status: 404 });
    }

    // Verify the provided password matches the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({
        success: false,
        error: "Invalid password",
        status: 401,
      });
    }

    // Delete in proper order to respect foreign key constraints
    try {
      // Step 1: Get all the user's listings
      const userListings = await prisma.listing.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      const listingIds = userListings.map((listing) => listing.id);
      console.log(`Found ${listingIds.length} listings to delete`);

      // Step 2: Get all user's messages
      const userMessages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: user.id }, { recipientId: user.id }],
        },
        select: { id: true },
      });
      const messageIds = userMessages.map((msg) => msg.id);

      // Step 3: Delete all notifications
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { relatedUserId: user.id },
            { relatedListingId: { in: listingIds } },
            { relatedMessageId: { in: messageIds } },
          ],
        },
      });
      console.log("Deleted all notifications");

      // Step 4: Delete messages
      await prisma.message.deleteMany({
        where: {
          OR: [{ senderId: user.id }, { recipientId: user.id }],
        },
      });
      console.log("Deleted all user messages");

      // Step 5: Delete favorites
      await prisma.favorite.deleteMany({
        where: {
          OR: [{ userId: user.id }, { listingId: { in: listingIds } }],
        },
      });
      console.log("Deleted all favorites");

      // Step 6: Delete listing-related data
      if (listingIds.length > 0) {
        // Delete VehicleDetails and RealEstateDetails first (they have foreign key constraints)
        await prisma.vehicleDetails.deleteMany({
          where: { listingId: { in: listingIds } },
        });

        await prisma.realEstateDetails.deleteMany({
          where: { listingId: { in: listingIds } },
        });

        // Delete other listing-related data
        await prisma.image.deleteMany({
          where: { listingId: { in: listingIds } },
        });

        await prisma.attribute.deleteMany({
          where: { listingId: { in: listingIds } },
        });

        await prisma.feature.deleteMany({
          where: { listingId: { in: listingIds } },
        });
        console.log("Deleted all listing-related data");
      }

      // Step 7: Handle conversations
      // First find user's conversations
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: { some: { id: user.id } },
        },
        include: {
          participants: true,
        },
      });

      // Find single-participant conversations (only the user)
      const singleParticipantConvIds = userConversations
        .filter((conv) => conv.participants.length === 1)
        .map((conv) => conv.id);

      // Delete single-participant conversations
      if (singleParticipantConvIds.length > 0) {
        await prisma.conversation.deleteMany({
          where: { id: { in: singleParticipantConvIds } },
        });
        console.log("Deleted orphaned conversations");
      }

      // For multi-participant conversations, disconnect the user
      const multiParticipantConvs = userConversations.filter(
        (conv) => conv.participants.length > 1
      );

      // Disconnect user from each conversation individually
      for (const conv of multiParticipantConvs) {
        try {
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              participants: {
                disconnect: { id: user.id },
              },
            },
          });
        } catch (err) {
          console.error(
            `Failed to disconnect user from conversation ${conv.id}:`,
            err
          );
          // Continue with other operations even if this fails
        }
      }
      console.log("Updated conversations");

      // Step 8: Delete listings
      await prisma.listing.deleteMany({
        where: { userId: user.id },
      });
      console.log("Deleted all listings");

      // Step 9: Finally delete the user
      await prisma.user.delete({ where: { id: user.id } });
      console.log("Deleted user account");

      reply.status(200).send({
        success: true,
        data: { message: "Account and listings deleted successfully" },
        status: 200,
      });
    } catch (deleteError) {
      console.error("Error during deletion process:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("Delete error:", error);
    reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : "Error deleting user",
      status: 500,
    });
  }
};

/**
 * Get user settings
 */
export const getUserSettings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: (request.user as any).id },
    })) as UserWithPreferences;

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
        status: 404,
        data: null,
      });
    }

    // Initialize default preferences
    const defaultPreferences: UserPreferences = {
      language: "en",
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false,
        enabledTypes: [],
        emailNotifications: {
          newMessage: true,
          listingUpdates: true,
          promotions: false,
        },
      },
      currency: "USD",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      autoLocalization: true,
    };

    // Use the stored preferences or default ones
    const userPreferences = user.preferences || defaultPreferences;

    reply.status(200).send({
      success: true,
      data: { preferences: userPreferences },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    reply.status(500).send({
      success: false,
      error: "Error fetching user settings",
      status: 500,
      data: null,
    });
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log("Request body:", request.body);
    const { notifications, privacy } = request.body as any;

    // Validate required fields
    if (!notifications || typeof notifications !== "object") {
      return reply.status(400).send({
        success: false,
        error: "Invalid notifications settings format",
        status: 400,
        data: null,
      });
    }

    if (!privacy || typeof privacy !== "object") {
      return reply.status(400).send({
        success: false,
        error: "Invalid privacy settings format",
        status: 400,
        data: null,
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: (request.user as any).id },
      data: {
        // Flatten notifications
        listingNotifications: notifications?.listingUpdates ?? true,
        messageNotifications: notifications?.newInboxMessages ?? true,
        loginNotifications: notifications.loginNotifications ?? false,
        // Flatten privacy settings
        privateProfile: privacy.profileVisibility === "private" ? true : false,
        allowMessaging: privacy?.allowMessaging ?? true,
        showEmail: privacy?.showEmail ?? true,
        showOnlineStatus: privacy?.showOnlineStatus ?? true,
        showPhoneNumber: privacy?.showPhone ?? true,
      },
    });

    if (!updatedUser) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
        status: 404,
        data: null,
      });
    }

    return reply.status(200).send({
      success: true,
      data: { ...updatedUser, password: undefined },
      status: 200,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return reply.status(500).send({
      success: false,
      error: "Error updating user settings",
      status: 500,
      data: null,
    });
  }
};

// -------------------------------
// Admin: Get all users summary
// -------------------------------
/**
 * Get list of all users (admin only)
 */
export const getAllUsersAdmin = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Select only required fields plus listings count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        subscriptionStatus: true,
        role: true,
        createdAt: true,
        _count: {
          select: { listings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      subscriptionStatus: u.subscriptionStatus,
      role: u.role,
      listings: u._count.listings,
      createdAt: u.createdAt,
    }));

    return reply.send({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching users list:", error);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch users list",
    });
  }
};

// Admin: Update user role
export const updateUserRoleAdmin = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { role: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { role } = request.body;

  const allowedRoles = [
    "FREE_USER",
    "PREMIUM_USER",
    "BUSINESS_USER",
    "ADMIN",
    "MODERATOR",
  ];

  if (!allowedRoles.includes(role)) {
    return reply.code(400).send({ success: false, error: "Invalid role" });
  }

  try {
    await prisma.user.update({ where: { id }, data: { role: role as any } });
    return reply.send({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return reply.code(500).send({ success: false, error: "Update failed" });
  }
};
