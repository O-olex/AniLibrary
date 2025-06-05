import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Anime = sequelize.define(
  "Anime",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    genre: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    releaseYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1900,
        max: new Date().getFullYear() + 1,
      },
    },
    episodes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    duration: {
      type: DataTypes.STRING, // Temporarily keep as STRING
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("duration");
        if (!rawValue) return null;

        try {
          // If it's already a number string, return as integer
          if (rawValue.match(/^\d+$/)) {
            return parseInt(rawValue);
          }

          // Handle "X hr Y min" format
          if (rawValue.includes("hr") && rawValue.includes("min")) {
            const [hours, minutes] = rawValue.match(/\d+/g).map(Number);
            return hours * 60 + minutes;
          }

          // Handle "X hr" format
          if (rawValue.includes("hr")) {
            const hours = parseInt(rawValue.match(/\d+/)[0]);
            return hours * 60;
          }

          // Handle "X min" format
          if (rawValue.includes("min")) {
            return parseInt(rawValue.match(/\d+/)[0]);
          }

          return null;
        } catch (error) {
          console.error("Error parsing duration:", error);
          return null;
        }
      },
      set(value) {
        if (typeof value === "number") {
          this.setDataValue("duration", value.toString());
        } else if (typeof value === "string") {
          this.setDataValue("duration", value);
        } else {
          this.setDataValue("duration", null);
        }
      },
    },
    status: {
      type: DataTypes.ENUM("ONGOING", "COMPLETED", "UPCOMING"),
      allowNull: false,
      defaultValue: "COMPLETED",
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 10,
      },
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "animes",
    timestamps: true,
  }
);

export default Anime;
