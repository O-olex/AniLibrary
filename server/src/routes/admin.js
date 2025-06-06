import express from "express";
import { auth } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import User from "../models/User.js";
import UserAnime from "../models/UserAnime.js";
import { sequelize } from "../config/database.js";

const router = express.Router();

// Get all users
router.get("/users", auth, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "isAdmin", "createdAt"],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Delete user
router.delete("/users/:userId", auth, adminMiddleware, async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Проверяем, не пытается ли админ удалить самого себя
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    // Если удаляемый пользователь - админ, проверяем количество оставшихся админов
    if (user.isAdmin) {
      const adminCount = await User.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last administrator",
        });
      }
    }

    // Сначала удаляем все связанные записи в user_animes
    await UserAnime.destroy({
      where: { userId: user.id },
      transaction: t,
    });

    // Затем удаляем самого пользователя
    await user.destroy({ transaction: t });

    // Если все операции успешны, подтверждаем транзакцию
    await t.commit();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    // В случае ошибки откатываем все изменения
    await t.rollback();
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Update user role
router.put("/users/:userId/role", auth, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Проверяем, не пытается ли админ изменить свою собственную роль
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot change your own admin status",
      });
    }

    // Если снимаем права администратора, проверяем количество оставшихся админов
    if (user.isAdmin && !req.body.isAdmin) {
      const adminCount = await User.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove admin rights from the last administrator",
        });
      }
    }

    await user.update({ isAdmin: req.body.isAdmin });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
});

export default router;
