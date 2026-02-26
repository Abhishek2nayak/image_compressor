import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    // Make Express.User extend the Prisma User so req.user has all Prisma fields
    interface User extends PrismaUser {}
    interface Request {
      user?: PrismaUser;
    }
  }
}
