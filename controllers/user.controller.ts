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
  reply: FastifyReply,
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
  reply: FastifyReply,
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
 * Update user profile
 */
export const updateProfile = async (
  request: FastifyRequest,
  reply: FastifyReply,
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
    if (!/[0-9]/.test(phone)) {
      return reply.status(400).send({
        success: false,
        error: "Phone number is invalid",
        status: 400,
        data: null,
      });
    }
    if (phone) updates.phone = phone.trim();
    if (username) updates.username = username.trim();
    if (bio) updates.bio = bio.trim();
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth.trim();
    if (street) updates.street = street.trim();
    if (city) updates.city = city.trim();
    if (phone) updates.phone = phone.trim();

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
        user.password,
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
  reply: FastifyReply,
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
export const deleteUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
    });
    if (!user)
      return reply
        .status(404)
        .send({ success: false, error: "User not found", status: 404 });

    // Delete favorites, listings, etc. before user
    await prisma.favorite.deleteMany({ where: { userId: user.id } });
    await prisma.listing.deleteMany({ where: { userId: user.id } });

    await prisma.user.delete({ where: { id: user.id } });

    reply.status(200).send({
      success: true,
      data: { message: "Account and listings deleted successfully" },
      status: 200,
    });
  } catch (error) {
    console.error("Delete error:", error);
    reply
      .status(500)
      .send({ success: false, error: "Error deleting user", status: 500 });
  }
};

/**
 * Get user settings
 */
export const getUserSettings = async (
  request: FastifyRequest,
  reply: FastifyReply,
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
  reply: FastifyReply,
) => {
  try {
    const { preferences } = request.body as any;

    // Validate preferences structure
    if (!preferences || typeof preferences !== "object") {
      return reply.status(400).send({
        success: false,
        error: "Invalid preferences format",
        status: 400,
        data: null,
      });
    }

    // Ensure preferences has the correct structure
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
          promotions: true,
        },
      },
      currency: "USD",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
    };

    // Merge with defaults to ensure all required fields are present
    const updatedPreferences = {
      ...defaultPreferences,
      ...preferences,
      notifications: {
        ...defaultPreferences.notifications,
        ...(preferences.notifications || {}),
        emailNotifications: {
          ...defaultPreferences.notifications.emailNotifications,
          ...(preferences.notifications?.emailNotifications || {}),
        },
      },
    } as UserPreferences;

    const updatedUser = await prisma.user.update({
      where: { id: (request.user as any).id },
      data: {
        preferences: updatedPreferences,
      },
    });

    reply.status(200).send({
      success: true,
      data: updatedUser,
      status: 200,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    reply.status(500).send({
      success: false,
      error: "Error updating user settings",
      status: 500,
      data: null,
    });
  }
};
