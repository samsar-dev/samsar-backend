/**
 * Handle price updates for listings and notify users who have favorited the listing
 */
export declare const handleListingPriceUpdate: (listingId: string, oldPrice: number, newPrice: number) => Promise<void>;
/**
 * Send a notification when a new listing matches a user's saved search criteria
 */
export declare const handleNewListingMatch: (listingId: string, matchingUserIds: string[], searchCriteriaId?: string) => Promise<void>;
/**
 * Send an account warning notification to a user
 */
export declare const sendAccountWarning: (userId: string, warningMessage: string, relatedListingId?: string) => Promise<void>;
/**
 * Send a system announcement to all users or a specific group of users
 */
export declare const sendSystemAnnouncement: (message: string, title: string, targetUserIds?: string[]) => Promise<void>;
