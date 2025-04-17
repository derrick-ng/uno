/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Add the is_started and is_alive columns to the games table
  pgm.addColumn("games", {
    is_started: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    is_alive: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
};

exports.down = (pgm) => {
  // Remove the is_started and is_alive columns from the games table
  pgm.dropColumn("games", "is_started");
  pgm.dropColumn("games", "is_alive");
};
