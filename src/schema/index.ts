import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  uniqueIndex,
  boolean,
  text,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Roles Table
export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Users Table
export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true),
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  })
);

// Permissions Table
export const permissions = mysqlTable("permissions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  actionType: varchar("action_type", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User-Role Junction Table (Many-to-Many)
export const userRoles = mysqlTable(
  "user_roles",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow(),
    assignedBy: int("assigned_by").references(() => users.id),
  },
  (table) => ({
    userRoleIdx: uniqueIndex("user_role_idx").on(table.userId, table.roleId),
  })
);

// Role-Permission Junction Table (Many-to-Many)
export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    id: int("id").primaryKey().autoincrement(),
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: int("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at").defaultNow(),
    grantedBy: int("granted_by").references(() => users.id),
  },
  (table) => ({
    rolePermissionIdx: uniqueIndex("role_permission_idx").on(
      table.roleId,
      table.permissionId
    ),
  })
);

// Audit Log Table
export const permissionAuditLog = mysqlTable(
  "permission_audit_log",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").references(() => users.id),
    actionType: varchar("action_type", { length: 20 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: int("entity_id").notNull(),
    oldValues: json("old_values"),
    newValues: json("new_values"),
    actionTimestamp: timestamp("action_timestamp").defaultNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    timestampIdx: index("timestamp_idx").on(table.actionTimestamp),
  })
);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userTokenIdx: uniqueIndex("user_token_idx").on(table.userId, table.token),
  })
);

// Types for better type safety
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
