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
export const printerTypeEnum = pgEnum("printer_type", ["Ender3", "BambooLab"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "reserved", "completed"]);
export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected"]);

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maker profiles table (extended with printer details)
export const makerProfiles = pgTable("maker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  printerType: printerTypeEnum("printer_type").notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  stlFileName: varchar("stl_file_name").notNull(),
  description: text("description").notNull(),
  material: varchar("material").notNull(),
  specifications: jsonb("specifications"),
  status: projectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_projects_user_id").on(table.userId),
  index("idx_projects_status").on(table.status),
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
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_sender_id").on(table.senderId),
  index("idx_messages_receiver_id").on(table.receiverId),
  index("idx_messages_project_id").on(table.projectId),
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
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  userId: true, // Added by server from authenticated user
}).extend({
  material: z.string().min(1, "Material is required"),
  specifications: z.record(z.any()).optional(),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
}).extend({
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  deliveryDays: z.number().int().positive("Delivery days must be positive"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  content: z.string().min(1, "Message cannot be empty"),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
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

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
