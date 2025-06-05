import { sequelize } from "../config/database.js";

const fixUserAnimeStatus = async () => {
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Create the ENUM type if it doesn't exist
    await sequelize.query(
      `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_animes_status') THEN
          CREATE TYPE enum_user_animes_status AS ENUM ('watched', 'watching', 'planned', 'dropped');
        END IF;
      END
      $$;
    `,
      { transaction }
    );

    // Step 2: Ensure all existing status values are valid
    await sequelize.query(
      `
      UPDATE user_animes 
      SET status = 'planned' 
      WHERE status NOT IN ('watched', 'watching', 'planned', 'dropped');
    `,
      { transaction }
    );

    // Step 3: Remove the default value temporarily
    await sequelize.query(
      `
      ALTER TABLE user_animes 
      ALTER COLUMN status DROP DEFAULT;
    `,
      { transaction }
    );

    // Step 4: Convert the column to use the ENUM type
    await sequelize.query(
      `
      ALTER TABLE user_animes 
      ALTER COLUMN status TYPE enum_user_animes_status 
      USING status::enum_user_animes_status;
    `,
      { transaction }
    );

    // Step 5: Set the default value back
    await sequelize.query(
      `
      ALTER TABLE user_animes 
      ALTER COLUMN status SET DEFAULT 'planned'::enum_user_animes_status;
    `,
      { transaction }
    );

    await transaction.commit();
    console.log("Successfully fixed user_animes status column");
  } catch (error) {
    await transaction.rollback();
    console.error("Error fixing user_animes status column:", error);
    throw error;
  }
};

// Run the fix
fixUserAnimeStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to fix user_animes status column:", error);
    process.exit(1);
  });
