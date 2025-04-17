/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Add a `id` column as a serial primary key to the `uno_deck` table
  pgm.addColumns("uno_deck", {
    id: {
      type: "serial",
      primaryKey: true,
    },
  });

  // The `serial` data type will automatically generate unique values for the `card_id` column,
  // so you do not need to insert values manually. The existing data will be updated with unique values.
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Remove the `id` column from the `uno_deck` table
  pgm.dropColumns("uno_deck", ["id"]);
};
