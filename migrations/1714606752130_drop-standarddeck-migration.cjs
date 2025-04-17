/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
const TABLE_NAME = "standard_deck_cards";
exports.up = (pgm) => {
  // Drop the `standard_deck_cards` table
  pgm.dropTable(TABLE_NAME);
};
