import { db } from "../config/db";
import { users, roles } from "../schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { seed } from "drizzle-seed";

const getExistingUser = async (email) => {
  return await db
    .select()
    .from(users)
    .where(eq(users.email, email));
};

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Insert Roles if they don't exist
  async function seedRoles() {
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([{ name: "Admin" }, { name: "User" }]);
      console.log("✅ Roles inserted.");
    } else {
      console.log("✅ Roles already exist, skipping.");
    }
  }

  // Insert admin user
  async function seedAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const existingAdminUser = await getExistingUser("soikat@myrft.xyz");
    if (existingAdminUser.length === 0) {
      const newUser = {
        roleId: 1,
        name: "Soikat",
        email: "soikat@myrft.xyz",
        password: hashedPassword,
      };
      await db.insert(users).values(newUser);
      console.log("✅ Admin user inserted.");
    } else {
      console.log("✅ Admin user already exists, skipping.");
    }
  }

  async function seedUser() {
    // Seed users
    const userHashedPassword = await bcrypt.hash("user123", 10);
    await seed(db, { users }).refine((f) => ({
      users: {
        count: 10,
        columns: {
          password: f.valuesFromArray({
            values: [userHashedPassword],
            isUnique: false,
            arraySize: 1,
          }),
          roleId: f.valuesFromArray({
            values: [2],
            isUnique: false,
            arraySize: 1,
          }),
        },
      },
    }));
  }

  await seedRoles();
  await seedAdmin();
  await seedUser();

  console.log("🎉 Seeding completed!");
}

// Run the seeder
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
