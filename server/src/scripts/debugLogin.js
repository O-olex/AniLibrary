import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const debugLogin = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    const email = "admin@anilibrary.com";
    const password = "admin123";

    // Find the user
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      console.log("Debug: User not found in database");
      return;
    }

    console.log("Debug: User found in database:", {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      passwordHash: user.password.substring(0, 10) + "...", // Show part of the hash
    });

    // Test password validation
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Debug: Password validation result:", isValid);

    if (!isValid) {
      console.log("Debug: Stored password hash:", user.password);

      // Create a new hash with the same password to compare
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log("Debug: New hash for same password:", newHash);
    }

    process.exit(0);
  } catch (error) {
    console.error("Debug: Error during login check:", error);
    process.exit(1);
  }
};

debugLogin();
