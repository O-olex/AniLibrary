import { sequelize } from "../config/database.js";
import User from "../models/User.js";

const checkAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    const adminUser = await User.findOne({
      where: {
        email: "admin@anilibrary.com",
      },
    });

    if (adminUser) {
      console.log("Admin user found:", {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      });
    } else {
      console.log("No admin user found with email admin@anilibrary.com");
    }

    // Check all users in the database
    console.log("\nAll users in database:");
    const allUsers = await User.findAll();
    allUsers.forEach((user) => {
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    });

    process.exit(0);
  } catch (error) {
    console.error("Error checking admin:", error);
    process.exit(1);
  }
};

checkAdmin();
