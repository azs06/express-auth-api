import { db } from "../config/db.ts";
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "../schema/index.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { seed } from "drizzle-seed";

const getExistingUser = async (email: string) => {
  return await db.select().from(users).where(eq(users.email, email));
};

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Insert Roles if they don't exist
  async function seedRoles() {
    const existingRoles = await db.select().from(roles);
    const seedRoles = [
      {
        name: "Admin",
        id: 1,
        description: "System administrator with full access",
      },
      { name: "User", id: 2, description: "Regular user with limited access" },
      {
        name: "Manager",
        id: 3,
        description: "Department manager with elevated access",
      },
    ];
    if (existingRoles.length === 0) {
      await db.insert(roles).values(seedRoles);
      console.log("✅ Roles inserted.");
    } else {
      console.log("✅ Roles already exist, skipping.");
    }
  }

  // Insert permissions
  async function seedPermissions() {
    const existingPermissions = await db.select().from(permissions);
    if (existingPermissions.length === 0) {
      const permissionsValues = [
        {
          id: 1,
          name: "view_users",
          description: "View user profiles",
          resourceType: "user",
          actionType: "read",
        },
        {
          id: 2,
          name: "edit_users",
          description: "Edit user profiles",
          resourceType: "user",
          actionType: "update",
        },
        {
          id: 3,
          name: "delete_users",
          description: "Delete users",
          resourceType: "user",
          actionType: "delete",
        },
        {
          id: 4,
          name: "create_roles",
          description: "Create new roles",
          resourceType: "role",
          actionType: "create",
        },
        {
          id: 5,
          name: "assign_roles",
          description: "Assign roles to users",
          resourceType: "user_role",
          actionType: "create",
        },
        {
          id: 6,
          name: "view_dashboard",
          description: "View dashboard",
          resourceType: "dashboard",
          actionType: "read",
        },
      ];
      await db.insert(permissions).values(permissionsValues);
      console.log("✅ Permissions inserted.");
    } else {
      console.log("✅ Permissions already exist, skipping.");
    }
  }

  // Assign permissions to roles
  async function seedRolePermissions() {
    const existingRolePermissions = await db.select().from(rolePermissions);
    if (existingRolePermissions.length === 0) {
      // Admin gets all permissions
      const adminPermissions = [1, 2, 3, 4, 5, 6].map((permissionId) => ({
        roleId: 1,
        permissionId,
      }));

      // Manager gets view, edit users and view dashboard
      const managerPermissions = [1, 2, 6].map((permissionId) => ({
        roleId: 3,
        permissionId,
      }));

      // Regular user just gets view dashboard
      const userPermissions = [{ roleId: 2, permissionId: 6 }];

      await db
        .insert(rolePermissions)
        .values([
          ...adminPermissions,
          ...managerPermissions,
          ...userPermissions,
        ]);
      console.log("✅ Role permissions assigned.");
    } else {
      console.log("✅ Role permissions already exist, skipping.");
    }
  }

  // Insert admin user
  async function seedAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const existingAdminUser = await getExistingUser("soikat@example.com");
    if (existingAdminUser.length === 0) {
      // Insert the admin user
      const insertResult = await db
        .insert(users)
        .values({
          name: "Soikat",
          username: "soikat_admin",
          email: "soikat@example.com",
          password: hashedPassword,
          isActive: true,
        })
        .returning({ insertedId: users.id });

      const adminId = insertResult[0].insertedId;

      // Assign the Admin role to the user
      await db.insert(userRoles).values({
        userId: adminId,
        roleId: 1,
      });

      console.log("✅ Admin user inserted and assigned to Admin role.");
    } else {
      console.log("✅ Admin user already exists, skipping.");

      // Check if admin has role assigned
      const adminId = existingAdminUser[0].id;
      const adminRoleAssignment = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, adminId));

      if (adminRoleAssignment.length === 0) {
        // Assign the Admin role if missing
        await db.insert(userRoles).values({
          userId: adminId,
          roleId: 1,
        });
        console.log("✅ Admin role assigned to existing admin user.");
      }
    }
  }

  async function seedUsers() {
    // Seed regular users
    const userHashedPassword = await bcrypt.hash("user123", 10);

    // Using drizzle-seed to create 10 users
    await seed(db, { users }).refine((f) => ({
      users: {
        count: 10,
        columns: {
          password: f.valuesFromArray({
            values: [userHashedPassword],
            isUnique: false,
            arraySize: 1,
          }),
          username: f.firstName({
            isUnique: true,
          }),
          isActive: f.valuesFromArray({
            values: [true],
            isUnique: false,
            arraySize: 1,
          }),
        },
      },
    }));

    console.log("✅ Regular users inserted.");

    // Assign the User role to all users without role assignments
    const allUsers = await db.select().from(users);
    const existingUserRoles = await db.select().from(userRoles);

    // Find users without role assignments
    const usersWithoutRoles = allUsers.filter(
      (user) => !existingUserRoles.some((ur) => ur.userId === user.id)
    );

    if (usersWithoutRoles.length > 0) {
      const roleAssignments = usersWithoutRoles.map((user) => ({
        userId: user.id,
        roleId: 2, // Regular user role
      }));

      await db.insert(userRoles).values(roleAssignments);
      console.log(`✅ Assigned User role to ${roleAssignments.length} users.`);
    }
  }

  // Run all seeder functions
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedAdmin();
  await seedUsers();

  console.log("🎉 Seeding completed!");
}

// Run the seeder
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
