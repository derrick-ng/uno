/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Create the session table
  pgm.createTable("session", {
    sid: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    sess: {
      type: "string",
    },
    expire: {
      type: "TIMESTAMP",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Add a primary key constraint to the sid column
  pgm.addConstraint("session", "session_pkey", {
    primaryKey: "sid",
    deferrable: false,
  });

  // Create an index on the expire column
  pgm.createIndex("session", "expire", { name: "IDX_session_expire" });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Drop the index on the expire column
  pgm.dropIndex("session", "expire", { name: "IDX_session_expire" });

  // Drop the primary key constraint from the sid column
  pgm.dropConstraint("session", "session_pkey", {
    primaryKey: "sid",
    deferrable: false,
  });

  // Drop the session table
  pgm.dropTable("session");
};
