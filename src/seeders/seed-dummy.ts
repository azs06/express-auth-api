import { db } from "../config/db";
import { roles, users  } from "../schema";
import { seed } from "drizzle-seed";
import bcrypt from "bcryptjs";

async function main() {
  // Seed users
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await seed(db, { users })

  console.log("Seeding completed successfully.");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
