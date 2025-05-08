import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";

// CAPTCHA verification middleware
export const verifyCaptcha = async (
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
) => {
  try {
    // Skip CAPTCHA verification in development mode if configured
    if (process.env.NODE_ENV === "development" && process.env.SKIP_CAPTCHA === "true") {
      return done();
    }

    const body = request.body as any;
    const captchaToken = body.captchaToken;

    // Check if CAPTCHA token is provided
    if (!captchaToken) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "CAPTCHA_REQUIRED",
          message: "CAPTCHA verification is required"
        }
      });
    }

    // Verify CAPTCHA token with Google reCAPTCHA
    const captchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!captchaSecret) {
      console.error("RECAPTCHA_SECRET_KEY is not set in environment variables");
      return reply.code(500).send({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Server configuration error"
        }
      });
    }

    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecret}&response=${captchaToken}`;
    const response = await axios.post(verificationURL);
    const data = response.data;

    if (!data.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "INVALID_CAPTCHA",
          message: "CAPTCHA verification failed",
          details: data["error-codes"]
        }
      });
    }

    // CAPTCHA verification successful
    return done();
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An error occurred during CAPTCHA verification"
      }
    });
  }
};
