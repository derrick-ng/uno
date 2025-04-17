/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Remove the 'game_socket_id' column from the 'games' table
  pgm.dropColumn("games", "game_socket_id");
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Add the 'game_socket_id' column back to the 'games' table if needed
  pgm.addColumn("games", {
    game_socket_id: {
      type: "varchar",
      notNull: true,
    },
  });
};
