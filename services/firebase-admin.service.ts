import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // You'll need to add your Firebase service account key
  // For now, using environment variables for configuration
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

export interface MessageNotificationData extends PushNotificationData {
  senderId: string;
  senderName: string;
  conversationId: string;
  messageId: string;
}

class FirebaseNotificationService {
  private messaging = getMessaging();

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    fcmToken: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#007BFF',
            sound: 'default',
            channelId: 'high_importance_channel',
            priority: 'high' as const,
            defaultSound: true,
            defaultVibrateTimings: true,
          },
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    fcmTokens: string[],
    notification: PushNotificationData
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const message = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#007BFF',
            sound: 'default',
            channelId: 'high_importance_channel',
            priority: 'high' as const,
          },
          priority: 'high' as const,
        },
      };

      const response = await this.messaging.sendEachForMulticast(message);
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Send message notification specifically
   */
  async sendMessageNotification(
    fcmToken: string,
    messageData: MessageNotificationData
  ): Promise<boolean> {
    const notification: PushNotificationData = {
      title: `💬 ${messageData.senderName}`,
      body: messageData.body,
      data: {
        type: 'new_message',
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        conversationId: messageData.conversationId,
        messageId: messageData.messageId,
        route: '/conversations',
      },
    };

    return this.sendToDevice(fcmToken, notification);
  }

  /**
   * Send listing notification
   */
  async sendListingNotification(
    fcmToken: string,
    title: string,
    body: string,
    listingId: string
  ): Promise<boolean> {
    const notification: PushNotificationData = {
      title,
      body,
      data: {
        type: 'listing_update',
        listingId,
        route: '/listing-detail',
      },
    };

    return this.sendToDevice(fcmToken, notification);
  }

  /**
   * Validate FCM token
   */
  async validateToken(fcmToken: string): Promise<boolean> {
    try {
      // Try to send a dry-run message to validate the token
      await this.messaging.send({
        token: fcmToken,
        notification: {
          title: 'Test',
          body: 'Test',
        },
      }, true); // dry-run mode
      
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        return false;
      }
      return false;
    }
  }

  /**
   * Subscribe token to topic
   */
  async subscribeToTopic(fcmToken: string, topic: string): Promise<boolean> {
    try {
      await this.messaging.subscribeToTopic([fcmToken], topic);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send notification to topic
   */
  async sendToTopic(topic: string, notification: PushNotificationData): Promise<boolean> {
    try {
      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#007BFF',
            sound: 'default',
            channelId: 'high_importance_channel',
          },
        },
      };

      const response = await this.messaging.send(message);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const firebaseNotificationService = new FirebaseNotificationService();
export default firebaseNotificationService;
