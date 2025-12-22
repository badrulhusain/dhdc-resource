import { RequestHandler } from "express";
import { User } from "../models/User.js";
import { connectDB } from "../db.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  JWTPayload,
} from "../lib/auth.js";
import studentDataRaw from "../data.json" with { type: "json" };

const studentData = studentDataRaw as unknown as StudentData;

interface Student {
  rollNo: number;
  adNo: number;
  name: string;
}

interface StudentData {
  students: {
    [key: string]: Student[];
  };
}

export const handleStudentLogin: RequestHandler = async (req, res) => {
  try {
    console.log('[StudentLogin] Request received');
    console.log('[StudentLogin] Request body:', JSON.stringify(req.body));
    console.log('[StudentLogin] Content-Type:', req.headers['content-type']);

    const { adNo, name } = req.body;
    console.log(`[StudentLogin] Parsed - adNo: "${adNo}" (type: ${typeof adNo}), name: "${name}"`);

    if (!adNo) {
      console.warn("[StudentLogin] Missing adNo - returning 400");
      res.status(400).json({
        error: "Admission number is required",
        debug: { receivedBody: req.body, adNo, name }
      });
      return;
    }

    const data = studentData;

    let foundStudent: Student | null = null;
    let studentClass = "";

    // Search for student in all classes
    for (const [className, students] of Object.entries(data.students)) {
      const student = students.find((s) => s.adNo === Number(adNo));
      if (student) {
        foundStudent = student;
        studentClass = className;
        break;
      }
    }

    if (!foundStudent) {
      console.warn(`[StudentLogin] Student not found for adNo: ${adNo}`);
      res.status(401).json({ error: "Invalid admission number" });
      return;
    }

    console.log(`[StudentLogin] Success: Found student ${foundStudent.name} in class ${studentClass}`);

    // NOTE: User specified "no problem for invalid name", so we barely validate it.
    // We could optionally check if name matches roughly, but prompt said "must valid adNo, name no problem".
    // We will use the REAL name from the database for the session.

    const payload: JWTPayload = {
      userId: `student-${foundStudent.adNo}`,
      email: `${foundStudent.adNo}@student.dhdc`, // Dummy email for type compatibility
      role: "student",
      // We might want to pass extra info, but JWTPayload interface is strict in lib/auth.ts
      // logic: we'll stick to the interface.
    };

    const token = generateToken(payload);

    res.json({
      token,
      user: {
        id: `student-${foundStudent.adNo}`,
        name: foundStudent.name, // Use the correct name from DB
        email: `${foundStudent.adNo}@student.dhdc`,
        role: "student",
        class: studentClass,
        adNo: foundStudent.adNo
      },
    });

  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role === "admin" ? "admin" : "student",
    });

    await user.save();

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);

    res
      .status(201)
      .json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const handleMe: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // If the userId is a student identifier (e.g., "student-711"), retrieve from data.json
    if (typeof user.userId === "string" && user.userId.startsWith("student-")) {
      const adNo = Number(user.userId.split("-")[1]);
      if (isNaN(adNo)) {
        res.status(400).json({ error: "Invalid student identifier" });
        return;
      }
      const data = studentData;
      let foundStudent: Student | null = null;
      let studentClass = "";
      for (const [className, students] of Object.entries(data.students)) {
        const student = students.find((s) => s.adNo === adNo);
        if (student) {
          foundStudent = student;
          studentClass = className;
          break;
        }
      }
      if (!foundStudent) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      // Return student info in the same shape as admin user
      res.json({
        user: {
          id: `student-${foundStudent.adNo}`,
          name: foundStudent.name,
          email: `${foundStudent.adNo}@student.dhdc`,
          role: "student",
          class: studentClass,
          adNo: foundStudent.adNo,
        },
      });
      return;
    }

    // Default admin/user handling using MongoDB ObjectId
    await connectDB();
    const userData = await User.findById(user.userId);
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
