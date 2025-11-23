import { db } from "./db";
import { eq, and, desc, asc, sql, count, ne, avg } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  users,
  makerProfiles,
  projects,
  bids,
  messages,
  reviews,
  emailTokens,
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
  type Review,
  type InsertReview,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  registerUser(data: { email: string; password: string; username: string; firstName?: string; lastName?: string; userType: string; location?: string }): Promise<User>;
  loginUser(email: string, password: string): Promise<User | null>;

  // Maker profile operations
  getMakerProfile(userId: string): Promise<MakerProfile | undefined>;
  upsertMakerProfile(profile: InsertMakerProfile): Promise<MakerProfile>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjects(filters?: { userId?: string; status?: string }): Promise<Project[]>;
  getProjectsWithMakerBids(makerId: string): Promise<Project[]>;
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
  confirmBidDelivery(id: string): Promise<void>;

  // Message operations
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  getMessagesByProject(userId: string, projectId: string, otherUserId: string): Promise<Message[]>;
  getConversationsForUser(userId: string): Promise<Array<{ userId: string; lastMessage?: Message }>>;
  getConversationsWithUnread(userId: string): Promise<Array<{ userId: string; projectId?: string | null; lastMessage?: Message; unreadCount: number }>>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  markMessagesAsReadByProject(userId: string, projectId: string, otherUserId: string): Promise<void>;

  // Review operations
  getReviewsForMaker(makerId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getReviewStats(makerId: string): Promise<{ averageRating: number; totalReviews: number }>;
  getReviewForProject(projectId: string, fromUserId: string, toUserId: string): Promise<Review | undefined>;

  // Stats operations
  getClientStats(userId: string): Promise<{
    activeProjects: number;
    pendingBids: number;
    acceptedOffers: number;
  }>;
  getMakerStats(userId: string): Promise<{
    activeBids: number;
    wonProjects: number;
    completedProjects: number;
  }>;

  // Email token operations
  createEmailToken(email: string, type: string): Promise<string>;
  verifyEmailToken(token: string, type: string): Promise<string | null>;

  // Password reset operations
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
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

  async registerUser(data: { email: string; password: string; username: string; firstName?: string; lastName?: string; userType: string; location?: string }): Promise<User> {
    // Check if user exists
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      location: data.location,
      userType: data.userType as any,
      authProvider: 'email',
      isEmailVerified: true, // Auto-verify for now (remove this when adding email verification)
    }).returning();

    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

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

  async getProjectsWithMakerBids(makerId: string): Promise<Project[]> {
    // Get all projects where this maker has bids
    const projectIds = await db
      .select({ projectId: bids.projectId })
      .from(bids)
      .where(eq(bids.makerId, makerId));

    if (projectIds.length === 0) return [];

    const projectIdList = projectIds.map(p => p.projectId);
    
    const results = await db
      .select()
      .from(projects)
      .where(sql`${projects.id} IN (${sql.join(projectIdList)})`)
      .orderBy(desc(projects.createdAt));
    
    return results;
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
    // First try to get the accepted bid
    const [acceptedBid] = await db
      .select()
      .from(bids)
      .where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId), eq(bids.status, 'accepted')));
    
    if (acceptedBid) {
      return acceptedBid;
    }
    
    // If no accepted bid, get the most recent pending bid
    const [pendingBid] = await db
      .select()
      .from(bids)
      .where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId), eq(bids.status, 'pending')))
      .orderBy(desc(bids.createdAt))
      .limit(1);
    
    if (pendingBid) {
      return pendingBid;
    }
    
    // If neither accepted nor pending, get the most recent bid
    const [bid] = await db
      .select()
      .from(bids)
      .where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId)))
      .orderBy(desc(bids.createdAt))
      .limit(1);
    
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

  async updateBid(id: string, data: { price?: string; deliveryDays?: number; message?: string }): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    if (data.deliveryDays !== undefined) {
      updateData.deliveryDays = data.deliveryDays;
    }
    if (data.message !== undefined) {
      updateData.message = data.message;
    }
    
    await db
      .update(bids)
      .set(updateData)
      .where(eq(bids.id, id));
  }

  async confirmBidDelivery(id: string): Promise<void> {
    await db
      .update(bids)
      .set({ deliveryConfirmedAt: new Date(), updatedAt: new Date() })
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

    const results = await query.orderBy(asc(messages.createdAt));
    return results;
  }

  async getMessagesByProject(userId: string, projectId: string, otherUserId: string): Promise<Message[]> {
    const results = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.projectId, projectId),
          sql`(${messages.senderId} = ${userId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${userId})`
        )
      )
      .orderBy(asc(messages.createdAt));
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

  async markMessagesAsReadByProject(userId: string, projectId: string, otherUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.projectId, projectId),
          eq(messages.receiverId, userId),
          eq(messages.senderId, otherUserId),
          eq(messages.isRead, false)
        )
      );
  }

  async getConversationsForUser(userId: string): Promise<Array<{ userId: string; lastMessage?: Message }>> {
    // Get all messages where user is sender or receiver
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));

    // Group messages by conversation partner
    const conversationMap = new Map<string, Message>();
    
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    // Convert to array
    return Array.from(conversationMap.entries()).map(([partnerId, lastMsg]) => ({
      userId: partnerId,
      lastMessage: lastMsg,
    }));
  }

  async getConversationsWithUnread(userId: string): Promise<Array<{ userId: string; projectId?: string | null; lastMessage?: Message; unreadCount: number }>> {
    // Get all messages where user is sender or receiver
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));

    console.log(`[getConversationsWithUnread] User ${userId.slice(0, 8)}... has ${allMessages.length} total messages`);

    // Group messages by conversation partner AND project ID (unique key per conversation)
    const conversationMap = new Map<string, { lastMsg: Message; unreadCount: number }>();
    
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      // Create unique key combining partner ID and project ID (project ID might be null)
      const conversationKey = `${partnerId}::${msg.projectId || 'no-project'}`;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, { 
          lastMsg: msg, 
          unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0 
        });
      } else {
        // Increment unread count for messages from this partner that are unread
        const existing = conversationMap.get(conversationKey)!;
        if (msg.receiverId === userId && !msg.isRead) {
          existing.unreadCount++;
        }
      }
    }

    const result = Array.from(conversationMap.entries())
      .map(([key, data]) => {
        const [partnerId, projectKey] = key.split('::');
        return {
          userId: partnerId,
          projectId: projectKey === 'no-project' ? null : projectKey,
          lastMessage: data.lastMsg,
          unreadCount: data.unreadCount,
        };
      })
      // Filter out conversations without a projectId (only show project-based conversations)
      .filter(conv => conv.projectId !== null);

    console.log(`[getConversationsWithUnread] Generated ${result.length} conversations:`, result.map(c => ({ userId: c.userId.slice(0, 8), projectId: c.projectId?.slice(0, 8) })));

    return result;
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

  // Review operations
  async getReviewsForMaker(makerId: string): Promise<Review[]> {
    const results = await db
      .select()
      .from(reviews)
      .where(eq(reviews.toUserId, makerId))
      .orderBy(desc(reviews.createdAt));
    return results;
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update maker profile rating
    const makerReviews = await this.getReviewsForMaker(reviewData.toUserId);
    if (makerReviews.length > 0) {
      const avgRating = makerReviews.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0) / makerReviews.length;
      const roundedRating = parseFloat(avgRating.toFixed(2));
      await db
        .update(makerProfiles)
        .set({ 
          rating: roundedRating.toString(),
          totalReviews: makerReviews.length,
          updatedAt: new Date()
        })
        .where(eq(makerProfiles.userId, reviewData.toUserId));
    }

    return review;
  }

  async getReviewStats(makerId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const [result] = await db
      .select({ 
        averageRating: avg(reviews.rating),
        totalReviews: count()
      })
      .from(reviews)
      .where(eq(reviews.toUserId, makerId));
    
    return {
      averageRating: result?.averageRating ? parseFloat(result.averageRating) : 0,
      totalReviews: result?.totalReviews || 0,
    };
  }

  async getReviewForProject(projectId: string, fromUserId: string, toUserId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.projectId, projectId),
        eq(reviews.fromUserId, fromUserId),
        eq(reviews.toUserId, toUserId)
      ));
    return review;
  }

  async getMakerStats(userId: string): Promise<{
    activeBids: number;
    wonProjects: number;
    completedProjects: number;
  }> {
    const activeBids = await this.getActiveBidCount(userId);
    
    const [wonResult] = await db
      .select({ count: count() })
      .from(bids)
      .where(and(eq(bids.makerId, userId), eq(bids.status, "accepted")));
    const wonProjects = wonResult.count;

    const [completedResult] = await db
      .select({ count: count() })
      .from(bids)
      .where(and(eq(bids.makerId, userId), eq(bids.status, "accepted"), sql`${bids.deliveryConfirmedAt} IS NOT NULL`));
    const completedProjects = completedResult.count;

    return { activeBids, wonProjects, completedProjects };
  }

  // Email token operations
  async createEmailToken(email: string, type: string): Promise<string> {
    // Delete old tokens for this email
    await db.delete(emailTokens).where(eq(emailTokens.email, email));
    
    // Generate random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Create expiring token (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const [result] = await db.insert(emailTokens).values({
      email,
      token,
      type,
      expiresAt,
    }).returning();
    
    return token;
  }

  async verifyEmailToken(token: string, type: string): Promise<string | null> {
    const [record] = await db
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.token, token), eq(emailTokens.type, type)));
    
    if (!record) {
      return null;
    }
    
    if (record.expiresAt < new Date()) {
      return null;
    }
    
    // Delete token after verification
    await db.delete(emailTokens).where(eq(emailTokens.token, token));
    
    return record.email;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
