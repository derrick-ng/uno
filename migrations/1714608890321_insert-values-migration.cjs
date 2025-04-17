/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Prepare the initial values of the UNO deck
  const values = [];

  // Define the colors and special cards
  const colors = ["red", "yellow", "green", "blue"];
  const special_cards = ["Skip", "Reverse", "Draw Two"];

  // Insert numbered cards and special cards for each color
  for (const color of colors) {
    // Numbered cards (0-9) for each color
    for (let value = 0; value <= 9; value++) {
      // Determine the number of copies: 2 for all cards except 0 (1 copy)
      const copies = value === 0 ? 1 : 2;
      for (let i = 0; i < copies; i++) {
        values.push(`('${value}', '${color}', 0, 0, false)`);
      }
    }
    // Special cards (Skip, Reverse, Draw Two) for each color
    for (const special_card of special_cards) {
      for (let i = 0; i < 2; i++) {
        values.push(`('${special_card}', '${color}', 0, 0, true)`);
      }
    }
  }

  // Wild cards
  for (let i = 0; i < 4; i++) {
    values.push(`('Wild', 'black', 0, 0, true)`);
    values.push(`('Wild Draw Four', 'black', 0, 0, true)`);
  }

  // Build and execute the INSERT query
  const sql = `INSERT INTO uno_deck (value, color, gameid, userid, specialcard) VALUES ${values.join(",")};`;
  pgm.sql(sql);
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // If you want to reverse the insertion, you can use a TRUNCATE
  // command to remove all rows from the uno_deck table
  pgm.truncate("uno_deck");
};
