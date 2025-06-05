import { sequelize } from "../config/database.js";

const fixDatabase = async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log("Starting database fixes...");

    // 1. First, check if we need to fix the duration column
    const [durationResults] = await sequelize.query(
      `
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animes' 
      AND column_name = 'duration';
    `,
      { transaction }
    );

    if (
      durationResults.length > 0 &&
      durationResults[0].data_type !== "integer"
    ) {
      console.log("Converting duration column to integer...");

      // Create a new temporary column
      await sequelize.query(
        `
        ALTER TABLE animes 
        ADD COLUMN duration_new integer;
      `,
        { transaction }
      );

      // Convert and copy the data
      await sequelize.query(
        `
        UPDATE animes 
        SET duration_new = CASE
          WHEN duration ~ '^[0-9]+$' THEN duration::integer
          WHEN duration LIKE '%hr%' AND duration LIKE '%min%' THEN 
            (REGEXP_MATCHES(duration, '([0-9]+)\\s*hr'))[1]::integer * 60 + 
            (REGEXP_MATCHES(duration, '([0-9]+)\\s*min'))[1]::integer
          WHEN duration LIKE '%hr%' THEN 
            (REGEXP_MATCHES(duration, '([0-9]+)\\s*hr'))[1]::integer * 60
          WHEN duration LIKE '%min%' THEN 
            (REGEXP_MATCHES(duration, '([0-9]+)\\s*min'))[1]::integer
          ELSE NULL
        END;
      `,
        { transaction }
      );

      // Drop the old column and rename the new one
      await sequelize.query(
        `
        ALTER TABLE animes 
        DROP COLUMN duration,
        ALTER COLUMN duration_new SET DEFAULT NULL,
        ALTER COLUMN duration_new DROP NOT NULL,
        RENAME COLUMN duration_new TO duration;
      `,
        { transaction }
      );

      console.log("Successfully converted duration column to integer");
    } else {
      console.log("Duration column is already in correct format");
    }

    // 2. Fix the status column
    console.log("Checking status column...");

    // First check if the ENUM type exists
    const [enumResults] = await sequelize.query(
      `
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_animes_status'
      GROUP BY t.typname;
    `,
      { transaction }
    );

    if (enumResults.length === 0) {
      // Create the ENUM type if it doesn't exist
      await sequelize.query(
        `
        CREATE TYPE enum_animes_status AS ENUM ('ONGOING', 'COMPLETED', 'UPCOMING');
      `,
        { transaction }
      );
      console.log("Created enum_animes_status type");
    }

    // Update any invalid status values to 'COMPLETED'
    await sequelize.query(
      `
      UPDATE animes 
      SET status = 'COMPLETED' 
      WHERE status NOT IN ('ONGOING', 'COMPLETED', 'UPCOMING')
      OR status IS NULL;
    `,
      { transaction }
    );

    // Alter the column to use the ENUM type
    await sequelize.query(
      `
      ALTER TABLE animes 
      ALTER COLUMN status TYPE enum_animes_status 
      USING status::enum_animes_status,
      ALTER COLUMN status SET DEFAULT 'COMPLETED',
      ALTER COLUMN status SET NOT NULL;
    `,
      { transaction }
    );

    console.log("Successfully fixed status column");

    // Commit the transaction
    await transaction.commit();
    console.log("Database fixes completed successfully!");
  } catch (error) {
    // Rollback in case of error
    await transaction.rollback();
    console.error("Database fixes failed:", error);
    throw error;
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the fixes
console.log("Starting database fix script...");
fixDatabase()
  .then(() => {
    console.log("Database fix script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database fix script failed:", error);
    process.exit(1);
  });
