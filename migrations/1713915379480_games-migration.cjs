/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Create the games table with necessary columns
  pgm.createTable("games", {
    id: "id",
    game_socket_id: {
      type: "varchar",
      notNull: true,
    },
    creator_id: {
      type: "int",
      notNull: true,
    },
    description: {
      type: "varchar(100)",
      notNull: true,
      default: "placeholder",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Drop the games table
  pgm.dropTable("games");
};
