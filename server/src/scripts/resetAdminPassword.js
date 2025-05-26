import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const resetAdminPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    const adminUser = await User.findOne({
      where: {
        email: "admin@anilibrary.com",
      },
    });

    if (!adminUser) {
      console.log("Admin user not found");
      process.exit(1);
    }

    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Update password directly in database
    await sequelize.query("UPDATE users SET password = ? WHERE email = ?", {
      replacements: [hashedPassword, "admin@anilibrary.com"],
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log("Admin password has been reset to: admin123");
    console.log("You can now log in with:");
    console.log("Email: admin@anilibrary.com");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin password:", error);
    process.exit(1);
  }
};

resetAdminPassword();
