/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Add the gravatar column to the users table
  pgm.addColumn("users", {
    gravatar: {
      type: "char(64)",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  // Remove the gravatar column from the users table
  pgm.dropColumn("users", "gravatar");
};
