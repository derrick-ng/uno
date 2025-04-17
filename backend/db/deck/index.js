// Object containing all SQL queries
const Sql = {
  getDefaultDeck: `SELECT * from uno_deck ud where ud.game_id=$1 and ud.user_id=$2`,
  SELECT_USERCARDS: `SELECT 
                      ud.value, 
                      ud.color, 
                      ud.specialcard, 
                      ud.id, 
                      gc.game_id, 
                      gc.user_id
                    FROM 
                      uno_deck ud
                    JOIN 
                      game_cards gc 
                    ON 
                      ud.id = gc.card_id
                    WHERE 
                      gc.game_id = $1 AND gc.user_id = $2
                    ORDER BY 
                      gc.card_order;`,
  SELECT_RANDOMCARD: `SELECT 
                      ud.value, 
                      ud.color, 
                      ud.specialcard, 
                      ud.id, 
                      ud.gameid, 
                      ud.userid
                    FROM 
                      uno_deck ud
                    
                    ORDER BY 
                      RANDOM()
                    LIMIT $1;`,
  GET_USERS: `SELECT users.id, users.email, users.gravatar, game_users.seat
              FROM users, game_users, games
              WHERE games.id=$1 AND game_users.game_id=games.id AND game_users.user_id=users.id
              ORDER BY game_users.seat;`,
  COUNT_USERCARDS: `SELECT u.user_id, COALESCE(gc.user_count, 0) AS user_count
FROM (SELECT $2 AS user_id) u
LEFT JOIN (
    SELECT gc.user_id, COUNT(gc.user_id) AS user_count
    FROM game_cards gc
    WHERE gc.game_id = $1
    GROUP BY gc.user_id
) gc ON gc.user_id = u.user_id
ORDER BY u.user_id;`,
  GET_CURRENT_GAME: `SELECT * FROM current_game WHERE game_id = $1;`,
  CREATE: "INSERT INTO games (creator_id, description) VALUES ($1, $2) RETURNING id, description",
  UPDATE_DESCRIPTION: "UPDATE games SET description=$1 WHERE id=$2 RETURNING description",
  ADD_PLAYER: "INSERT INTO game_users (game_id, user_id, seat) VALUES ($1, $2, $3)",
  IS_PLAYER_IN_GAME:
    "SELECT * FROM game_users WHERE game_users.game_id=$1 AND game_users.user_id=$2",
  GET_GAME: "SELECT * FROM games WHERE id=$1",
  GET_AVAILABLE: `SELECT games.*, users.email, users.gravatar
FROM games
INNER JOIN (
    SELECT game_users.game_id
    FROM game_users
    GROUP BY game_users.game_id
    HAVING COUNT(game_users.user_id) < 2
) AS temp ON games.id = temp.game_id
LEFT JOIN users ON users.id = games.creator_id
WHERE games.id > $[game_id_start]
  AND users.id != $[user_id]
  AND games.is_started = false
  AND games.is_alive = true
  AND games.id NOT IN (
    SELECT game_id FROM game_users WHERE user_id = $[user_id]
  )
ORDER BY games.created_at DESC
LIMIT $[limit]
OFFSET $[offset];`,
  GET_REJOINABLE: `SELECT games.*, users.email, users.gravatar
FROM games
INNER JOIN users ON users.id = games.creator_id
WHERE games.id > $[game_id_start]
  AND games.is_started = false
  AND games.is_alive = true
  AND games.id IN (
      SELECT DISTINCT game_id
      FROM game_users
      WHERE user_id = $[user_id]
  )
ORDER BY games.created_at DESC
LIMIT $[limit]
OFFSET $[offset];`,
  GET_RUNNING: `SELECT games.*, users.email, users.gravatar
FROM games
INNER JOIN game_users ON game_users.game_id = games.id
INNER JOIN users ON users.id = games.creator_id
WHERE games.is_started = true
  AND games.is_alive = true
  AND game_users.user_id = $[user_id]
ORDER BY games.created_at DESC
LIMIT $[limit]
OFFSET $[offset];`,
  SHUFFLED_DECK: "SELECT *, random() AS rand FROM uno_deck ORDER BY rand",
  ASSIGN_CARDS: "UPDATE game_cards SET user_id=$1 WHERE game_id=$2 AND user_id=-1",
  GET_CARDS: `SELECT gc.user_id, gc.game_id, gc.card_id, gc.card_order, ud.value, ud.color, ud.specialcard
               FROM game_cards AS gc
               JOIN uno_deck AS ud ON gc.card_id = ud.id
               WHERE gc.game_id = $1
               ORDER BY gc.card_order`,
  INSERT_CURRENT_GAME: `INSERT INTO current_game (current_value, current_color, current_direction, user_id, specialcard, current_buffer, buffer_count, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  UPDATE_GAMECARDS_USERID: `UPDATE game_cards
SET user_id = $1
WHERE card_id = $2
  AND game_id = $3;`,
  INSERT_GAME_CARD: `INSERT INTO game_cards (user_id, game_id, card_id) VALUES ($1, $2, $3);`,

  UPDATE_CURRENT_GAME: `UPDATE current_game SET current_value=$1, current_color=$2, current_direction=$3, user_id=$4, specialcard = $5, current_buffer=$6, buffer_count=$7 WHERE game_id=$8`,
  SELECT_GAME_USER: `SELECT * FROM game_users WHERE game_id = $1 AND user_id=$2`,
  UPDATE_CURRENT_USER_DIRECTION: `UPDATE current_game SET user_id=$1, current_direction=$2 WHERE game_id=$3`,
  DELETE_USER_GAME: `DELETE FROM game_users where user_id=$1 AND game_id=$2`,
  UPDATE_CURRENT_GAME_USER: `UPDATE current_game SET user_id =$1 WHERE game_id = $2`,
  GET_GAME_USERS_COUNT: `SELECT COUNT(*) FROM game_users WHERE game_id=$1`,
  REMOVE_USER_GAMECARDS: `UPDATE game_cards
SET user_id = 0
WHERE game_id = $1 AND user_id = $2;`,
  UPDATE_IS_ALIVE: `UPDATE games SET is_alive=false where $id = $1`,

  pickrandomcards: `
WITH random_cards AS (
  SELECT card_id FROM game_cards gc
  JOIN uno_deck ud ON gc.card_id = ud.id
  WHERE gc.game_id = $1 AND gc.user_id = 0 AND ud.specialcard = false
  ORDER BY RANDOM()
  LIMIT $3
)
UPDATE game_cards SET user_id = $2
WHERE game_id = $1 AND user_id = 0 AND card_id IN (SELECT card_id FROM random_cards);`,
  // getGameUsers : `select user_id from game_users where game_id=$1`,
  createDeck: `INSERT INTO game_cards (game_id, card_id, user_id)
SELECT $1, id, 0 FROM uno_deck;`,

  GET_CURRENTBUFFER: `SELECT current_buffer from current_game where game_id=$1`,

  usergamecards: `SELECT gc.game_id, gc.user_id, gc.card_id, ud.value, ud.color, ud.specialcard
FROM game_cards gc
JOIN uno_deck ud ON gc.card_id = ud.id
WHERE gc.game_id = $1 AND gc.user_id = $2;`,
  currentgamecard: `SELECT cg.game_id,cg.user_id,cg.current_value as value, cg.current_color as color,cg.specialcard FROM current_game cg WHERE game_id =$1`,
  UPDATE_GAME_IS_ALIVE: `UPDATE games SET is_alive = false WHERE id = $1;`,
};

export default Sql;

/*


















*/
