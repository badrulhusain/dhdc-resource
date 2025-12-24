import { connectDB } from "../server/db.js";
import { User } from "../server/models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function findAdmin() {
    await connectDB();
    const admins = await User.find({ role: "admin" });
    if (admins.length > 0) {
        console.log("Admins found:");
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}`);
        });
    } else {
        console.log("No admins found.");
    }
    process.exit(0);
}

findAdmin();
