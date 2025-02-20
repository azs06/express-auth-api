import { db } from "../config/db";
import { users, roles } from "../schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const getExistingUser = async (email) => {
  return await db
    .select()
    .from(users)
    .where(eq(users.email, "soikat@myrft.xyz"));
};

async function seedDatabase() {
  console.log("🌱 Seeding database...");
  // Insert Roles if they don't exist
  const existingRoles = await db.select().from(roles);
  if (existingRoles.length === 0) {
    await db.insert(roles).values([{ name: "Admin" }, { name: "User" }]);
    console.log("✅ Roles inserted.");
  } else {
    console.log("✅ Roles already exist, skipping.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Check if user exists before inserting
  const existingAdminUser = await getExistingUser("soikat@myrft.xyz");
  const existingUser = await getExistingUser("user@myrft.xyz");

  if (existingAdminUser.length === 0) {
    await db.insert(users).values({
      roleId: 1,
      name: "Soikat",
      email: "soikat@myrft.xyz",
      password: hashedPassword,
    });
    console.log("✅ Admin user inserted.");
  } else {
    console.log("✅ Admin user already exists, skipping.");
  }

  if (existingUser.length === 0) {
    await db.insert(users).values({
      roleId: 2,
      name: "Normar User",
      email: "user@myrft.xyz",
      password: hashedPassword,
    });
    console.log("✅ Basic user inserted.");
  } else {
    console.log("✅ Basic user already exists, skipping.");
  }

  console.log("🎉 Seeding completed!");
}

// Run the seeder
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
