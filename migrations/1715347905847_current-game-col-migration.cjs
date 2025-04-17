/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Directly alter the column to rename and change type
  pgm.renameColumn("current_game", "current_number", "current_value_temp");
  pgm.alterColumn("current_game", "current_value_temp", {
    type: "varchar(256)",
    notNull: true,
  });
  pgm.renameColumn("current_game", "current_value_temp", "current_value");
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Revert the changes: rename current_value to current_number and change type back to int
  pgm.renameColumn("current_game", "current_value", "current_number_temp");
  pgm.alterColumn("current_game", "current_number_temp", {
    type: "int",
    notNull: true,
  });
  pgm.renameColumn("current_game", "current_number_temp", "current_number");
};
