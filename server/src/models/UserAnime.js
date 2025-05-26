import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import Anime from "./Anime.js";

const UserAnime = sequelize.define(
  "UserAnime",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    animeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Anime,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("watched", "watching", "planned", "dropped"),
      allowNull: false,
      defaultValue: "planned",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    finishDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_animes",
    timestamps: true,
  }
);

// Define relationships with proper aliases
UserAnime.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

UserAnime.belongsTo(Anime, {
  foreignKey: "animeId",
  as: "anime",
});

User.hasMany(UserAnime, {
  foreignKey: "userId",
  as: "userAnimes",
});

Anime.hasMany(UserAnime, {
  foreignKey: "animeId",
  as: "userAnimes",
});

// Add hooks to update anime rating when a user rates it
UserAnime.addHook("afterSave", async (userAnime, options) => {
  try {
    // Only update rating if this is a watched anime with a rating
    if (userAnime.status === "watched" && userAnime.rating !== null) {
      const anime = await Anime.findByPk(userAnime.animeId);
      if (!anime) return;

      // Get all valid ratings for this anime
      const allRatings = await UserAnime.findAll({
        where: {
          animeId: userAnime.animeId,
          status: "watched",
          rating: { [Op.ne]: null },
        },
        attributes: ["rating"],
      });

      // Calculate new average
      const totalRatings = allRatings.length;
      const sumRatings = allRatings.reduce(
        (sum, ua) => sum + Number(ua.rating),
        0
      );
      const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      console.log("Updating anime rating:", {
        animeId: userAnime.animeId,
        totalRatings,
        sumRatings,
        averageRating,
        allRatings: allRatings.map((r) => r.rating),
      });

      // Update the anime with new rating data
      await anime.update({
        rating: Number(averageRating.toFixed(2)),
        ratingCount: totalRatings,
      });
    }
  } catch (error) {
    console.error("Error in afterSave hook:", error);
  }
});

// Add hook to update anime rating when a rating is removed
UserAnime.addHook("beforeDestroy", async (userAnime, options) => {
  try {
    // Only update rating if this was a watched anime with a rating
    if (userAnime.status === "watched" && userAnime.rating !== null) {
      const anime = await Anime.findByPk(userAnime.animeId);
      if (!anime) return;

      // Get all remaining valid ratings for this anime (excluding the one being deleted)
      const allRatings = await UserAnime.findAll({
        where: {
          animeId: userAnime.animeId,
          status: "watched",
          rating: { [Op.ne]: null },
          id: { [Op.ne]: userAnime.id },
        },
        attributes: ["rating"],
      });

      // Calculate new average
      const totalRatings = allRatings.length;
      const sumRatings = allRatings.reduce(
        (sum, ua) => sum + Number(ua.rating),
        0
      );
      const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      console.log("Updating anime rating after deletion:", {
        animeId: userAnime.animeId,
        totalRatings,
        sumRatings,
        averageRating,
        allRatings: allRatings.map((r) => r.rating),
      });

      // Update the anime with new rating data
      await anime.update({
        rating: Number(averageRating.toFixed(2)),
        ratingCount: totalRatings,
      });
    }
  } catch (error) {
    console.error("Error in beforeDestroy hook:", error);
  }
});

export default UserAnime;
