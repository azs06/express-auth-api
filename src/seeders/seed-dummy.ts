import { db } from "../config/db";
import { roles, users } from "../schema";
import { seed } from "drizzle-seed";
import bcrypt from "bcryptjs";

async function main() {
  // Get role IDs
  const roleEntries = await db.select({ id: roles.id }).from(roles);
  const roleIds = roleEntries.map((r) => r.id);


  // Seed users
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await seed(db, { users }).refine((f) => ({
    users: {
      count: 2,
      columns: {
        id: f.int({
            minValue: 2,
            isUnique: true
        }),
        password: f.valuesFromArray({
            values: [hashedPassword],
            isUnique: false,
            arraySize: 1
        }),
        roleId: f.valuesFromArray({
            values: [...roleIds],
            isUnique: false,
            arraySize: 1
        }),
      },
    },
  }));

  console.log("Seeding completed successfully.");
  process.exit(1);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
