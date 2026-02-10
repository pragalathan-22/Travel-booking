const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10),
      role: "admin",
      phone: process.env.ADMIN_PHONE || ""
    };

    const admin = await User.create(adminData);
    console.log("Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password:", process.env.ADMIN_PASSWORD || "admin123");
    console.log("\n⚠️  Please change the default password after first login!");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err.message);
    process.exit(1);
  }
};

seedAdmin();
