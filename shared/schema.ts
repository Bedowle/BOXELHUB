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
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Enums
export const userTypeEnum = pgEnum("user_type", ["client", "maker"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "reserved", "completed"]);
export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected"]);
export const designStatusEnum = pgEnum("design_status", ["active", "archived"]);
export const designPriceTypeEnum = pgEnum("design_price_type", ["free", "fixed", "minimum"]);
export const chatContextTypeEnum = pgEnum("chat_context_type", ["project", "marketplace_design"]);
export const payoutMethodEnum = pgEnum("payout_method", ["stripe", "paypal", "bank"]);
// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
// User storage table (extended for full registration)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username"),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"), // Approximate location (both client & maker)
  // For clients: optional address fields similar to makers
  hasLocation: boolean("has_location").default(false),
  addressPostalCode: varchar("address_postal_code"),
  addressLatitude: varchar("address_latitude"),
  addressLongitude: varchar("address_longitude"),
  addressRadius: integer("address_radius"), // in km
  // Policy acceptance
  acceptedTermsAt: timestamp("accepted_terms_at"),
  acceptedPrivacyAt: timestamp("accepted_privacy_at"),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  userType: userTypeEnum("user_type"),
  authProvider: varchar("auth_provider"), // 'email', 'google', 'facebook', 'apple', 'replit'
  showFullName: boolean("show_full_name").default(false).notNull(), // Show firstName and lastName in profile
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Maker profiles table (extended with printer details + payout configuration)
export const makerProfiles = pgTable("maker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  printerType: varchar("printer_type").notNull(),
  materials: text("materials").array().notNull().default(sql`ARRAY[]::text[]`),
  maxPrintDimensionX: integer("max_print_dimension_x"),
  maxPrintDimensionY: integer("max_print_dimension_y"),
  maxPrintDimensionZ: integer("max_print_dimension_z"),
  hasMulticolor: boolean("has_multicolor").default(false).notNull(),
  maxColors: integer("max_colors"),
  location: varchar("location"), // Maker's location for delivery (city, country)
  // Address fields for maker's exact location
  addressStreetType: varchar("address_street_type"), // vía, avenida, calle, etc.
  addressStreetName: varchar("address_street_name"),
  addressNumber: varchar("address_number"),
  addressFloor: varchar("address_floor"),
  addressDoor: varchar("address_door"),
  addressPostalCode: varchar("address_postal_code"),
  addressSimplifiedMode: boolean("address_simplified_mode").default(false), // true = only postal code
  addressLatitude: varchar("address_latitude"),
  addressLongitude: varchar("address_longitude"),
  addressRadius: integer("address_radius"), // in km, 0 = exact point, 1+ = approximate area
  capabilities: text("capabilities"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0).notNull(),
  // Payout configuration
  payoutMethod: payoutMethodEnum("payout_method"), // stripe, paypal, bank
  stripeEmail: varchar("stripe_email"), // Email for Stripe payouts (legacy, for display)
  paypalEmail: varchar("paypal_email"), // Email for PayPal payouts (legacy, for display)
  bankAccountIban: varchar("bank_account_iban"), // IBAN for bank transfers
  bankAccountName: varchar("bank_account_name"), // Account holder name
  // OAuth connected accounts
  stripeConnectAccountId: varchar("stripe_connect_account_id"), // Stripe Connect account ID for payouts
  paypalAccountId: varchar("paypal_account_id"), // PayPal merchant account ID for payouts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  stlFileName: varchar("stl_file_name"), // Legacy single file support, deprecated
  stlFileContent: text("stl_file_content"), // Legacy single file support, deprecated
  stlFileNames: text("stl_file_names").array().notNull().default(sql`ARRAY[]::text[]`), // Array of up to 10 files
  stlFileContents: text("stl_file_contents").array().notNull().default(sql`ARRAY[]::text[]`), // Array of base64 contents
  description: text("description").notNull(),
  material: varchar("material").notNull(),
  specifications: jsonb("specifications"),
  status: projectStatusEnum("status").default("active").notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete - NULL means active
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_projects_user_id").on(table.userId),
  index("idx_projects_status").on(table.status),
  index("idx_projects_deleted_at").on(table.deletedAt),
]);
// Bids table
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  message: text("message"),
  status: bidStatusEnum("status").default("pending").notNull(),
  isRead: boolean("is_read").default(false).notNull(), // Track if client has seen the bid
  deliveryConfirmedAt: timestamp("delivery_confirmed_at"), // When client confirms receipt
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_bids_project_id").on(table.projectId),
  index("idx_bids_maker_id").on(table.makerId),
  index("idx_bids_status").on(table.status),
]);
// Messages table for chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  marketplaceDesignId: varchar("marketplace_design_id").references(() => marketplaceDesigns.id, { onDelete: "cascade" }),
  contextType: chatContextTypeEnum("context_type"), // 'project' or 'marketplace_design'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_sender_id").on(table.senderId),
  index("idx_messages_receiver_id").on(table.receiverId),
  index("idx_messages_project_id").on(table.projectId),
  index("idx_messages_marketplace_design_id").on(table.marketplaceDesignId),
  index("idx_messages_context_type").on(table.contextType),
]);
// Email verification tokens table
export const emailTokens = pgTable("email_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").unique().notNull(),
  type: varchar("type").notNull(), // 'verification', 'magic_link', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_tokens_email").on(table.email),
  index("idx_email_tokens_token").on(table.token),
]);
// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(), // 0.5-5 in 0.5 increments
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_project_id").on(table.projectId),
  index("idx_reviews_to_user_id").on(table.toUserId),
]);
// Marketplace designs table (maker-uploaded designs for direct purchase)
export const marketplaceDesigns = pgTable("marketplace_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url").notNull(),
  stlFileContent: text("stl_file_content"), // Store STL as base64
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceType: designPriceTypeEnum("price_type").default("fixed").notNull(), // free, fixed, minimum
  material: varchar("material").notNull(),
  status: designStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_marketplace_designs_maker_id").on(table.makerId),
  index("idx_marketplace_designs_status").on(table.status),
]);
// Design purchases/downloads table (track who bought/downloaded what and how much they paid)
export const designPurchases = pgTable("design_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  designId: varchar("design_id").notNull().references(() => marketplaceDesigns.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(), // 0.00 for free
  paymentMethod: varchar("payment_method"), // stripe, paypal, free, etc
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paypalTransactionId: varchar("paypal_transaction_id"),
  status: varchar("status").notNull().default("completed"), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_design_purchases_design_id").on(table.designId),
  index("idx_design_purchases_buyer_id").on(table.buyerId),
  index("idx_design_purchases_maker_id").on(table.makerId),
]);
// Maker earnings table (tracks earnings with retention periods)
export const makerEarnings = pgTable("maker_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  designPurchaseId: varchar("design_purchase_id").notNull().references(() => designPurchases.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Earnings from this purchase
  earningDate: timestamp("earning_date").defaultNow().notNull(), // When earning was created
  availableDate: timestamp("available_date").notNull(), // When available for payout (after retention)
  status: varchar("status").notNull().default("pending"), // pending, available, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_maker_earnings_maker_id").on(table.makerId),
  index("idx_maker_earnings_status").on(table.status),
  index("idx_maker_earnings_available_date").on(table.availableDate),
]);
// Maker payouts table (track all payout requests/completions)
export const makerPayouts = pgTable("maker_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerId: varchar("maker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payoutMethod: payoutMethodEnum("payout_method").notNull(), // stripe, paypal, bank
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  stripePayoutId: varchar("stripe_payout_id"), // Stripe payout ID if using Stripe
  paypalTransactionId: varchar("paypal_transaction_id"), // PayPal transaction ID if using PayPal
  bankTransferId: varchar("bank_transfer_id"), // Bank transfer reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"), // When payout was actually sent
}, (table) => [
  index("idx_maker_payouts_maker_id").on(table.makerId),
  index("idx_maker_payouts_status").on(table.status),
]);
// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  makerProfile: one(makerProfiles, {
    fields: [users.id],
    references: [makerProfiles.userId],
  }),
  projects: many(projects),
  bidsAsMaker: many(bids, { relationName: "makerBids" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  reviewsGiven: many(reviews, { relationName: "reviewsGiven" }),
  reviewsReceived: many(reviews, { relationName: "reviewsReceived" }),
  marketplaceDesigns: many(marketplaceDesigns),
}));
export const makerProfilesRelations = relations(makerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [makerProfiles.userId],
    references: [users.id],
  }),
}));
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  bids: many(bids),
  messages: many(messages),
  reviews: many(reviews),
}));
export const bidsRelations = relations(bids, ({ one }) => ({
  project: one(projects, {
    fields: [bids.projectId],
    references: [projects.id],
  }),
  maker: one(users, {
    fields: [bids.makerId],
    references: [users.id],
  }),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id],
  }),
  fromUser: one(users, {
    fields: [reviews.fromUserId],
    references: [users.id],
    relationName: "reviewsGiven",
  }),
  toUser: one(users, {
    fields: [reviews.toUserId],
    references: [users.id],
    relationName: "reviewsReceived",
  }),
}));
export const marketplaceDesignsRelations = relations(marketplaceDesigns, ({ one }) => ({
  maker: one(users, {
    fields: [marketplaceDesigns.makerId],
    references: [users.id],
  }),
}));
// Zod schemas for inserts
export const upsertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMakerProfileSchema = createInsertSchema(makerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalReviews: true,
  userId: true, // Added by server from authenticated user
}).extend({
  // CORRECCIÓN: Permite un array de strings (texto libre o múltiple selección)
  printerType: z.array(z.string()).optional(), 
});
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  userId: true, // Added by server from authenticated user
}).extend({
  material: z.string().min(1, "Material is required"),
  specifications: z.object({
    dimensionX: z.string().refine(val => val && !isNaN(Number(val)), "Dimensión X es requerida y debe ser un número"),
    dimensionY: z.string().refine(val => val && !isNaN(Number(val)), "Dimensión Y es requerida y debe ser un número"),
    dimensionZ: z.string().refine(val => val && !isNaN(Number(val)), "Dimensión Z es requerida y debe ser un número"),
  }).required("Las dimensiones son requeridas"),
});
export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
}).extend({
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .refine(val => parseFloat(val) >= 0.5, "Minimum price is €0.50"),
  deliveryDays: z.number().int().positive("Delivery days must be positive"),
});
export const updateBidSchema = z.object({
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .refine(val => parseFloat(val) >= 0.5, "Minimum price is €0.50")
    .optional(),
  deliveryDays: z.number().int().positive("Delivery days must be positive").optional(),
  message: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated",
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  senderId: true,
}).extend({
  content: z.string().min(1, "Message cannot be empty"),
  projectId: z.string().optional(),
  marketplaceDesignId: z.string().optional(),
  contextType: z.enum(["project", "marketplace_design"]),
}).refine(
  (data) => {
    // Must have either projectId or marketplaceDesignId
    return data.projectId || data.marketplaceDesignId;
  },
  {
    message: "Either projectId or marketplaceDesignId is required",
    path: ["projectId"],
  }
).refine(
  (data) => {
    // If contextType is project, projectId must be present
    if (data.contextType === "project") {
      return !!data.projectId;
    }
    // If contextType is marketplace_design, marketplaceDesignId must be present
    if (data.contextType === "marketplace_design") {
      return !!data.marketplaceDesignId;
    }
    return true;
  },
  {
    message: "contextType must match the provided context (project/marketplaceDesignId)",
    path: ["contextType"],
  }
);
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});
export const insertMarketplaceDesignSchema = createInsertSchema(marketplaceDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  makerId: true,
}).extend({
  priceType: z.enum(["free", "fixed", "minimum"]).default("fixed"),
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .refine(val => parseFloat(val) >= 0, "Price must be >= €0.00"),
  stlFileContent: z.string().optional(), // base64 encoded STL
});
export const insertDesignPurchaseSchema = createInsertSchema(designPurchases).omit({
  id: true,
  createdAt: true,
}).extend({
  amountPaid: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
    .refine(val => parseFloat(val) >= 0, "Amount must be >= €0.00"),
});
// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMakerProfile = z.infer<typeof insertMakerProfileSchema>;
export type MakerProfile = typeof makerProfiles.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMarketplaceDesign = z.infer<typeof insertMarketplaceDesignSchema>;
export type MarketplaceDesign = typeof marketplaceDesigns.$inferSelect;
export type InsertDesignPurchase = z.infer<typeof insertDesignPurchaseSchema>;
export type DesignPurchase = typeof designPurchases.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertMarketplaceDesign = z.infer<typeof insertMarketplaceDesignSchema>;
export type MarketplaceDesign = typeof marketplaceDesigns.$inferSelect;
