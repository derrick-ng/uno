/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Remove the username column from the users table
  pgm.dropColumn("users", "username");
};

exports.down = (pgm) => {
  // Add the username column back to the users table
  pgm.addColumn("users", {
    username: {
      type: "varchar(256)",
      notNull: true,
      unique: true,
    },
  });
};
