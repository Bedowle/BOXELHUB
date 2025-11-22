import { db } from "./db";
import { eq, and, desc, sql, count, ne } from "drizzle-orm";
import {
  users,
  makerProfiles,
  projects,
  bids,
  messages,
  type User,
  type UpsertUser,
  type MakerProfile,
  type InsertMakerProfile,
  type Project,
  type InsertProject,
  type Bid,
  type InsertBid,
  type Message,
  type InsertMessage,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Maker profile operations
  getMakerProfile(userId: string): Promise<MakerProfile | undefined>;
  upsertMakerProfile(profile: InsertMakerProfile): Promise<MakerProfile>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjects(filters?: { userId?: string; status?: string }): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectStatus(id: string, status: Project["status"]): Promise<void>;
  getProjectCount(userId: string): Promise<number>;
  getActiveProjectCount(userId: string): Promise<number>;

  // Bid operations
  getBid(id: string): Promise<Bid | undefined>;
  getBidsByProject(projectId: string): Promise<Bid[]>;
  getBidsByMaker(makerId: string): Promise<Bid[]>;
  getActiveBidCount(makerId: string): Promise<number>;
  getMakerBidForProject(makerId: string, projectId: string): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBidStatus(id: string, status: Bid["status"]): Promise<void>;

  // Message operations
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;

  // Stats operations
  getClientStats(userId: string): Promise<{
    activeProjects: number;
    pendingBids: number;
    acceptedOffers: number;
  }>;
  getMakerStats(userId: string): Promise<{
    activeBids: number;
    wonProjects: number;
    earnings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = userData.email ? await this.getUserByEmail(userData.email) : undefined;
    
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ 
          ...userData,
          updatedAt: new Date() 
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Maker profile operations
  async getMakerProfile(userId: string): Promise<MakerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(makerProfiles)
      .where(eq(makerProfiles.userId, userId));
    return profile;
  }

  async upsertMakerProfile(profileData: InsertMakerProfile): Promise<MakerProfile> {
    const existing = await this.getMakerProfile(profileData.userId);

    if (existing) {
      const [updated] = await db
        .update(makerProfiles)
        .set({ 
          ...profileData,
          updatedAt: new Date() 
        })
        .where(eq(makerProfiles.userId, profileData.userId))
        .returning();
      return updated;
    }

    const [profile] = await db.insert(makerProfiles).values(profileData).returning();
    return profile;
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(filters?: { userId?: string; status?: string }): Promise<Project[]> {
    let query = db.select().from(projects);

    if (filters?.userId) {
      query = query.where(eq(projects.userId, filters.userId));
    }

    if (filters?.status) {
      query = query.where(eq(projects.status, filters.status as any));
    }

    const results = await query.orderBy(desc(projects.createdAt));
    return results;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProjectStatus(id: string, status: Project["status"]): Promise<void> {
    await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id));
  }

  async getProjectCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId));
    return result.count;
  }

  async getActiveProjectCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "active")));
    return result.count;
  }

  // Bid operations
  async getBid(id: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    return bid;
  }

  async getBidsByProject(projectId: string): Promise<Bid[]> {
    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.projectId, projectId))
      .orderBy(desc(bids.createdAt));
    return results;
  }

  async getBidsByMaker(makerId: string): Promise<Bid[]> {
    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.makerId, makerId))
      .orderBy(desc(bids.createdAt));
    return results;
  }

  async getActiveBidCount(makerId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(bids)
      .where(and(eq(bids.makerId, makerId), eq(bids.status, "pending")));
    return result.count;
  }

  async getMakerBidForProject(makerId: string, projectId: string): Promise<Bid | undefined> {
    const [bid] = await db
      .select()
      .from(bids)
      .where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId)));
    return bid;
  }

  async createBid(bidData: InsertBid): Promise<Bid> {
    const [bid] = await db.insert(bids).values(bidData).returning();
    return bid;
  }

  async updateBidStatus(id: string, status: Bid["status"]): Promise<void> {
    await db
      .update(bids)
      .set({ status, updatedAt: new Date() })
      .where(eq(bids.id, id));
  }

  // Message operations
  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    let query = db.select().from(messages);

    if (otherUserId) {
      query = query.where(
        sql`(${messages.senderId} = ${userId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${userId})`
      );
    } else {
      query = query.where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      );
    }

    const results = await query.orderBy(desc(messages.createdAt));
    return results;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, senderId),
          eq(messages.isRead, false)
        )
      );
  }

  // Stats operations
  async getClientStats(userId: string): Promise<{
    activeProjects: number;
    pendingBids: number;
    acceptedOffers: number;
  }> {
    const activeProjects = await this.getActiveProjectCount(userId);
    
    const userProjects = await this.getProjects({ userId });
    const projectIds = userProjects.map(p => p.id);
    
    let pendingBids = 0;
    let acceptedOffers = 0;
    
    if (projectIds.length > 0) {
      const [pendingResult] = await db
        .select({ count: count() })
        .from(bids)
        .where(
          and(
            sql`${bids.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
            eq(bids.status, "pending")
          )
        );
      pendingBids = pendingResult.count;

      const [acceptedResult] = await db
        .select({ count: count() })
        .from(bids)
        .where(
          and(
            sql`${bids.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
            eq(bids.status, "accepted")
          )
        );
      acceptedOffers = acceptedResult.count;
    }

    return { activeProjects, pendingBids, acceptedOffers };
  }

  async getMakerStats(userId: string): Promise<{
    activeBids: number;
    wonProjects: number;
    earnings: number;
  }> {
    const activeBids = await this.getActiveBidCount(userId);
    
    const [wonResult] = await db
      .select({ count: count() })
      .from(bids)
      .where(and(eq(bids.makerId, userId), eq(bids.status, "accepted")));
    const wonProjects = wonResult.count;

    const [earningsResult] = await db
      .select({ total: sql<string>`SUM(${bids.price})` })
      .from(bids)
      .where(and(eq(bids.makerId, userId), eq(bids.status, "accepted")));
    const earnings = parseFloat(earningsResult[0]?.total || "0");

    return { activeBids, wonProjects, earnings };
  }
}

export const storage = new DatabaseStorage();
