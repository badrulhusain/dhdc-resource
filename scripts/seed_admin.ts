import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../server/db.js";
import { User } from "../server/models/User.js";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@dhdc.edu";
const ADMIN_PASSWORD = "DhdcAdmin@2024";
const ADMIN_NAME = "DHDC Admin";

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: "admin" });

  console.log("Admin seeded successfully.");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
