import { User } from "../types";
import { db } from "../db";

export class UserRepository {
  getById(id: string): User | undefined {
    return db.getUserById(id);
  }

  getManagerForUser(userId: string): User | undefined {
    return db.getManagerForUser(userId);
  }
}

export const userRepository = new UserRepository();

