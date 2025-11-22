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
export const printerTypeEnum = pgEnum("printer_type", ["FDM", "SLA", "SLS"]);
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

// User storage table (mandatory for Replit Auth, extended with userType)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: userTypeEnum("user_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maker profiles table
export const makerProfiles = pgTable("maker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  printerType: printerTypeEnum("printer_type").notNull(),
  materials: text("materials").array().notNull().default(sql`ARRAY[]::text[]`),
  maxPrintDimensionX: integer("max_print_dimension_x"),
  maxPrintDimensionY: integer("max_print_dimension_y"),
  maxPrintDimensionZ: integer("max_print_dimension_z"),
  hasMulticolor: boolean("has_multicolor").default(false).notNull(),
  location: varchar("location"),
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
