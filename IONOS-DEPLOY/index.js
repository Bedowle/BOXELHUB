var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index-prod.ts
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bidStatusEnum: () => bidStatusEnum,
  bids: () => bids,
  bidsRelations: () => bidsRelations,
  chatContextTypeEnum: () => chatContextTypeEnum,
  designPriceTypeEnum: () => designPriceTypeEnum,
  designPurchases: () => designPurchases,
  designStatusEnum: () => designStatusEnum,
  emailTokens: () => emailTokens,
  insertBidSchema: () => insertBidSchema,
  insertDesignPurchaseSchema: () => insertDesignPurchaseSchema,
  insertMakerProfileSchema: () => insertMakerProfileSchema,
  insertMarketplaceDesignSchema: () => insertMarketplaceDesignSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertReviewSchema: () => insertReviewSchema,
  makerEarnings: () => makerEarnings,
  makerPayouts: () => makerPayouts,
  makerProfiles: () => makerProfiles,
  makerProfilesRelations: () => makerProfilesRelations,
  marketplaceDesigns: () => marketplaceDesigns,
  marketplaceDesignsRelations: () => marketplaceDesignsRelations,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  payoutMethodEnum: () => payoutMethodEnum,
  printerTypeEnum: () => printerTypeEnum,
  projectStatusEnum: () => projectStatusEnum,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  sessions: () => sessions,
  updateBidSchema: () => updateBidSchema,
  upsertUserSchema: () => upsertUserSchema,
  userTypeEnum: () => userTypeEnum,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  integer,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userTypeEnum = pgEnum("user_type", ["client", "maker"]);
var printerTypeEnum = pgEnum("printer_type", ["Ender3", "Ender5", "PrusaMK3S", "BamboolabX1", "BamboolabP1", "CrealityCR10", "Ultimaker", "Formlabs", "AnyubicMega", "ArtilleryGenius", "Other", "BambooLab"]);
var projectStatusEnum = pgEnum("project_status", ["active", "reserved", "completed"]);
var bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected"]);
var designStatusEnum = pgEnum("design_status", ["active", "archived"]);
var designPriceTypeEnum = pgEnum("design_price_type", ["free", "fixed", "minimum"]);
var chatContextTypeEnum = pgEnum("chat_context_type", ["project", "marketplace_design"]);
var payoutMethodEnum = pgEnum("payout_method", ["stripe", "paypal", "bank"]);
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username"),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"),
  // Approximate location (both client & maker)
  // For clients: optional address fields similar to makers
  hasLocation: boolean("has_location").default(false),
  addressPostalCode: varchar("address_postal_code"),
  addressLatitude: varchar("address_latitude"),
  addressLongitude: varchar("address_longitude"),
  addressRadius: integer("address_radius"),
  // in km
  // Policy acceptance
  acceptedTermsAt: timestamp("accepted_terms_at"),
  acceptedPrivacyAt: timestamp("accepted_privacy_at"),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  userType: userTypeEnum("user_type"),
  authProvider: varchar("auth_provider"),
  // 'email', 'google', 'facebook', 'apple', 'replit'
  showFullName: boolean("show_full_name").default(false).notNull(),
  // Show firstName and lastName in profile
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var makerProfiles = pgTable("maker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  printerType: printerTypeEnum("printer_type").notNull(),
  materials: text("materials").array().notNull().default(sql`ARRAY[]::text[]`),
  maxPrintDimensionX: integer("max_print_dimension_x"),
  maxPrintDimensionY: integer("max_print_dimension_y"),
  maxPrintDimensionZ: integer("max_print_dimension_z"),
  hasMulticolor: boolean("has_multicolor").default(false).notNull(),
  maxColors: integer("max_colors"),
  location: varchar("location"),
  // Maker's location for delivery (city, country)
  // Address fields for maker's exact location
  addressStreetType: varchar("address_street_type"),
  // vía, avenida, calle, etc.
  addressStreetName: varchar("address_street_name"),
  addressNumber: varchar("address_number"),
  addressFloor: varchar("address_floor"),
  addressDoor: varchar("address_door"),
  addressPostalCode: varchar("address_postal_code"),
  addressSimplifiedMode: boolean("address_simplified_mode").default(false),
  // true = only postal code
  addressLatitude: varchar("address_latitude"),
  addressLongitude: varchar("address_longitude"),
  addressRadius: integer("address_radius"),
  // in km, 0 = exact point, 1+ = approximate area
  capabilities: text("capabilities"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0).notNull(),
  // Payout configuration
  payoutMethod: payoutMethodEnum("payout_method"),
  // stripe, paypal, bank
  stripeEmail: varchar("stripe_email"),
  // Email for Stripe payouts (legacy, for display)
  paypalEmail: varchar("paypal_email"),
  // Email for PayPal payouts (legacy, for display)
  bankAccountIban: varchar("bank_account_iban"),
  // IBAN for bank transfers
  bankAccountName: varchar("bank_account_name"),
  // Account holder name
  // OAuth connected accounts
  stripeConnectAccountId: varchar("stripe_connect_account_id"),
  // Stripe Connect account ID for payouts
  paypalAccountId: varchar("paypal_account_id"),
  // PayPal merchant account ID for payouts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  stlFileName: varchar("stl_file_name"),
  // Legacy single file support, deprecated
  stlFileContent: text("stl_file_content"),
  // Legacy single file support, deprecated
  stlFileNames: text("stl_file_names").array().notNull().default(sql`ARRAY[]::text[]`),
  // Array of up to 10 files
  stlFileContents: text("stl_file_contents").array().notNull().default(sql`ARRAY[]::text[]`),
  // Array of base64 contents
  description: text("description").notNull(),
  material: varchar("material").notNull(),
  specifications: jsonb("specifications"),
  status: projectStatusEnum("status").default("active").notNull(),
  deletedAt: timestamp("deleted_at"),
  // Soft delete - NULL means active
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("idx_projects_user_id").on(table.userId),
  index("idx_projects_status").on(table.status),
  index("idx_projects_deleted_at").on(table.deletedAt)
]);
var bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  message: text("message"),
  status: bidStatusEnum("status").default("pending").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  // Track if client has seen the bid
  deliveryConfirmedAt: timestamp("delivery_confirmed_at"),
  // When client confirms receipt
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("idx_bids_project_id").on(table.projectId),
  index("idx_bids_maker_id").on(table.makerId),
  index("idx_bids_status").on(table.status)
]);
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  marketplaceDesignId: varchar("marketplace_design_id").references(() => marketplaceDesigns.id, { onDelete: "cascade" }),
  contextType: chatContextTypeEnum("context_type"),
  // 'project' or 'marketplace_design'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_messages_sender_id").on(table.senderId),
  index("idx_messages_receiver_id").on(table.receiverId),
  index("idx_messages_project_id").on(table.projectId),
  index("idx_messages_marketplace_design_id").on(table.marketplaceDesignId),
  index("idx_messages_context_type").on(table.contextType)
]);
var emailTokens = pgTable("email_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").unique().notNull(),
  type: varchar("type").notNull(),
  // 'verification', 'magic_link', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_email_tokens_email").on(table.email),
  index("idx_email_tokens_token").on(table.token)
]);
var reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  // 0.5-5 in 0.5 increments
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_reviews_project_id").on(table.projectId),
  index("idx_reviews_to_user_id").on(table.toUserId)
]);
var marketplaceDesigns = pgTable("marketplace_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url").notNull(),
  stlFileContent: text("stl_file_content"),
  // Store STL as base64
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceType: designPriceTypeEnum("price_type").default("fixed").notNull(),
  // free, fixed, minimum
  material: varchar("material").notNull(),
  status: designStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("idx_marketplace_designs_maker_id").on(table.makerId),
  index("idx_marketplace_designs_status").on(table.status)
]);
var designPurchases = pgTable("design_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  designId: varchar("design_id").notNull().references(() => marketplaceDesigns.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  // 0.00 for free
  paymentMethod: varchar("payment_method"),
  // stripe, paypal, free, etc
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paypalTransactionId: varchar("paypal_transaction_id"),
  status: varchar("status").notNull().default("completed"),
  // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_design_purchases_design_id").on(table.designId),
  index("idx_design_purchases_buyer_id").on(table.buyerId),
  index("idx_design_purchases_maker_id").on(table.makerId)
]);
var makerEarnings = pgTable("maker_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  designPurchaseId: varchar("design_purchase_id").notNull().references(() => designPurchases.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  // Earnings from this purchase
  earningDate: timestamp("earning_date").defaultNow().notNull(),
  // When earning was created
  availableDate: timestamp("available_date").notNull(),
  // When available for payout (after retention)
  status: varchar("status").notNull().default("pending"),
  // pending, available, paid
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_maker_earnings_maker_id").on(table.makerId),
  index("idx_maker_earnings_status").on(table.status),
  index("idx_maker_earnings_available_date").on(table.availableDate)
]);
var makerPayouts = pgTable("maker_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payoutMethod: payoutMethodEnum("payout_method").notNull(),
  // stripe, paypal, bank
  status: varchar("status").notNull().default("pending"),
  // pending, processing, completed, failed
  stripePayoutId: varchar("stripe_payout_id"),
  // Stripe payout ID if using Stripe
  paypalTransactionId: varchar("paypal_transaction_id"),
  // PayPal transaction ID if using PayPal
  bankTransferId: varchar("bank_transfer_id"),
  // Bank transfer reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at")
  // When payout was actually sent
}, (table) => [
  index("idx_maker_payouts_maker_id").on(table.makerId),
  index("idx_maker_payouts_status").on(table.status)
]);
var usersRelations = relations(users, ({ one, many }) => ({
  makerProfile: one(makerProfiles, {
    fields: [users.id],
    references: [makerProfiles.userId]
  }),
  projects: many(projects),
  bidsAsMaker: many(bids, { relationName: "makerBids" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  reviewsGiven: many(reviews, { relationName: "reviewsGiven" }),
  reviewsReceived: many(reviews, { relationName: "reviewsReceived" }),
  marketplaceDesigns: many(marketplaceDesigns)
}));
var makerProfilesRelations = relations(makerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [makerProfiles.userId],
    references: [users.id]
  })
}));
var projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id]
  }),
  bids: many(bids),
  messages: many(messages),
  reviews: many(reviews)
}));
var bidsRelations = relations(bids, ({ one }) => ({
  project: one(projects, {
    fields: [bids.projectId],
    references: [projects.id]
  }),
  maker: one(users, {
    fields: [bids.makerId],
    references: [users.id]
  })
}));
var messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages"
  }),
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id]
  })
}));
var reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id]
  }),
  fromUser: one(users, {
    fields: [reviews.fromUserId],
    references: [users.id],
    relationName: "reviewsGiven"
  }),
  toUser: one(users, {
    fields: [reviews.toUserId],
    references: [users.id],
    relationName: "reviewsReceived"
  })
}));
var marketplaceDesignsRelations = relations(marketplaceDesigns, ({ one }) => ({
  maker: one(users, {
    fields: [marketplaceDesigns.makerId],
    references: [users.id]
  })
}));
var upsertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMakerProfileSchema = createInsertSchema(makerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalReviews: true,
  userId: true
  // Added by server from authenticated user
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  userId: true
  // Added by server from authenticated user
}).extend({
  material: z.string().min(1, "Material is required"),
  specifications: z.object({
    dimensionX: z.string().refine((val) => val && !isNaN(Number(val)), "Dimensi\xF3n X es requerida y debe ser un n\xFAmero"),
    dimensionY: z.string().refine((val) => val && !isNaN(Number(val)), "Dimensi\xF3n Y es requerida y debe ser un n\xFAmero"),
    dimensionZ: z.string().refine((val) => val && !isNaN(Number(val)), "Dimensi\xF3n Z es requerida y debe ser un n\xFAmero")
  }).required("Las dimensiones son requeridas")
});
var insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
}).extend({
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").refine((val) => parseFloat(val) >= 0.5, "Minimum price is \u20AC0.50"),
  deliveryDays: z.number().int().positive("Delivery days must be positive")
});
var updateBidSchema = z.object({
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").refine((val) => parseFloat(val) >= 0.5, "Minimum price is \u20AC0.50").optional(),
  deliveryDays: z.number().int().positive("Delivery days must be positive").optional(),
  message: z.string().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated"
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  senderId: true
}).extend({
  content: z.string().min(1, "Message cannot be empty"),
  projectId: z.string().optional(),
  marketplaceDesignId: z.string().optional(),
  contextType: z.enum(["project", "marketplace_design"])
}).refine(
  (data) => {
    return data.projectId || data.marketplaceDesignId;
  },
  {
    message: "Either projectId or marketplaceDesignId is required",
    path: ["projectId"]
  }
).refine(
  (data) => {
    if (data.contextType === "project") {
      return !!data.projectId;
    }
    if (data.contextType === "marketplace_design") {
      return !!data.marketplaceDesignId;
    }
    return true;
  },
  {
    message: "contextType must match the provided context (project/marketplaceDesignId)",
    path: ["contextType"]
  }
);
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});
var insertMarketplaceDesignSchema = createInsertSchema(marketplaceDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  makerId: true
}).extend({
  priceType: z.enum(["free", "fixed", "minimum"]).default("fixed"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").refine((val) => parseFloat(val) >= 0, "Price must be >= \u20AC0.00"),
  stlFileContent: z.string().optional()
  // base64 encoded STL
});
var insertDesignPurchaseSchema = createInsertSchema(designPurchases).omit({
  id: true,
  createdAt: true
}).extend({
  amountPaid: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").refine((val) => parseFloat(val) >= 0, "Amount must be >= \u20AC0.00")
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, asc, sql as sql2, count, avg, isNull, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async registerUser(data) {
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw new Error("Email already registered");
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [user] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      location: data.location,
      userType: data.userType,
      authProvider: "email",
      isEmailVerified: true
      // Auto-verify for now (remove this when adding email verification)
    }).returning();
    return user;
  }
  async loginUser(email, password) {
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
  async upsertUser(userData) {
    const existing = userData.email ? await this.getUserByEmail(userData.email) : void 0;
    if (existing) {
      const [updated] = await db.update(users).set({
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, existing.id)).returning();
      return updated;
    }
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  // Maker profile operations
  async getMakerProfile(userId) {
    const [profile] = await db.select().from(makerProfiles).where(eq(makerProfiles.userId, userId));
    return profile;
  }
  async upsertMakerProfile(profileData) {
    const existing = await this.getMakerProfile(profileData.userId);
    if (existing) {
      const [updated] = await db.update(makerProfiles).set({
        ...profileData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(makerProfiles.userId, profileData.userId)).returning();
      return updated;
    }
    const [profile] = await db.insert(makerProfiles).values(profileData).returning();
    return profile;
  }
  // Project operations
  async getProject(id) {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return project;
  }
  async getProjectIncludeDeleted(id) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  async getProjects(filters) {
    const conditions = [isNull(projects.deletedAt)];
    if (filters?.userId) {
      conditions.push(eq(projects.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    const results = await db.select().from(projects).where(conditions.length > 1 ? and(...conditions) : conditions[0]).orderBy(desc(projects.createdAt));
    return results;
  }
  async createProject(projectData) {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }
  async updateProjectStatus(id, status) {
    await db.update(projects).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(projects.id, id));
  }
  async deleteProject(id) {
    await db.update(projects).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(projects.id, id));
  }
  async getProjectCount(userId) {
    const [result] = await db.select({ count: count() }).from(projects).where(and(eq(projects.userId, userId), isNull(projects.deletedAt)));
    return result.count;
  }
  async getActiveProjectCount(userId) {
    const [result] = await db.select({ count: count() }).from(projects).where(and(eq(projects.userId, userId), eq(projects.status, "active"), isNull(projects.deletedAt)));
    return result.count;
  }
  async getProjectsWithMakerBids(makerId) {
    const projectIds = await db.select({ projectId: bids.projectId }).from(bids).where(eq(bids.makerId, makerId));
    if (projectIds.length === 0) return [];
    const projectIdList = projectIds.map((p) => p.projectId);
    const results = await db.select().from(projects).where(and(sql2`${projects.id} IN (${sql2.join(projectIdList)})`, isNull(projects.deletedAt))).orderBy(desc(projects.createdAt));
    return results;
  }
  // Bid operations
  async getBid(id) {
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    return bid;
  }
  async getBidsByProject(projectId) {
    const results = await db.select().from(bids).where(eq(bids.projectId, projectId)).orderBy(desc(bids.createdAt));
    return results;
  }
  async getBidsByMaker(makerId) {
    const results = await db.select().from(bids).where(eq(bids.makerId, makerId)).orderBy(desc(bids.createdAt));
    return results;
  }
  async getActiveBidCount(makerId) {
    const [result] = await db.select({ count: count() }).from(bids).innerJoin(projects, eq(bids.projectId, projects.id)).where(and(eq(bids.makerId, makerId), eq(bids.status, "pending"), isNull(projects.deletedAt)));
    return result.count;
  }
  async getMakerBidForProject(makerId, projectId) {
    const [acceptedBid] = await db.select().from(bids).where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId), eq(bids.status, "accepted")));
    if (acceptedBid) {
      return acceptedBid;
    }
    const [pendingBid] = await db.select().from(bids).where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId), eq(bids.status, "pending"))).orderBy(desc(bids.createdAt)).limit(1);
    if (pendingBid) {
      return pendingBid;
    }
    const [bid] = await db.select().from(bids).where(and(eq(bids.makerId, makerId), eq(bids.projectId, projectId))).orderBy(desc(bids.createdAt)).limit(1);
    return bid;
  }
  async createBid(bidData) {
    const [bid] = await db.insert(bids).values(bidData).returning();
    return bid;
  }
  async updateBidStatus(id, status) {
    await db.update(bids).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bids.id, id));
  }
  async deleteBid(id) {
    await db.delete(bids).where(eq(bids.id, id));
  }
  async updateBid(id, data) {
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (data.price !== void 0) {
      updateData.price = data.price;
    }
    if (data.deliveryDays !== void 0) {
      updateData.deliveryDays = data.deliveryDays;
    }
    if (data.message !== void 0) {
      updateData.message = data.message;
    }
    await db.update(bids).set(updateData).where(eq(bids.id, id));
  }
  async confirmBidDelivery(id) {
    await db.update(bids).set({ deliveryConfirmedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(bids.id, id));
  }
  async markBidsAsRead(projectId) {
    await db.update(bids).set({ isRead: true, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(bids.projectId, projectId), eq(bids.isRead, false)));
  }
  async getUnreadBidCount(projectId) {
    const [result] = await db.select({ count: count() }).from(bids).where(and(eq(bids.projectId, projectId), eq(bids.isRead, false)));
    return result.count;
  }
  async getTotalUnreadBidsForClient(userId) {
    const [result] = await db.select({ count: count() }).from(bids).innerJoin(projects, eq(bids.projectId, projects.id)).where(and(
      eq(projects.userId, userId),
      eq(bids.isRead, false),
      inArray(projects.status, ["active", "reserved"])
    ));
    return result.count;
  }
  // Message operations
  async getMessages(userId, otherUserId) {
    let query = db.select().from(messages);
    if (otherUserId) {
      query = query.where(
        sql2`(${messages.senderId} = ${userId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${userId})`
      );
    } else {
      query = query.where(
        sql2`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      );
    }
    const results = await query.orderBy(asc(messages.createdAt));
    return results;
  }
  async getMessagesByProject(userId, projectId, otherUserId) {
    const results = await db.select().from(messages).where(
      and(
        eq(messages.projectId, projectId),
        sql2`(${messages.senderId} = ${userId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${userId})`
      )
    ).orderBy(asc(messages.createdAt));
    return results;
  }
  async getMessagesByContext(userId, otherUserId, contextType, contextId) {
    const allMessages = await db.select().from(messages).where(
      sql2`
          (
            (${messages.senderId} = ${userId} AND ${messages.receiverId} = ${otherUserId})
            OR
            (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${userId})
          )
        `
    ).orderBy(asc(messages.createdAt));
    let results;
    if (contextType === "project") {
      results = allMessages.filter((m) => m.projectId === contextId && m.marketplaceDesignId === null);
    } else {
      results = allMessages.filter((m) => m.marketplaceDesignId === contextId && m.projectId === null);
    }
    return results;
  }
  async createMessage(messageData) {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }
  async markMessagesAsRead(userId, senderId) {
    await db.update(messages).set({ isRead: true }).where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.senderId, senderId),
        eq(messages.isRead, false)
      )
    );
  }
  async markMessagesAsReadByProject(userId, projectId, otherUserId) {
    await db.update(messages).set({ isRead: true }).where(
      and(
        eq(messages.projectId, projectId),
        eq(messages.receiverId, userId),
        eq(messages.senderId, otherUserId),
        eq(messages.isRead, false)
      )
    );
  }
  async markMessagesAsReadByContext(userId, otherUserId, contextType, contextId) {
    const contextField = contextType === "project" ? messages.projectId : messages.marketplaceDesignId;
    await db.update(messages).set({ isRead: true }).where(
      and(
        eq(contextField, contextId),
        eq(messages.receiverId, userId),
        eq(messages.senderId, otherUserId),
        eq(messages.isRead, false)
      )
    );
  }
  async getConversationsForUser(userId) {
    const allMessages = await db.select().from(messages).where(
      sql2`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
    ).orderBy(desc(messages.createdAt));
    const conversationMap = /* @__PURE__ */ new Map();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }
    return Array.from(conversationMap.entries()).map(([partnerId, lastMsg]) => ({
      userId: partnerId,
      lastMessage: lastMsg
    }));
  }
  async getConversationsWithUnread(userId) {
    const allMessages = await db.select().from(messages).where(
      sql2`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
    ).orderBy(desc(messages.createdAt));
    const conversationMap = /* @__PURE__ */ new Map();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const contextKey = msg.projectId ? `project::${msg.projectId}` : msg.marketplaceDesignId ? `design::${msg.marketplaceDesignId}` : "no-context";
      const conversationKey = `${partnerId}::${contextKey}`;
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          lastMsg: msg,
          unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0
        });
      } else {
        const existing = conversationMap.get(conversationKey);
        if (msg.receiverId === userId && !msg.isRead) {
          existing.unreadCount++;
        }
      }
    }
    const result = Array.from(conversationMap.entries()).map(([key, data]) => {
      const separatorIndex = key.indexOf("::");
      const partnerId = key.substring(0, separatorIndex);
      const contextKey = key.substring(separatorIndex + 2);
      let projectId = null;
      let marketplaceDesignId = null;
      if (contextKey.startsWith("project::")) {
        projectId = contextKey.substring("project::".length);
      } else if (contextKey.startsWith("design::")) {
        marketplaceDesignId = contextKey.substring("design::".length);
      }
      return {
        userId: partnerId,
        projectId: projectId || void 0,
        marketplaceDesignId: marketplaceDesignId || void 0,
        lastMessage: data.lastMsg,
        unreadCount: data.unreadCount
      };
    });
    return result;
  }
  // Stats operations
  async getClientStats(userId) {
    const userProjects = await this.getProjects({ userId });
    let projectsWithPendingBids = 0;
    let projectsWithAcceptedBids = 0;
    if (userProjects.length > 0) {
      const projectIds = userProjects.map((p) => p.id);
      const [pendingResult] = await db.select({ count: count(sql2`DISTINCT ${bids.projectId}`) }).from(bids).where(
        and(
          inArray(bids.projectId, projectIds),
          eq(bids.status, "pending")
        )
      );
      projectsWithPendingBids = pendingResult?.count || 0;
      const [acceptedResult] = await db.select({ count: count(sql2`DISTINCT ${bids.projectId}`) }).from(bids).where(
        and(
          inArray(bids.projectId, projectIds),
          eq(bids.status, "accepted")
        )
      );
      projectsWithAcceptedBids = acceptedResult?.count || 0;
    }
    const activeProjects = userProjects.filter((p) => p.status === "active").length;
    return {
      activeProjects,
      pendingBids: projectsWithPendingBids,
      acceptedOffers: projectsWithAcceptedBids
    };
  }
  // Review operations
  async getReviewsForMaker(makerId) {
    const results = await db.select().from(reviews).where(eq(reviews.toUserId, makerId)).orderBy(desc(reviews.createdAt));
    return results;
  }
  async createReview(reviewData) {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    const makerReviews = await this.getReviewsForMaker(reviewData.toUserId);
    if (makerReviews.length > 0) {
      const avgRating = makerReviews.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0) / makerReviews.length;
      const roundedRating = parseFloat(avgRating.toFixed(2));
      await db.update(makerProfiles).set({
        rating: roundedRating.toString(),
        totalReviews: makerReviews.length,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(makerProfiles.userId, reviewData.toUserId));
    }
    return review;
  }
  async getReviewStats(makerId) {
    const [result] = await db.select({
      averageRating: avg(reviews.rating),
      totalReviews: count()
    }).from(reviews).where(eq(reviews.toUserId, makerId));
    return {
      averageRating: result?.averageRating ? parseFloat(result.averageRating) : 0,
      totalReviews: result?.totalReviews || 0
    };
  }
  async getReviewForProject(projectId, fromUserId, toUserId) {
    const [review] = await db.select().from(reviews).where(and(
      eq(reviews.projectId, projectId),
      eq(reviews.fromUserId, fromUserId),
      eq(reviews.toUserId, toUserId)
    ));
    return review;
  }
  async getMakerStats(userId) {
    const activeBids = await this.getActiveBidCount(userId);
    const [wonResult] = await db.select({ count: count() }).from(bids).where(and(eq(bids.makerId, userId), eq(bids.status, "accepted")));
    const wonProjects = wonResult.count;
    const [completedResult] = await db.select({ count: count() }).from(bids).where(and(eq(bids.makerId, userId), eq(bids.status, "accepted"), sql2`${bids.deliveryConfirmedAt} IS NOT NULL`));
    const completedProjects = completedResult.count;
    return { activeBids, wonProjects, completedProjects };
  }
  // Email token operations
  async createEmailToken(email, type) {
    await db.delete(emailTokens).where(eq(emailTokens.email, email));
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    const [result] = await db.insert(emailTokens).values({
      email,
      token,
      type,
      expiresAt
    }).returning();
    return token;
  }
  async verifyEmailToken(token, type) {
    const [record] = await db.select().from(emailTokens).where(and(eq(emailTokens.token, token), eq(emailTokens.type, type)));
    if (!record) {
      return null;
    }
    if (record.expiresAt < /* @__PURE__ */ new Date()) {
      return null;
    }
    await db.delete(emailTokens).where(eq(emailTokens.token, token));
    return record.email;
  }
  async updateUserPassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }
  // Marketplace design operations
  async getMarketplaceDesign(id) {
    const [design] = await db.select().from(marketplaceDesigns).where(eq(marketplaceDesigns.id, id));
    return design;
  }
  async getMarketplaceDesignIncludeDeleted(id) {
    const [design] = await db.select().from(marketplaceDesigns).where(eq(marketplaceDesigns.id, id));
    return design;
  }
  async getMarketplaceDesigns(filters) {
    let query = db.select().from(marketplaceDesigns);
    if (filters?.makerId) {
      query = query.where(eq(marketplaceDesigns.makerId, filters.makerId));
    }
    if (filters?.status) {
      query = query.where(eq(marketplaceDesigns.status, filters.status));
    }
    const results = await query.orderBy(desc(marketplaceDesigns.createdAt));
    return results;
  }
  async createMarketplaceDesign(designData) {
    const [design] = await db.insert(marketplaceDesigns).values(designData).returning();
    return design;
  }
  async updateMarketplaceDesign(id, data) {
    await db.update(marketplaceDesigns).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(marketplaceDesigns.id, id));
  }
  async deleteMarketplaceDesign(id) {
    await db.delete(marketplaceDesigns).where(eq(marketplaceDesigns.id, id));
  }
  async getMakerDesignCount(makerId) {
    const [result] = await db.select({ count: count() }).from(marketplaceDesigns).where(and(eq(marketplaceDesigns.makerId, makerId), eq(marketplaceDesigns.status, "active")));
    return result.count;
  }
  // Design purchase operations
  async createDesignPurchase(purchase) {
    const [record] = await db.insert(designPurchases).values(purchase).returning();
    return record;
  }
  async getDesignPurchase(id) {
    const [purchase] = await db.select().from(designPurchases).where(eq(designPurchases.id, id));
    return purchase;
  }
  async getDesignPurchasesByBuyer(buyerId) {
    return db.select().from(designPurchases).where(eq(designPurchases.buyerId, buyerId)).orderBy(desc(designPurchases.createdAt));
  }
  async getDesignPurchasesByDesign(designId) {
    return db.select().from(designPurchases).where(eq(designPurchases.designId, designId)).orderBy(desc(designPurchases.createdAt));
  }
  async userHasPurchasedDesign(userId, designId) {
    const [purchase] = await db.select().from(designPurchases).where(and(eq(designPurchases.buyerId, userId), eq(designPurchases.designId, designId), eq(designPurchases.status, "completed")));
    return !!purchase;
  }
  async updateDesignPurchase(id, data) {
    await db.update(designPurchases).set(data).where(eq(designPurchases.id, id));
  }
  // Maker earnings operations (with retention)
  async createMakerEarning(makerId, designPurchaseId, amount) {
    const profile = await this.getMakerProfile(makerId);
    const method = profile?.payoutMethod || "bank";
    const retentionDays = method === "bank" ? 15 : 7;
    const availableDate = /* @__PURE__ */ new Date();
    availableDate.setDate(availableDate.getDate() + retentionDays);
    const [record] = await db.insert(makerEarnings).values({
      makerId,
      designPurchaseId,
      amount,
      availableDate
    }).returning();
    return record;
  }
  async getMakerEarnings(makerId) {
    return db.select().from(makerEarnings).where(eq(makerEarnings.makerId, makerId)).orderBy(desc(makerEarnings.createdAt));
  }
  async getMakerBalance(makerId) {
    try {
      const earningsResult = await db.execute(
        sql2`SELECT COALESCE(SUM(amount), 0) as total FROM maker_earnings WHERE maker_id = ${makerId}`
      );
      const totalEarnings = parseFloat(earningsResult.rows[0]?.total || "0");
      const completedPayoutsResult = await db.execute(
        sql2`SELECT COALESCE(SUM(amount), 0) as total FROM maker_payouts WHERE maker_id = ${makerId} AND status = 'completed'`
      );
      const completedPayouts = parseFloat(completedPayoutsResult.rows[0]?.total || "0");
      const finalBalance = Math.max(0, totalEarnings - completedPayouts);
      return finalBalance.toFixed(2);
    } catch (error) {
      console.error("Error calculating total balance:", error);
      return "0.00";
    }
  }
  async getMakerAvailableBalance(makerId) {
    try {
      const availableEarningsResult = await db.execute(
        sql2`SELECT COALESCE(SUM(amount), 0) as total FROM maker_earnings WHERE maker_id = ${makerId} AND available_date <= NOW()`
      );
      const availableEarnings = parseFloat(availableEarningsResult.rows[0]?.total || "0");
      const committedPayoutsResult = await db.execute(
        sql2`SELECT COALESCE(SUM(amount), 0) as total FROM maker_payouts WHERE maker_id = ${makerId} AND status NOT IN ('failed')`
      );
      const committedPayouts = parseFloat(committedPayoutsResult.rows[0]?.total || "0");
      const finalBalance = Math.max(0, availableEarnings - committedPayouts);
      return finalBalance.toFixed(2);
    } catch (error) {
      console.error("Error calculating available balance:", error);
      return "0.00";
    }
  }
  // Payout configuration
  async updatePayoutMethod(makerId, method, contactInfo) {
    const [profile] = await db.update(makerProfiles).set({
      payoutMethod: method,
      ...contactInfo
    }).where(eq(makerProfiles.userId, makerId)).returning();
    return profile;
  }
  // Maker payout operations
  async createMakerPayout(makerId, amount, method) {
    const [payout] = await db.insert(makerPayouts).values({
      makerId,
      amount,
      payoutMethod: method,
      status: "pending"
    }).returning();
    return payout;
  }
  async getMakerPayouts(makerId) {
    return db.select().from(makerPayouts).where(eq(makerPayouts.makerId, makerId)).orderBy(desc(makerPayouts.createdAt));
  }
  async updatePayoutStatus(payoutId, status, transactionId) {
    const updates = { status, sentAt: /* @__PURE__ */ new Date() };
    if (transactionId) {
      updates.stripePayoutId = transactionId;
    }
    await db.update(makerPayouts).set(updates).where(eq(makerPayouts.id, payoutId));
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  const registeredStrategies = /* @__PURE__ */ new Set();
  const ensureStrategy = (domain) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    const session2 = req.session;
    if (session2?.userId && session2?.userType) {
      req.session.destroy(() => {
        res.redirect("/");
      });
    } else {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
          }).href
        );
      });
    }
  });
}
var isAuthenticated = async (req, res, next) => {
  const session2 = req.session;
  const user = req.user;
  if (session2?.userId && session2?.userType) {
    return next();
  }
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
function getAuthenticatedUserId(req) {
  if (req.session?.userId) {
    return req.session.userId;
  }
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  return null;
}

// server/routes.ts
import { z as z2 } from "zod";

// server/stripeClient.ts
import Stripe from "stripe";
var connectionSettings;
async function getCredentials() {
  if (process.env.STRIPE_SECRET_KEY) {
    console.log("[Stripe] Using CENTRALIZED Stripe API key from environment");
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
      secretKey: process.env.STRIPE_SECRET_KEY
    };
  }
  console.log("[Stripe] STRIPE_SECRET_KEY not found, attempting to use Replit connector");
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  const connectorName = "stripe";
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", connectorName);
  url.searchParams.set("environment", targetEnvironment);
  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "X_REPLIT_TOKEN": xReplitToken
    }
  });
  const data = await response.json();
  connectionSettings = data.items?.[0];
  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }
  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret
  };
}
async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil"
  });
}
async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}
var stripeSync = null;
async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import("stripe-replit-sync");
    const secretKey = await getStripeSecretKey();
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL,
        max: 2
      },
      stripeSecretKey: secretKey
    });
  }
  return stripeSync;
}

// server/paypalClient.ts
import * as paypalCheckoutServerSDK from "@paypal/checkout-server-sdk";
async function getCredentials2() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("PayPal credentials not found in env vars or Replit connector");
  }
  const connectorName = "paypal";
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production";
  const targetEnvironment = isProduction ? "production" : "development";
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", connectorName);
  url.searchParams.set("environment", targetEnvironment);
  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "X_REPLIT_TOKEN": xReplitToken
    }
  });
  const data = await response.json();
  const connectionSettings2 = data.items?.[0];
  if (!connectionSettings2 || (!connectionSettings2.settings.client_id || !connectionSettings2.settings.secret)) {
    throw new Error(`PayPal ${targetEnvironment} connection not found`);
  }
  return {
    clientId: connectionSettings2.settings.client_id,
    clientSecret: connectionSettings2.settings.secret
  };
}
async function getPayPalClientId() {
  const { clientId } = await getCredentials2();
  return clientId;
}

// server/routes.ts
var wsClients = /* @__PURE__ */ new Map();
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/user/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/maker/balance", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const totalBalance = await storage.getMakerBalance(userId);
      const availableBalance = await storage.getMakerAvailableBalance(userId);
      res.json({
        totalBalance,
        availableBalance,
        message: "Balance fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch balance" });
    }
  });
  app2.post("/api/maker/payout-method", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { method, stripeEmail, paypalEmail, bankAccountIban, bankAccountName, stripeConnectAccountId, paypalAccountId } = req.body;
      if (!method || !["stripe", "paypal", "bank"].includes(method)) {
        return res.status(400).json({ message: "Invalid payout method" });
      }
      const profile = await storage.updatePayoutMethod(userId, method, {
        stripeEmail,
        paypalEmail,
        bankAccountIban,
        bankAccountName,
        stripeConnectAccountId,
        paypalAccountId
      });
      res.json({
        message: "Payout method updated successfully",
        profile
      });
    } catch (error) {
      console.error("Error updating payout method:", error);
      res.status(500).json({ message: error.message || "Failed to update payout method" });
    }
  });
  app2.get("/api/maker/payouts", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const payouts = await storage.getMakerPayouts(userId);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payouts" });
    }
  });
  app2.get("/api/maker/verify-payouts", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const stripe = await getUncachableStripeClient();
      const payouts = await storage.getMakerPayouts(userId);
      const results = [];
      for (const payout of payouts) {
        if (payout.status === "pending" || payout.status === "processing") {
          if (payout.stripePayoutId) {
            try {
              const stripeStatus = await stripe.payouts.retrieve(payout.stripePayoutId);
              console.log(`[Payout Verification] ${payout.id}: Stripe status = ${stripeStatus.status}`);
              let newStatus = payout.status;
              if (stripeStatus.status === "paid") {
                newStatus = "completed";
              } else if (stripeStatus.status === "in_transit" || stripeStatus.status === "pending") {
                newStatus = "processing";
              } else if (stripeStatus.status === "failed" || stripeStatus.status === "canceled") {
                newStatus = "failed";
              }
              if (newStatus !== payout.status) {
                await storage.updatePayoutStatus(payout.id, newStatus, payout.stripePayoutId);
                console.log(`[Payout Update] ${payout.id}: ${payout.status} \u2192 ${newStatus}`);
                const wsClient = wsClients.get(userId);
                if (wsClient && wsClient.readyState === WebSocket.OPEN) {
                  wsClient.send(JSON.stringify({
                    type: "payout_status_update",
                    payoutId: payout.id,
                    status: newStatus
                  }));
                }
                results.push({ id: payout.id, oldStatus: payout.status, newStatus });
              }
            } catch (e) {
              console.error(`Error checking Stripe payout ${payout.stripePayoutId}:`, e);
            }
          }
        }
      }
      res.json({ verified: results.length > 0, updates: results });
    } catch (error) {
      console.error("Error verifying payouts:", error);
      res.status(500).json({ message: error.message || "Failed to verify payouts" });
    }
  });
  app2.post("/api/maker/request-payout", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const profile = await storage.getMakerProfile(userId);
      if (!profile || !profile.payoutMethod) {
        return res.status(400).json({ message: "Please configure a payout method first" });
      }
      const isDevelopment = process.env.NODE_ENV === "development";
      if (profile.payoutMethod === "stripe" && !profile.stripeConnectAccountId && !isDevelopment) {
        return res.status(400).json({ message: "Please connect your Stripe account first" });
      }
      if (profile.payoutMethod === "paypal" && !profile.paypalAccountId && !isDevelopment) {
        return res.status(400).json({ message: "Please connect your PayPal account first" });
      }
      if (profile.payoutMethod === "bank" && parseFloat(amount) < 20) {
        return res.status(400).json({ message: "Minimum \u20AC20.00 required for bank transfers" });
      }
      if ((profile.payoutMethod === "stripe" || profile.payoutMethod === "paypal") && parseFloat(amount) < 10) {
        return res.status(400).json({ message: "Minimum \u20AC10.00 required for Stripe/PayPal payouts" });
      }
      const availableBalance = await storage.getMakerAvailableBalance(userId);
      if (parseFloat(availableBalance) < parseFloat(amount)) {
        return res.status(400).json({
          message: `Insufficient balance. Available: \u20AC${availableBalance}`
        });
      }
      const payout = await storage.createMakerPayout(userId, amount, profile.payoutMethod);
      if (profile.payoutMethod === "stripe") {
        const accountId = profile.stripeConnectAccountId || "acct_test_development";
        executeStripePayout(accountId, amount, payout).catch((err) => {
          console.error("Error executing Stripe payout:", err);
        });
      } else if (profile.payoutMethod === "paypal") {
        let paypalRecipient = profile.paypalAccountId || profile?.paypalEmail || profile?.stripeEmail || "test@voxelhub.dev";
        executePayPalPayout(paypalRecipient, amount, payout).catch((err) => {
          console.error("Error executing PayPal payout:", err);
        });
      }
      res.json({
        message: "Payout request created successfully. Verifying with payment provider...",
        payout
      });
    } catch (error) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: error.message || "Failed to request payout" });
    }
  });
  async function executeStripePayout(stripeConnectAccountId, amount, payoutRecord) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const currency = isDevelopment ? "usd" : "eur";
    const makerId = payoutRecord.makerId || payoutRecord.maker_id;
    try {
      console.log("\n=== PAYOUT EXECUTION START ===");
      console.log("\u{1F504} Initiating Stripe payout...");
      console.log("   Environment:", isDevelopment ? "DEVELOPMENT" : "PRODUCTION");
      console.log("   Amount: " + (isDevelopment ? "$" : "\u20AC") + parseFloat(amount).toFixed(2));
      console.log("   Currency:", currency.toUpperCase());
      console.log("   Payout ID:", payoutRecord.id);
      if (isDevelopment) {
        console.log("   \u2139 Dev mode: Starting simulated payout workflow");
        const fakePayoutId = "py_test_" + Date.now();
        console.log("   \u{1F4CD} Step 1/3: PENDING - Dinero bloqueado");
        const client1 = wsClients.get(makerId);
        if (client1 && client1.readyState === WebSocket.OPEN) {
          client1.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "pending" }));
        }
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(payoutRecord.id, "processing", fakePayoutId);
            console.log("   \u2713 Step 2/3: PROCESSING - Enviando a banco");
            const client2 = wsClients.get(makerId);
            if (client2 && client2.readyState === WebSocket.OPEN) {
              client2.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "processing" }));
            }
          } catch (e) {
            console.error("Error updating to processing:", e);
          }
        }, 3e3);
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(payoutRecord.id, "completed", fakePayoutId);
            console.log("\u2705 Step 3/3: COMPLETED - Dinero enviado");
            const client3 = wsClients.get(makerId);
            if (client3 && client3.readyState === WebSocket.OPEN) {
              client3.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "completed" }));
            }
          } catch (e) {
            console.error("Error updating to completed:", e);
          }
        }, 6e3);
        console.log("   \u2713 Payout workflow initiated");
        console.log("   Fake Payout ID:", fakePayoutId);
        console.log("=== PAYOUT EXECUTION END ===\n");
        return;
      }
      const stripe = await getUncachableStripeClient();
      console.log("   \u2713 Stripe client initialized (production)");
      const payout = await stripe.payouts.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency,
        method: "standard",
        // Use standard for production (more reliable)
        description: `VoxelHub maker payout #${payoutRecord.id.substring(0, 8)}`
      });
      console.log("\u2705 Stripe payout created successfully!");
      console.log("   Payout ID:", payout.id);
      console.log("   Status:", payout.status);
      console.log("   Amount: " + (payout.amount / 100).toFixed(2) + " " + payout.currency.toUpperCase());
      console.log("   Check: https://dashboard.stripe.com/payouts/" + payout.id);
      const newStatus = payout.status === "paid" ? "completed" : "processing";
      await storage.updatePayoutStatus(payoutRecord.id, newStatus, payout.id);
      console.log("   \u2713 Database updated, Status: " + newStatus);
      const wsClient = wsClients.get(makerId);
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: newStatus }));
      }
      console.log("=== PAYOUT EXECUTION END ===\n");
      return payout;
    } catch (error) {
      console.error("\n\u274C PAYOUT ERROR:");
      console.error("   Message:", error.message);
      console.error("   Code:", error.code || "N/A");
      try {
        await storage.updatePayoutStatus(payoutRecord.id, "failed");
        console.log("   \u2713 Marked as FAILED in database");
        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "failed" }));
        }
      } catch (_) {
        console.error("   \u26A0 Could not mark as failed");
      }
      console.error("=== PAYOUT EXECUTION END (ERROR) ===\n");
    }
  }
  async function executePayPalPayout(paypalAccountId, amount, payoutRecord) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const makerId = payoutRecord.makerId || payoutRecord.maker_id;
    try {
      console.log("\n=== PAYPAL PAYOUT EXECUTION START ===");
      console.log("\u{1F504} Processing PayPal payout...");
      console.log("   Recipient:", paypalAccountId);
      console.log("   Amount: \u20AC" + parseFloat(amount).toFixed(2));
      console.log("   Environment:", isDevelopment ? "DEVELOPMENT" : "PRODUCTION");
      console.log("   Payout ID:", payoutRecord.id);
      if (isDevelopment) {
        console.log("   \u2139 Dev mode: Starting simulated PayPal payout workflow");
        const fakePayoutId = "PAYID_" + Date.now();
        console.log("   \u{1F4CD} Step 1/3: PENDING - Dinero bloqueado");
        const client1 = wsClients.get(makerId);
        if (client1 && client1.readyState === WebSocket.OPEN) {
          client1.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "pending" }));
        }
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(payoutRecord.id, "processing", fakePayoutId);
            console.log("   \u2713 Step 2/3: PROCESSING - Enviando a PayPal");
            const client2 = wsClients.get(makerId);
            if (client2 && client2.readyState === WebSocket.OPEN) {
              client2.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "processing" }));
            }
          } catch (e) {
            console.error("Error updating to processing:", e);
          }
        }, 3e3);
        setTimeout(async () => {
          try {
            await storage.updatePayoutStatus(payoutRecord.id, "completed", fakePayoutId);
            console.log("\u2705 Step 3/3: COMPLETED - Dinero enviado a PayPal");
            const client3 = wsClients.get(makerId);
            if (client3 && client3.readyState === WebSocket.OPEN) {
              client3.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "completed" }));
            }
          } catch (e) {
            console.error("Error updating to completed:", e);
          }
        }, 6e3);
        console.log("   \u2713 PayPal payout workflow initiated");
        console.log("   Fake Payout ID:", fakePayoutId);
        console.log("=== PAYPAL PAYOUT EXECUTION END ===\n");
        return;
      }
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        throw new Error("PayPal credentials not configured in environment");
      }
      const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
      const apiBase = isProduction ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const auth = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      if (!tokenResponse.ok) {
        throw new Error(`PayPal auth failed: ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const payoutResponse = await fetch(`${apiBase}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `payout_${Date.now()}`,
            email_subject: "VoxelHub Payout",
            email_message: "Your payout from VoxelHub"
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: parseFloat(amount).toFixed(2),
                currency: "EUR"
              },
              receiver: paypalAccountId,
              note: "VoxelHub Marketplace Earnings"
            }
          ]
        })
      });
      const payoutData = await payoutResponse.json();
      if (payoutData.batch_header?.payout_batch_id) {
        console.log("\u2705 PayPal payout SENT");
        console.log("   Batch ID:", payoutData.batch_header.payout_batch_id);
        console.log("   Status:", payoutData.batch_header.batch_status);
        console.log("   To: " + paypalAccountId);
        console.log("   Amount: \u20AC" + parseFloat(amount).toFixed(2));
        await storage.updatePayoutStatus(payoutRecord.id, "processing", payoutData.batch_header.payout_batch_id);
        const wsClient = wsClients.get(makerId);
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "processing" }));
        }
        console.log("=== PAYPAL PAYOUT EXECUTION END ===\n");
      } else {
        console.error("\u274C PayPal payout failed:", payoutData);
        await storage.updatePayoutStatus(payoutRecord.id, "failed");
        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "failed" }));
        }
      }
    } catch (error) {
      console.error("\u274C PayPal payout error:", error.message);
      try {
        await storage.updatePayoutStatus(payoutRecord.id, "failed");
        const wsClientFail = wsClients.get(makerId);
        if (wsClientFail && wsClientFail.readyState === WebSocket.OPEN) {
          wsClientFail.send(JSON.stringify({ type: "payout_status_update", payoutId: payoutRecord.id, status: "failed" }));
        }
      } catch (_) {
        console.error("   \u26A0 Could not mark as failed");
      }
    }
  }
  app2.get("/api/maker/stripe-status", isAuthenticated, async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const accounts = await stripe.accounts.listExternalAccounts("self");
      const hasBankAccount = accounts.data && accounts.data.length > 0;
      res.json({
        hasBankAccount,
        setupInstructions: !hasBankAccount ? {
          title: "No hay cuenta bancaria vinculada",
          steps: [
            "1. Abre https://dashboard.stripe.com/test/settings/payouts",
            "2. Haz clic en 'Add external account'",
            "3. Selecciona 'Bank account'",
            "4. Ingresa estos datos de prueba:",
            "   - Routing: 110000000",
            "   - Account: 000111111116",
            "5. Guarda y vuelve a intentar el payout"
          ]
        } : null
      });
    } catch (error) {
      res.json({
        hasBankAccount: false,
        error: error.message
      });
    }
  });
  app2.get("/api/maker/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const makerProfile = await storage.getMakerProfile(id);
      if (!makerProfile) {
        return res.status(404).json({ message: "Maker profile not found" });
      }
      const normalizedProfile = {
        ...makerProfile,
        rating: makerProfile.rating ? parseFloat(String(makerProfile.rating)) : 0
      };
      res.json(normalizedProfile);
    } catch (error) {
      console.error("Error fetching maker profile:", error);
      res.status(500).json({ message: "Failed to fetch maker profile" });
    }
  });
  app2.put("/api/user/type", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { userType } = req.body;
      if (!userType || !["client", "maker"].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type. Must be 'client' or 'maker'" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        userType
      });
      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });
  app2.post("/api/user/:userId/profile", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { userId } = req.params;
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ message: "Cannot edit another user's profile" });
      }
      const { firstName, lastName, location, showFullName } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        username: user.username,
        location: location || user.location,
        profileImageUrl: user.profileImageUrl,
        userType: user.userType,
        showFullName: showFullName !== void 0 ? showFullName : user.showFullName
      });
      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/user/:userId/profile-image", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { userId } = req.params;
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ message: "Cannot edit another user's profile" });
      }
      const { profileImageUrl } = req.body;
      if (!profileImageUrl) {
        return res.status(400).json({ message: "profileImageUrl is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl,
        userType: user.userType
      });
      const updated = await storage.getUser(userId);
      res.json(updated);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username, firstName, lastName, userType, location, makerProfile } = req.body;
      if (!email || !password || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.registerUser({
        email,
        password,
        username,
        firstName,
        lastName,
        userType,
        location
      });
      if (userType === "maker" && makerProfile) {
        await storage.upsertMakerProfile({
          userId: user.id,
          ...makerProfile
        });
      }
      const verificationToken = await storage.createEmailToken(email, "verification");
      const verificationLink = `${process.env.PUBLIC_URL || "http://localhost:5000"}/verify?token=${verificationToken}`;
      console.log(`
=== EMAIL VERIFICATION ===`);
      console.log(`To: ${email}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Token: ${verificationToken}`);
      console.log(`========================
`);
      req.session.userId = user.id;
      req.session.userType = userType;
      res.json({
        message: "Registration successful. Check your email for verification link.",
        user,
        verificationToken
        // Send token in response for testing
      });
    } catch (error) {
      console.error("Error with registration:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  app2.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      const email = await storage.verifyEmailToken(token, "verification");
      if (!email) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.upsertUser({
          ...user,
          isEmailVerified: true
        });
      }
      res.json({ message: "Email verified successfully", user });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(400).json({ message: error.message || "Verification failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.userType = user.userType;
      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Error with login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/projects/my-projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }
      const projects2 = await storage.getProjects({ userId });
      const limitedProjects = projects2.slice(0, 50);
      const projectsWithBids = [];
      for (let i = 0; i < limitedProjects.length; i += 5) {
        const chunk = limitedProjects.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const bids2 = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: bids2.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app2.get("/api/projects/available", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }
      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");
      const projects2 = await storage.getProjects({ status: "active" });
      const paginatedProjects = projects2.slice(offset, offset + limit);
      const projectsWithBids = [];
      for (let i = 0; i < paginatedProjects.length; i += 3) {
        const chunk = paginatedProjects.slice(i, i + 3);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const bids2 = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: bids2.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching available projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app2.get("/api/projects/my-bids", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }
      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");
      const bids2 = await storage.getBidsByMaker(userId);
      const projectIds = [...new Set(bids2.map((b) => b.projectId))].slice(offset, offset + limit);
      const projects2 = [];
      for (let i = 0; i < projectIds.length; i += 5) {
        const chunk = projectIds.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map((projectId) => storage.getProject(projectId))
        );
        projects2.push(...chunkResults);
      }
      const validProjects = projects2.filter((p) => p !== void 0);
      const projectsWithBids = [];
      for (let i = 0; i < validProjects.length; i += 5) {
        const chunk = validProjects.slice(i, i + 5);
        const chunkResults = await Promise.all(
          chunk.map(async (project) => {
            const projectBids = await storage.getBidsByProject(project.id);
            return { ...project, bidCount: projectBids.length };
          })
        );
        projectsWithBids.push(...chunkResults);
      }
      res.json(projectsWithBids);
    } catch (error) {
      console.error("Error fetching my-bid projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app2.get("/api/projects/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }
      const stats = await storage.getClientStats(userId);
      res.set("Cache-Control", "public, max-age=30");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.get("/api/projects/total-unread-bids", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can check unread bids" });
      }
      const totalUnread = await storage.getTotalUnreadBidsForClient(userId);
      res.json({ totalUnread });
    } catch (error) {
      console.error("Error fetching total unread bids:", error);
      res.status(500).json({ message: "Failed to fetch total unread bids" });
    }
  });
  app2.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      let project = await storage.getProject(id);
      if (!project) {
        const deletedProject = await storage.getProjectIncludeDeleted(id);
        if (deletedProject && deletedProject.deletedAt) {
          project = deletedProject;
        }
      }
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  app2.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can create projects" });
      }
      const activeCount = await storage.getActiveProjectCount(userId);
      if (activeCount >= 10) {
        return res.status(400).json({ message: "You have reached the limit of 10 active projects" });
      }
      const validated = insertProjectSchema.parse(req.body);
      if (!validated.stlFileNames) {
        validated.stlFileNames = [];
      }
      if (!validated.stlFileContents) {
        validated.stlFileContents = [];
      }
      if (validated.stlFileName && validated.stlFileNames.length === 0) {
        validated.stlFileNames = [validated.stlFileName];
      }
      if (validated.stlFileContent && validated.stlFileContents.length === 0) {
        validated.stlFileContents = [validated.stlFileContent];
      }
      const project = await storage.createProject({ ...validated, userId });
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: error.message || "Failed to create project" });
    }
  });
  app2.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own projects" });
      }
      if (project.status === "completed") {
        return res.status(400).json({ message: "Completed projects cannot be deleted - they serve as proof of completion" });
      }
      const projectBids = await storage.getBidsByProject(id);
      for (const bid of projectBids) {
        if (bid.status === "pending") {
          await storage.updateBidStatus(bid.id, "rejected");
          const makerWs = wsClients.get(bid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(JSON.stringify({
              type: "bid_rejected",
              projectId: bid.projectId,
              bidId: bid.id
            }));
          }
        }
      }
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: error.message || "Failed to delete project" });
    }
  });
  app2.get("/api/projects/:id/bids", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (user?.userType === "client" && project.userId !== userId) {
        return res.status(403).json({ message: "You can only see bids for your own projects" });
      }
      if (user?.userType === "client" && project.userId === userId) {
        await storage.markBidsAsRead(id);
      }
      const bids2 = await storage.getBidsByProject(id);
      const limitedBids = bids2.slice(0, 20);
      const bidsWithMakers = await Promise.all(
        limitedBids.map(async (bid) => {
          const maker = await storage.getUser(bid.makerId);
          const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;
          return {
            ...bid,
            maker: maker ? { ...maker, makerProfile } : void 0
          };
        })
      );
      res.json(bidsWithMakers);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });
  app2.get("/api/projects/:id/unread-bid-count", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (user?.userType !== "client" || project.userId !== userId) {
        return res.status(403).json({ message: "You can only check bids for your own projects" });
      }
      const unreadCount = await storage.getUnreadBidCount(id);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread bid count:", error);
      res.status(500).json({ message: "Failed to fetch unread bid count" });
    }
  });
  app2.get("/api/projects/:id/my-bid", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }
      const bid = await storage.getMakerBidForProject(userId, id);
      res.json(bid || null);
    } catch (error) {
      console.error("Error fetching bid:", error);
      res.status(500).json({ message: "Failed to fetch bid" });
    }
  });
  app2.get("/api/projects/:id/accepted-bid", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (user?.userType === "client" && project.userId !== userId) {
        return res.status(403).json({ message: "You can only see bids for your own projects" });
      }
      const bids2 = await storage.getBidsByProject(id);
      const acceptedBid = bids2.find((b) => b.status === "accepted");
      if (!acceptedBid) {
        return res.json(null);
      }
      const maker = await storage.getUser(acceptedBid.makerId);
      const makerProfile = maker ? await storage.getMakerProfile(maker.id) : null;
      res.json({
        ...acceptedBid,
        maker: maker ? { ...maker, makerProfile } : void 0
      });
    } catch (error) {
      console.error("Error fetching accepted bid:", error);
      res.status(500).json({ message: "Failed to fetch accepted bid" });
    }
  });
  app2.get("/api/projects/:id/download-stl", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.deletedAt) {
        return res.status(403).json({ message: "Cannot download STL from deleted projects" });
      }
      res.json({ fileName: project.stlFileName });
    } catch (error) {
      console.error("Error downloading STL:", error);
      res.status(500).json({ message: "Failed to download STL" });
    }
  });
  app2.get("/api/projects/:id/stl-content", async (req, res) => {
    try {
      const { id } = req.params;
      const index2 = parseInt(req.query.index || "0");
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.deletedAt) {
        return res.status(403).json({ message: "Cannot access STL from deleted projects" });
      }
      let stlContent;
      const stlFileContents = project.stlFileContents;
      if (stlFileContents && Array.isArray(stlFileContents) && stlFileContents.length > 0) {
        if (index2 >= 0 && index2 < stlFileContents.length) {
          stlContent = stlFileContents[index2];
        } else {
          stlContent = stlFileContents[0];
        }
      } else {
        stlContent = project.stlFileContent;
      }
      if (!stlContent) {
        return res.status(404).json({ message: "STL file not found" });
      }
      const binaryData = Buffer.from(stlContent, "base64");
      res.type("application/octet-stream").send(binaryData);
    } catch (error) {
      console.error("Error serving STL content:", error);
      res.status(500).json({ message: "Failed to serve STL" });
    }
  });
  app2.put("/api/projects/:id/mark-bids-read", isAuthenticated, async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only mark bids as read for your own projects" });
      }
      await storage.markBidsAsRead(projectId);
      res.json({ message: "Bids marked as read" });
    } catch (error) {
      console.error("Error marking bids as read:", error);
      res.status(500).json({ message: "Failed to mark bids as read" });
    }
  });
  app2.post("/api/projects/:id/bids", isAuthenticated, async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can submit bids" });
      }
      const profile = await storage.getMakerProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Please complete your maker profile first" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.status !== "active") {
        return res.status(400).json({ message: "This project is no longer accepting bids" });
      }
      const existingBid = await storage.getMakerBidForProject(userId, projectId);
      if (existingBid && existingBid.status !== "rejected") {
        return res.status(400).json({ message: "You already have a bid for this project" });
      }
      const validated = insertBidSchema.parse(req.body);
      const bid = await storage.createBid({
        ...validated,
        projectId,
        makerId: userId
      });
      const ownerWs = wsClients.get(project.userId);
      if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
        ownerWs.send(JSON.stringify({
          type: "new_bid",
          projectId,
          bidId: bid.id
        }));
      }
      res.json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(400).json({ message: error.message || "Failed to create bid" });
    }
  });
  app2.put("/api/bids/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can accept bids" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only accept bids for your own projects" });
      }
      await storage.updateBidStatus(id, "accepted");
      await storage.updateProjectStatus(bid.projectId, "completed");
      const allBids = await storage.getBidsByProject(bid.projectId);
      for (const otherBid of allBids) {
        if (otherBid.id !== id && otherBid.status === "pending") {
          await storage.updateBidStatus(otherBid.id, "rejected");
          const makerWs = wsClients.get(otherBid.makerId);
          if (makerWs && makerWs.readyState === WebSocket.OPEN) {
            makerWs.send(JSON.stringify({
              type: "bid_rejected",
              projectId: bid.projectId,
              bidId: otherBid.id
            }));
          }
        }
      }
      const acceptedMakerWs = wsClients.get(bid.makerId);
      if (acceptedMakerWs && acceptedMakerWs.readyState === WebSocket.OPEN) {
        acceptedMakerWs.send(JSON.stringify({
          type: "bid_accepted",
          projectId: bid.projectId,
          bidId: id
        }));
      }
      res.json({ message: "Bid accepted successfully" });
    } catch (error) {
      console.error("Error accepting bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });
  app2.put("/api/bids/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can reject bids" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only reject bids for your own projects" });
      }
      await storage.updateBidStatus(id, "rejected");
      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(JSON.stringify({
          type: "bid_rejected",
          projectId: bid.projectId,
          bidId: id
        }));
      }
      res.json({ message: "Bid rejected successfully" });
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });
  app2.patch("/api/bids/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      if (bid.makerId !== userId) {
        return res.status(403).json({ message: "Only the bid creator can edit it" });
      }
      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Can only edit pending bids" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project || project.deletedAt) {
        return res.status(400).json({ message: "Cannot edit bids for deleted projects" });
      }
      const validated = updateBidSchema.parse(req.body);
      await storage.updateBid(id, validated);
      const updatedBid = await storage.getBid(id);
      res.json(updatedBid);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating bid:", error);
      res.status(500).json({ message: "Failed to update bid" });
    }
  });
  app2.delete("/api/bids/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      if (bid.makerId !== userId) {
        return res.status(403).json({ message: "Only the bid creator can delete it" });
      }
      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Can only delete pending bids" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project || project.deletedAt) {
        return res.status(400).json({ message: "Cannot delete bids for deleted projects" });
      }
      await storage.deleteBid(id);
      if (project) {
        const clientWs = wsClients.get(project.userId);
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: "bid_deleted",
            projectId: bid.projectId,
            bidId: id
          }));
        }
      }
      res.json({ message: "Bid deleted successfully" });
    } catch (error) {
      console.error("Error deleting bid:", error);
      res.status(500).json({ message: "Failed to delete bid" });
    }
  });
  app2.put("/api/bids/:id/confirm-delivery", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can confirm delivery" });
      }
      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      if (bid.status !== "accepted") {
        return res.status(400).json({ message: "Can only confirm delivery for accepted bids" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "You can only confirm delivery for your own projects" });
      }
      await storage.createReview({
        projectId: bid.projectId,
        fromUserId: userId,
        toUserId: bid.makerId,
        rating: Number(rating),
        comment: comment || ""
      });
      await storage.confirmBidDelivery(id);
      await storage.updateProjectStatus(bid.projectId, "completed");
      const allBids = await storage.getBidsByProject(bid.projectId);
      for (const otherBid of allBids) {
        if (otherBid.id !== id && otherBid.status === "pending") {
          await storage.updateBidStatus(otherBid.id, "rejected");
          const makerWs2 = wsClients.get(otherBid.makerId);
          if (makerWs2 && makerWs2.readyState === WebSocket.OPEN) {
            makerWs2.send(JSON.stringify({
              type: "bid_rejected",
              projectId: bid.projectId,
              bidId: otherBid.id
            }));
          }
        }
      }
      const makerWs = wsClients.get(bid.makerId);
      if (makerWs && makerWs.readyState === WebSocket.OPEN) {
        makerWs.send(JSON.stringify({
          type: "delivery_confirmed",
          projectId: bid.projectId,
          bidId: id,
          clientName: user?.firstName || user?.email || "Cliente",
          projectName: project?.name || "Proyecto",
          clientId: userId
        }));
      }
      res.json({ message: "Delivery confirmed successfully" });
    } catch (error) {
      console.error("Error confirming delivery:", error);
      res.status(500).json({ message: "Failed to confirm delivery" });
    }
  });
  app2.get("/api/bids/my-bids", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }
      const limit = Math.min(parseInt(req.query.limit || "15"), 50);
      const offset = parseInt(req.query.offset || "0");
      const bids2 = await storage.getBidsByMaker(userId);
      const paginatedBids = bids2.slice(offset, offset + limit);
      const enrichedBids = [];
      for (let i = 0; i < paginatedBids.length; i += 3) {
        const chunk = paginatedBids.slice(i, i + 3);
        const chunkResults = await Promise.all(
          chunk.map(async (bid) => {
            const project = await storage.getProjectIncludeDeleted(bid.projectId);
            return { ...bid, project };
          })
        );
        enrichedBids.push(...chunkResults);
      }
      console.log(`[/api/bids/my-bids] User ${userId.slice(0, 8)}... has ${enrichedBids.length} bids:`, enrichedBids.map((b) => ({ projectId: b.projectId, status: b.status, deleted: b.project?.deletedAt ? true : false })));
      res.json(enrichedBids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });
  app2.get("/api/bids/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can access this endpoint" });
      }
      const stats = await storage.getMakerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.put("/api/bids/:id/rate-client", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can rate clients" });
      }
      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }
      const bid = await storage.getBid(id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      if (bid.makerId !== userId) {
        return res.status(403).json({ message: "You can only rate your own clients" });
      }
      if (!bid.deliveryConfirmedAt) {
        return res.status(400).json({ message: "Can only rate after delivery is confirmed" });
      }
      const project = await storage.getProject(bid.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      await storage.createReview({
        projectId: bid.projectId,
        fromUserId: userId,
        toUserId: project.userId,
        rating: Number(rating),
        comment: comment || ""
      });
      res.json({ message: "Client rated successfully" });
    } catch (error) {
      console.error("Error rating client:", error);
      res.status(500).json({ message: "Failed to rate client" });
    }
  });
  app2.get("/api/projects/:projectId/check-rating-by-maker", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) {
        return res.status(404).json({ message: "No bid found for this project" });
      }
      console.log("Checking bid delivery status:", { bidId: bid.id, deliveryConfirmedAt: bid.deliveryConfirmedAt, status: bid.status });
      const deliveryConfirmed = !!bid.deliveryConfirmedAt;
      if (!deliveryConfirmed) {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }
      const review = await storage.getReviewForProject(projectId, userId, project.userId);
      res.json({ hasRated: !!review, deliveryConfirmed: true });
    } catch (error) {
      console.error("Error checking rating:", error);
      res.status(500).json({ message: "Failed to check rating" });
    }
  });
  app2.put("/api/projects/:projectId/rate-client-from-won-project", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const { rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can rate clients" });
      }
      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const bid = await storage.getMakerBidForProject(userId, projectId);
      if (!bid) {
        return res.status(404).json({ message: "No bid found for this project" });
      }
      if (bid.status !== "accepted" || !bid.deliveryConfirmedAt) {
        return res.status(400).json({ message: "Can only rate after delivery is confirmed" });
      }
      const existingReview = await storage.getReviewForProject(projectId, userId, project.userId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already rated this client" });
      }
      await storage.createReview({
        projectId,
        fromUserId: userId,
        toUserId: project.userId,
        rating: Number(rating),
        comment: comment || ""
      });
      res.json({ message: "Client rated successfully" });
    } catch (error) {
      console.error("Error rating client:", error);
      res.status(500).json({ message: "Failed to rate client" });
    }
  });
  app2.get("/api/maker-profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const profile = await storage.getMakerProfile(userId);
      if (!profile) {
        return res.json(null);
      }
      const normalizedProfile = {
        ...profile,
        rating: profile.rating ? parseFloat(String(profile.rating)) : 0
      };
      res.json(normalizedProfile);
    } catch (error) {
      console.error("Error fetching maker profile:", error);
      res.status(500).json({ message: "Failed to fetch maker profile" });
    }
  });
  app2.post("/api/maker-profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can create profiles" });
      }
      const validated = insertMakerProfileSchema.parse(req.body);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error) {
      console.error("Error creating maker profile:", error);
      res.status(400).json({ message: error.message || "Failed to create maker profile" });
    }
  });
  app2.put("/api/maker-profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can update profiles" });
      }
      const { showFullName, ...makerData } = req.body;
      if (showFullName !== void 0) {
        await storage.upsertUser({
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          userType: user.userType,
          showFullName
        });
      }
      const validated = insertMakerProfileSchema.parse(makerData);
      const profile = await storage.upsertMakerProfile({ ...validated, userId });
      res.json(profile);
    } catch (error) {
      console.error("Error updating maker profile:", error);
      res.status(400).json({ message: error.message || "Failed to update maker profile" });
    }
  });
  app2.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId, marketplaceDesignId, otherUserId } = req.query;
      console.log(`[GET /api/messages] userId: ${userId.slice(0, 8)}..., otherUserId: ${otherUserId?.slice(0, 8)}..., projectId: ${projectId}, marketplaceDesignId: ${marketplaceDesignId}`);
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }
      if (projectId) {
        const messages2 = await storage.getMessagesByContext(userId, otherUserId, "project", projectId);
        console.log(`[GET /api/messages] Returning ${messages2.length} messages for project ${projectId.slice(0, 8)}...`);
        return res.json(messages2);
      }
      if (marketplaceDesignId) {
        const messages2 = await storage.getMessagesByContext(userId, otherUserId, "marketplace_design", marketplaceDesignId);
        console.log(`[GET /api/messages] Returning ${messages2.length} messages for design ${marketplaceDesignId.slice(0, 8)}...`);
        return res.json(messages2);
      }
      console.log(`[GET /api/messages] ERROR: Missing context (projectId and marketplaceDesignId both empty)`);
      return res.status(400).json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertMessageSchema.parse(req.body);
      const messageData = { ...validated, senderId: userId };
      const message = await storage.createMessage(messageData);
      const receiverWs = wsClients.get(validated.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify({
          type: "new_message",
          messageId: message.id,
          senderId: userId,
          contextType: validated.contextType,
          projectId: validated.projectId,
          marketplaceDesignId: validated.marketplaceDesignId
        }));
      }
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to create message" });
    }
  });
  app2.put("/api/messages/mark-read/:otherUserId", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { otherUserId } = req.params;
      const { projectId, marketplaceDesignId } = req.query;
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }
      if (projectId) {
        await storage.markMessagesAsReadByContext(userId, otherUserId, "project", projectId);
        return res.json({ success: true });
      }
      if (marketplaceDesignId) {
        await storage.markMessagesAsReadByContext(userId, otherUserId, "marketplace_design", marketplaceDesignId);
        return res.json({ success: true });
      }
      return res.status(400).json({ message: "Either projectId or marketplaceDesignId is required" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(400).json({ message: error.message || "Failed to mark messages as read" });
    }
  });
  app2.get("/api/my-conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const conversations = await storage.getConversationsWithUnread(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/my-conversations-full", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const conversations = await storage.getConversationsWithUnread(userId);
      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const user = await storage.getUser(conv.userId);
          const project = conv.projectId ? await storage.getProjectIncludeDeleted(conv.projectId) : null;
          const design = conv.marketplaceDesignId ? await storage.getMarketplaceDesignIncludeDeleted(conv.marketplaceDesignId) : null;
          return {
            userId: conv.userId,
            projectId: conv.projectId,
            marketplaceDesignId: conv.marketplaceDesignId,
            user,
            project,
            design,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching conversations with user data:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/users/:id/review-count", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const reviews2 = await storage.getReviewsForMaker(id);
      res.json({ count: reviews2.length });
    } catch (error) {
      console.error("Error fetching review count:", error);
      res.status(500).json({ message: "Failed to fetch review count" });
    }
  });
  app2.get("/api/makers/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const reviews2 = await storage.getReviewsForMaker(id);
      const enriched = await Promise.all(
        reviews2.map(async (review) => {
          const fromUser = await storage.getUser(review.fromUserId);
          return {
            ...review,
            fromUser
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/reviews/my-reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const reviews2 = await storage.getReviewsForMaker(userId);
      const enriched = await Promise.all(
        reviews2.map(async (review) => {
          const fromUser = await storage.getUser(review.fromUserId);
          return {
            ...review,
            fromUser
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching maker reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/projects/:projectId/review-from-client", isAuthenticated, async (req, res) => {
    try {
      const makerId = getAuthenticatedUserId(req);
      if (!makerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId } = req.params;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const review = await storage.getReviewForProject(projectId, project.userId, makerId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      const fromUser = await storage.getUser(review.fromUserId);
      res.json({
        ...review,
        fromUser
      });
    } catch (error) {
      console.error("Error fetching review from client:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });
  app2.get("/api/projects/:projectId/review-from-maker", isAuthenticated, async (req, res) => {
    try {
      const clientId = getAuthenticatedUserId(req);
      if (!clientId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { projectId } = req.params;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const bids2 = await storage.getBidsByProject(projectId);
      const acceptedBid = bids2.find((b) => b.status === "accepted");
      if (!acceptedBid) {
        return res.status(404).json({ message: "No accepted bid found" });
      }
      const review = await storage.getReviewForProject(projectId, acceptedBid.makerId, clientId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      const fromUser = await storage.getUser(review.fromUserId);
      res.json({
        ...review,
        fromUser
      });
    } catch (error) {
      console.error("Error fetching review from maker:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });
  app2.get("/api/projects/:projectId/check-rating-by-client", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.status !== "completed") {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }
      const bids2 = await storage.getBidsByProject(projectId);
      const acceptedBid = bids2.find((b) => b.status === "accepted");
      if (!acceptedBid) {
        return res.json({ hasRated: false, deliveryConfirmed: false });
      }
      const review = await storage.getReviewForProject(projectId, userId, acceptedBid.makerId);
      res.json({ hasRated: !!review, deliveryConfirmed: true });
    } catch (error) {
      console.error("Error checking rating:", error);
      res.status(500).json({ message: "Failed to check rating" });
    }
  });
  app2.put("/api/projects/:projectId/rate-maker-as-client", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const { makerId, rating, comment } = req.body;
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can rate makers" });
      }
      if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: "Valid rating is required" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ message: "You can only rate makers for your own projects" });
      }
      const bids2 = await storage.getBidsByProject(projectId);
      const acceptedBid = bids2.find((b) => b.status === "accepted" && b.makerId === makerId);
      if (!acceptedBid) {
        return res.status(400).json({ message: "Invalid bid or maker" });
      }
      const existingReview = await storage.getReviewForProject(projectId, userId, makerId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already rated this maker" });
      }
      await storage.createReview({
        projectId,
        fromUserId: userId,
        toUserId: makerId,
        rating: Number(rating),
        comment: comment || ""
      });
      res.json({ message: "Maker rated successfully" });
    } catch (error) {
      console.error("Error rating maker:", error);
      res.status(500).json({ message: "Failed to rate maker" });
    }
  });
  app2.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertReviewSchema.parse(req.body);
      const user = await storage.getUser(userId);
      if (user?.userType !== "client") {
        return res.status(403).json({ message: "Only clients can leave reviews" });
      }
      const bid = await storage.getBid(validated.projectId);
      if (!bid || bid.status !== "accepted" || bid.makerId !== validated.toUserId) {
        return res.status(400).json({ message: "Invalid project or bid" });
      }
      const review = await storage.createReview({ ...validated, fromUserId: userId });
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });
  app2.get("/api/marketplace/designs", async (req, res) => {
    try {
      const designs = await storage.getMarketplaceDesigns({ status: "active" });
      const enriched = await Promise.all(
        designs.map(async (design) => {
          const maker = await storage.getUser(design.makerId);
          const makerProfile = await storage.getMakerProfile(design.makerId);
          return {
            ...design,
            maker,
            makerProfile
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching marketplace designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });
  app2.get("/api/marketplace/designs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let design = await storage.getMarketplaceDesign(id);
      if (!design) {
        const deletedDesign = await storage.getMarketplaceDesignIncludeDeleted(id);
        if (deletedDesign && deletedDesign.deletedAt) {
          design = deletedDesign;
        }
      }
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      const maker = await storage.getUser(design.makerId);
      const makerProfile = await storage.getMakerProfile(design.makerId);
      res.json({
        ...design,
        maker,
        makerProfile
      });
    } catch (error) {
      console.error("Error fetching design:", error);
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });
  app2.get("/api/my-designs", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can upload designs" });
      }
      const designs = await storage.getMarketplaceDesigns({ makerId: userId });
      res.json(designs);
    } catch (error) {
      console.error("Error fetching my designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });
  app2.post("/api/marketplace/designs", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.userType !== "maker") {
        return res.status(403).json({ message: "Only makers can upload designs" });
      }
      const validated = insertMarketplaceDesignSchema.parse(req.body);
      if (validated.priceType === "minimum") {
        const price = parseFloat(String(validated.price)) || 0;
        if (price > 0 && price < 0.5) {
          return res.status(400).json({ message: "Minimum price must be \u20AC0.00 (free) or at least \u20AC0.50" });
        }
      }
      const design = await storage.createMarketplaceDesign({ ...validated, makerId: userId });
      res.json(design);
    } catch (error) {
      console.error("Error creating design:", error);
      res.status(400).json({ message: error.message || "Failed to create design" });
    }
  });
  app2.put("/api/marketplace/designs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      if (design.makerId !== userId) {
        return res.status(403).json({ message: "You can only edit your own designs" });
      }
      const validated = insertMarketplaceDesignSchema.partial().parse(req.body);
      const priceType = validated.priceType || design.priceType;
      if (priceType === "minimum") {
        const price = parseFloat(String(validated.price ?? design.price)) || 0;
        if (price > 0 && price < 0.5) {
          return res.status(400).json({ message: "Minimum price must be \u20AC0.00 (free) or at least \u20AC0.50" });
        }
      }
      await storage.updateMarketplaceDesign(id, validated);
      const updated = await storage.getMarketplaceDesign(id);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design:", error);
      res.status(400).json({ message: error.message || "Failed to update design" });
    }
  });
  app2.delete("/api/marketplace/designs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      if (design.makerId !== userId) {
        return res.status(403).json({ message: "You can only delete your own designs" });
      }
      await storage.deleteMarketplaceDesign(id);
      res.json({ message: "Design deleted" });
    } catch (error) {
      console.error("Error deleting design:", error);
      res.status(500).json({ message: "Failed to delete design" });
    }
  });
  app2.get("/api/marketplace/designs/:id/access", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      if (design.makerId === userId) {
        return res.json({ canAccess: true, reason: "maker" });
      }
      if (design.priceType === "free") {
        return res.json({ canAccess: true, reason: "free" });
      }
      const hasPurchased = await storage.userHasPurchasedDesign(userId, id);
      res.json({ canAccess: hasPurchased, reason: hasPurchased ? "purchased" : "not_purchased" });
    } catch (error) {
      console.error("Error checking access:", error);
      res.status(500).json({ message: "Failed to check access" });
    }
  });
  app2.post("/api/marketplace/designs/:id/download", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      if (design.makerId !== userId && design.priceType !== "free") {
        const hasPurchased = await storage.userHasPurchasedDesign(userId, id);
        if (!hasPurchased) {
          return res.status(403).json({ message: "Must purchase design first" });
        }
      }
      if (!design.stlFileContent) {
        return res.status(404).json({ message: "STL file not available" });
      }
      res.json({ stlFileContent: design.stlFileContent, fileName: `${design.title}.stl` });
    } catch (error) {
      console.error("Error downloading design:", error);
      res.status(500).json({ message: "Failed to download design" });
    }
  });
  app2.post("/api/marketplace/designs/:id/purchase-free", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      if (design.priceType !== "free") {
        return res.status(400).json({ message: "This design cannot be acquired for free. Please use checkout for paid designs." });
      }
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid: "0.00",
        paymentMethod: "free",
        status: "completed"
      });
      res.json({ message: "Design acquired", purchase });
    } catch (error) {
      console.error("Error recording free purchase:", error);
      res.status(500).json({ message: error.message || "Failed to acquire design" });
    }
  });
  app2.post("/api/marketplace/designs/:id/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const { amount } = req.body;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      let finalAmount = parseFloat(amount || String(design.price));
      if (design.priceType === "fixed") {
        finalAmount = parseFloat(String(design.price));
      } else if (design.priceType === "minimum") {
        const designPrice = parseFloat(String(design.price));
        if (designPrice > 0 && finalAmount < 0.5) {
          return res.status(400).json({ message: `Amount must be at least \u20AC0.50` });
        }
        if (designPrice > 0 && finalAmount < designPrice) {
          return res.status(400).json({ message: `Amount must be at least \u20AC${designPrice}` });
        }
      }
      const amountInCents = Math.round(finalAmount * 100);
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session2 = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountInCents,
              product_data: {
                name: design.name || "Design Purchase",
                description: `Designed by ${design.makerId}`
              }
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${baseUrl}/marketplace-design/${id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/marketplace-design/${id}?payment=canceled`,
        metadata: {
          designId: id,
          buyerId: userId,
          makerId: design.makerId,
          designName: design.name,
          amount: finalAmount.toString()
        }
      });
      res.json({
        checkoutUrl: session2.url,
        sessionId: session2.id
      });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout" });
    }
  });
  app2.post("/api/marketplace/designs/:id/confirm-payment", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      console.log(`[confirm-payment] User ${userId} confirming payment for design ${id} (maker: ${design.makerId})`);
      const stripe = await getUncachableStripeClient();
      const session2 = await stripe.checkout.sessions.retrieve(sessionId);
      if (session2.payment_status !== "paid") {
        return res.status(400).json({ message: "Payment not completed" });
      }
      const existing = await storage.userHasPurchasedDesign(userId, id);
      if (existing) {
        console.log(`[confirm-payment] Design already purchased by user ${userId}`);
        return res.json({ message: "Design already purchased" });
      }
      let amountPaid = "0.00";
      if (session2.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session2.payment_intent);
        amountPaid = (paymentIntent.amount / 100).toFixed(2);
        console.log(`[confirm-payment] Payment amount: \u20AC${amountPaid}`);
      }
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid,
        paymentMethod: "stripe",
        status: "completed"
      });
      console.log(`[confirm-payment] Purchase created: ${purchase.id} for maker ${design.makerId}`);
      const earning = await storage.createMakerEarning(design.makerId, purchase.id, amountPaid);
      console.log(`[confirm-payment] \u2705 Earning created for maker ${design.makerId}: \u20AC${amountPaid} (earning id: ${earning.id})`);
      res.json({ message: "Purchase recorded", purchase, earning });
    } catch (error) {
      console.error("[confirm-payment] \u274C Error confirming payment:", error);
      res.status(500).json({ message: error.message || "Failed to confirm payment" });
    }
  });
  app2.get("/api/paypal/status", (req, res) => {
    const hasPayPal = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
    res.json({ available: hasPayPal });
  });
  app2.post("/api/marketplace/designs/:id/paypal-order", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(503).json({ message: "PayPal is not configured" });
      }
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const { amount } = req.body;
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      let finalAmount = parseFloat(amount || String(design.price));
      if (design.priceType === "fixed") {
        finalAmount = parseFloat(String(design.price));
      } else if (design.priceType === "minimum") {
        const designPrice = parseFloat(String(design.price));
        if (designPrice > 0 && finalAmount < 0.5) {
          return res.status(400).json({ message: `Amount must be at least \u20AC0.50` });
        }
        if (designPrice > 0 && finalAmount < designPrice) {
          return res.status(400).json({ message: `Amount must be at least \u20AC${designPrice}` });
        }
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const clientId = await getPayPalClientId();
      const auth = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const isProduction = process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production";
      const apiBase = isProduction ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "EUR",
              value: finalAmount.toFixed(2)
            },
            description: design.name || "Design Purchase"
          }],
          application_context: {
            return_url: `${baseUrl}/marketplace-design/${id}?payment=success&paypal=true`,
            cancel_url: `${baseUrl}/marketplace-design/${id}?payment=canceled`,
            brand_name: "VoxelHub",
            landing_page: "LOGIN",
            user_action: "PAY_NOW"
          }
        })
      });
      const order = await orderResponse.json();
      if (!order.id) {
        throw new Error("Failed to create PayPal order");
      }
      res.json({
        orderId: order.id,
        approvalUrl: order.links.find((link) => link.rel === "approve")?.href
      });
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      res.status(500).json({ message: error.message || "Failed to create PayPal order" });
    }
  });
  app2.post("/api/marketplace/designs/:id/paypal-capture", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(503).json({ message: "PayPal is not configured" });
      }
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }
      const design = await storage.getMarketplaceDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      const existing = await storage.userHasPurchasedDesign(userId, id);
      if (existing) {
        return res.json({ message: "Design already purchased" });
      }
      const clientId = await getPayPalClientId();
      const auth = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const isProduction = process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production";
      const apiBase = isProduction ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";
      const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const captureResponse = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      const capture = await captureResponse.json();
      if (capture.status !== "COMPLETED") {
        return res.status(400).json({ message: "Payment not completed" });
      }
      const amountPaid = capture.purchase_units[0].payments.captures[0].amount.value;
      const purchase = await storage.createDesignPurchase({
        designId: id,
        buyerId: userId,
        makerId: design.makerId,
        amountPaid,
        paymentMethod: "paypal",
        status: "completed"
      });
      const earning = await storage.createMakerEarning(design.makerId, purchase.id, amountPaid);
      res.json({ message: "Purchase recorded", purchase, earning });
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      res.status(500).json({ message: error.message || "Failed to capture PayPal order" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2, req) => {
    console.log("WebSocket client connected");
    ws2.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "register" && message.userId) {
          wsClients.set(message.userId, ws2);
          console.log(`User ${message.userId} registered for WebSocket notifications`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    ws2.on("close", () => {
      for (const [userId, client2] of wsClients.entries()) {
        if (client2 === ws2) {
          wsClients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });
  return httpServer;
}

// server/webhookHandlers.ts
var WebhookHandlers = class {
  static async processWebhook(payload, signature, uuid) {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. Received type: " + typeof payload + ". This usually means express.json() parsed the body before reaching this handler. FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);
  }
};

// server/app.ts
import { runMigrations } from "stripe-replit-sync";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not found, skipping Stripe initialization");
    return;
  }
  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({
      databaseUrl,
      schema: "stripe"
    });
    console.log("Stripe schema ready");
    const stripeSync2 = await getStripeSync();
    console.log("Setting up managed webhook...");
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const { webhook, uuid } = await stripeSync2.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ["*"],
        description: "Managed webhook for Stripe sync"
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);
    console.log("Syncing Stripe data...");
    stripeSync2.syncBackfill().then(() => {
      console.log("Stripe data synced");
    }).catch((err) => {
      console.error("Error syncing Stripe data:", err);
    });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
}
initStripe();
app.post(
  "/api/stripe/webhook/:uuid",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        const errorMsg = "STRIPE WEBHOOK ERROR: req.body is not a Buffer.";
        console.error(errorMsg);
        return res.status(500).json({ error: "Webhook processing error" });
      }
      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body, sig, uuid);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);
app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, _server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
