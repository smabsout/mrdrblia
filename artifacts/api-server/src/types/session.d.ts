// Express Request augmentation for Clerk-based auth
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      clerkUserId?: string;
    }
  }
}

export {};
