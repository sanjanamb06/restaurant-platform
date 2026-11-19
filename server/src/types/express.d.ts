import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        restaurantId: string;
        role: Role;
        mustChangePassword: boolean;
      };
    }
  }
}

export {};
