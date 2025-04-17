import db, { pgp } from "../connection.js";
import Sql from "../deck/index.js";

const create = async (creatorId, gameDescription) => {
  console.log({ creatorId });
  console.log({ gameDescription });
  try {
    const { id, description } = await db.one(Sql.CREATE, [
      creatorId,
      gameDescription || "placeholder",
    ]);
    console.log("checking desc", description);
    let finalDescription = description;
    if (gameDescription === undefined || gameDescription.length === 0) {
      finalDescription = (await db.one(Sql.UPDATE_DESCRIPTION, [`Game ${id}`, id])).description;
    }
    await db.none(Sql.ADD_PLAYER, [id, creatorId, 1]);
    // await initialize(id, creatorId);
    console.log("checking final desc", finalDescription);
    return { id, description: finalDescription };
  } catch (error) {
    //console.error(error);
    throw error;
  }
};

const get = async (gameId) => {
  const [game, users, cards] = await Promise.all([
    db.one(Sql.GET_GAME, [gameId]),
    db.any(Sql.GET_USERS, [gameId]),
    db.any(Sql.GET_CARDS, [gameId]),
  ]);

  const playerOneCards = cards.filter((card) => card.user_id === users[0].id);
  const userData = [
    {
      ...users[0],
      cards: playerOneCards,
      cardCount: playerOneCards.length,
    },
  ];

  if (users.length === 2) {
    const playerTwoCards = cards.filter((card) => card.user_id === users[1].id);
    userData.push({
      ...users[1],
      cards: playerTwoCards,
      cardCount: playerTwoCards.length,
    });
  }

  return {
    ...game,
    users: userData,
  };
};

const available = async (user_id, game_id_start = 0, limit = 10, offset = 0) => {
  return await db.any(Sql.GET_AVAILABLE, {
    user_id,
    game_id_start,
    limit,
    offset,
  });
};

const rejoin = async (user_id, game_id_start = 0, limit = 10, offset = 0) => {
  return await db.any(Sql.GET_REJOINABLE, {
    user_id,
    game_id_start,
    limit,
    offset,
  });
};

const running = async (user_id, game_id_start = 0, limit = 10, offset = 0) => {
  return await db.any(Sql.GET_RUNNING, {
    user_id,
    game_id_start,
    limit,
    offset,
  });
};

const join = async (gameId, userId) => {
  try {
    // First, check if the player is already in the game
    const playerExists = await db.oneOrNone(Sql.IS_PLAYER_IN_GAME, [gameId, userId]);
    if (playerExists) {
      throw new Error("Player is already in the game");
    }

    // Get the current number of players to determine the next seat number
    const currentPlayers = await db.any(Sql.GET_USERS, [gameId]);
    const seatNumber = currentPlayers.length + 1;

    // Add the player with the next seat number
    await db.none(Sql.ADD_PLAYER, [gameId, userId, seatNumber]);
  } catch (error) {
    //console.error("Error joining the game:", error);
    throw error;
  }
};

const isStarted = async (game_id) => {
  const game = await db.one(Sql.GET_GAME, [game_id]);
  return game.is_started;
};

const start = async (game_id, user_id) => {
  await db.none("UPDATE games SET is_started = true WHERE id = $1", [game_id]);
  const currentGameUsers = await db.any(Sql.GET_USERS, [game_id]);
  const usersArray = currentGameUsers.map((user) => user.id);
  const shuffledDeck = await db.any(Sql.SHUFFLED_DECK);
  const cardsPerPlayer = 7;
  for (let i = 0; i < cardsPerPlayer * usersArray.length; i++) {
    const card = shuffledDeck[i];
    const userId = usersArray[i % usersArray.length];
    await db.none(Sql.ASSIGN_CARDS, [userId, game_id, card.id, i]);
  }
  await db.none(Sql.INSERT_CURRENT_GAME, [
    "Wild",
    "black",
    true,
    user_id,
    false,
    0,
    0,
    parseInt(game_id),
  ]);
};

const getUsers = async (game_id) => {
  return await db.any(Sql.GET_USERS, [game_id]);
};

const playCard = async (game_id, user_id, card) => {
  console.log("testing play card");
  console.log({ game_id });
  const isCheck = await checkCard(game_id, user_id, card);
  return isCheck;
};

const startnewgame = async (gameId, userId) => {
  try {
    // Check if the game has already started
    const game = await db.oneOrNone("SELECT is_started FROM games WHERE id = $1", [gameId]);
    if (game && game.is_started) {
      throw new Error("Game has already started");
    }

    // Set the game as started
    await db.none("UPDATE games SET is_started = true WHERE id = $1", [gameId]);

    // Ensure the deck is initialized for the game
    await db.none(Sql.createDeck, [gameId]);
    await db.none(Sql.pickrandomcards, [gameId, -1, 1]); // Using '-1' to signify the deck's top card

    // Draw the top card for the deck and get its details
    const topCardDetails = await db.any(Sql.usergamecards, [gameId, -1]);
    const topCard = topCardDetails[0];
    console.log("checking top card....$$$$$$$$$$$$$$$$$$$", topCard);
    await db.none(Sql.INSERT_CURRENT_GAME, [
      topCard.value,
      topCard.color,
      false,
      -1,
      topCard.specialcard,
      0,
      0,
      gameId,
    ]);

    const users = await db.any(Sql.GET_USERS, [gameId]);
    // Draw 7 cards for each user and assign them
    for (const user of users) {
      await db.none(Sql.pickrandomcards, [gameId, user.id, 7]);
    }

    return gamestate(gameId);
  } catch (error) {
    //console.error("Failed to start new game:", error);
    throw error;
  }
};

const getOneCardFromDeck = async (user_id, game_id) => {
  const count = db.one(Sql.GET_CURRENTBUFFER, [game_id]);

  count = Math.max(count, 1);

  await db.none(Sql.pickrandomcards, [game_id, user_id, count]);
  return gamestate(game_id);
};

const nextUser = async (game_id, user_id) => {
  const game_users = await db.any(Sql.GET_USERS, [game_id]);

  game_users.sort((a, b) => a.seat - b.seat);

  // Finding the current user index
  const currentIndex = game_users.findIndex((user) => user.id === user_id);
  //console.log(currentIndex, "current index.......");

  // Fetch current game direction just once
  const currentGame = await db.one(Sql.GET_CURRENT_GAME, [game_id]);
  //console.log(currentGame, "currentGame.......");
  const directionForward = currentGame.current_direction;

  // Determine the next index based on game direction
  let nextIndex;
  if (directionForward) {
    nextIndex = (currentIndex + 1) % game_users.length; // Move forward in the list
  } else {
    nextIndex = (currentIndex - 1 + game_users.length) % game_users.length; // Move backward, handle wrapping
  }

  return game_users[nextIndex].id;
};

const putOneCardintoDeck = async (card) => {
  console.log("checking details coming from card....", card);
  await db.none(Sql.UPDATE_GAMECARDS_USERID, [0, card.card_id, card.game_id]);
  //console.log("updating game cards");
};

const getOneCard = async (user_id, game_id) => {
  const card = await db.one(Sql.SELECT_RANDOMCARD, [1]);
  await db.none(Sql.INSERT_GAME_CARD, [user_id, game_id, card.id]);

  return card;
};
const cardCheck = async (current_game, card) => {
  console.log(JSON.stringify(card) + " " + JSON.stringify(current_game) + " dsa");
  const nextUserId = await nextUser(card.game_id, card.user_id);

  if (current_game.current_buffer > 0 && current_game.specialcard) {
    // Check if card played is not as per the buffer requirement or if it is not a special card.
    if (card.value !== current_game.current_value || !card.specialcard) {
      // Player has to pick cards as per buffer count
      console.log("inside player picking cards....");

      for (let i = 0; i < current_game.current_buffer * current_game.buffer_count; i++) {
        await getOneCard(card.user_id, card.game_id, 1);
      }

      await db.none(Sql.UPDATE_CURRENT_GAME, [
        current_game.current_value,
        current_game.current_color,
        current_game.current_direction,
        nextUserId,
        current_game.specialcard,
        0,
        0,
        current_game.game_id,
      ]);

      // await putOneCardintoDeck(card);
    } else {
      // Correct card played according to buffer, proceed to next player

      await db.none(Sql.UPDATE_CURRENT_GAME, [
        card.value,
        card.color,
        current_game.current_direction,
        nextUserId,
        true,
        current_game.current_buffer,
        current_game.buffer_count + 1,
        card.game_id,
      ]);
      await putOneCardintoDeck(card);
    }
  } else {
    if (card.specialcard) {
      console.log("inside special card case.............");
      if (card.specialcard && card.value !== "Wild" && card.value !== "Wild Draw Four") {
        if (
          card.color !== current_game.current_color &&
          card.value !== current_game.current_value
        ) {
          const errorMessage = `Invalid card play with top card ${current_game.current_value} ${current_game.current_color}`;
          console.log(errorMessage);
          return { success: false, message: errorMessage };
        }
      }

      const nextnextUserId = await nextUser(card.game_id, nextUserId);
      switch (card.value) {
        case "Skip":
          // Update the game state as per specific special card, if it is skip go to nextnext user
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color,
            current_game.current_direction,
            nextnextUserId,
            true,
            0,
            0,
            card.game_id,
          ]);
          await putOneCardintoDeck(card);
          break;
        case "Reverse":
          // Update the game state as per specific special card, if it is reverse go to next user and toggle direction
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color,
            !current_game.current_direction, // Toggle direction for Reverse
            nextUserId,
            true,
            0,
            0,
            card.game_id,
          ]);

          const nextUserIdForReverse = await nextUser(card.game_id, nextUserId);
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color,
            current_game.current_direction,
            nextUserIdForReverse,
            true,
            0,
            0,
            card.game_id,
          ]);

          await putOneCardintoDeck(card);
          break;
        case "Draw Two":
          // Activate the draw two buffer
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color,
            current_game.current_direction,
            nextUserId,
            true,
            2, // Setting buffer to draw two cards
            1, // Start with one round of penalty
            card.game_id,
          ]);
          await putOneCardintoDeck(card);

          break;
        case "Wild":
          // Handle Wild card logic
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color, // Card color set by player's choice
            current_game.current_direction,
            nextUserId,
            true,
            0,
            0,
            card.game_id,
          ]);
          await putOneCardintoDeck(card);
          break;
        case "Wild Draw Four":
          await db.none(Sql.UPDATE_CURRENT_GAME, [
            card.value,
            card.color, // Color chosen by the player
            current_game.current_direction,
            nextUserId,
            true,
            4, // Setting buffer to draw four cards
            1, // Start with one round of penalty
            card.game_id,
          ]);
          await putOneCardintoDeck(card);
          break;
      }
    } else {
      // Normal card play handling
      if (card.color == current_game.current_color || card.value == current_game.current_value) {
        // Play is valid, proceed with the game
        const nextUserId = await nextUser(card.game_id, card.user_id);
        console.log("inside normal play***********", nextUserId);
        await db.none(Sql.UPDATE_CURRENT_GAME, [
          card.value,
          card.color,
          current_game.current_direction,
          nextUserId,
          false, // This card is not special
          0,
          0,
          card.game_id,
        ]);
        await putOneCardintoDeck(card);
        //console.log("update done..............");
      } else {
        const errorMessage = `Invalid card play with top card ${current_game.current_value} ${current_game.current_color}`;
        console.log(errorMessage);
        return { success: false, message: errorMessage };
      }
    }
  }
  return { success: true };
};

const checkCard = async (game_id, user_id, card) => {
  console.log(JSON.stringify(card) + "card check");

  //console.log({ game_id });
  const current_game = await db.one(Sql.GET_CURRENT_GAME, [game_id]);
  console.log(JSON.stringify(current_game) + "current game check");
  if (current_game.user_id == -1 || current_game.user_id == card.user_id) {
    console.log("inside card check..............");
    //console.log(current_game.current_color + " color "+card.color);
    const cardCheckResult = await cardCheck(current_game, card);
    if (!cardCheckResult.success) {
      return cardCheckResult;
    }
    console.log("done with card check******************");

    const usercardsCount = await db.one(Sql.COUNT_USERCARDS, [game_id, user_id]);
    const getgameUsers = await db.any(Sql.GET_USERS, [game_id]);
    console.log(usercardsCount, "user cards count...");
    console.log(usercardsCount.user_count + " " + getgameUsers.length);
    if (usercardsCount.user_count == 0) {
      console.log("inside count 0 condition where game ended");
      // User has no cards left, declare winner and end game
      await db.none(Sql.DELETE_USER_GAME, [user_id, game_id]);
      await db.none(Sql.UPDATE_GAME_IS_ALIVE, [game_id]);
      console.log(`User ${user_id} wins! Game ${game_id} is now ended.`);
      return {
        success: true,
        message: `User ${user_id} wins! Game ${game_id} is now ended. Redirecting to the lobby...`,
        gameEnded: true,
      };
    }
    return { success: true };
  } else {
    const errorMessage = `Not your turn. Current turn is for user ID ${current_game.user_id} with top card ${current_game.current_value} ${current_game.current_color}`;
    console.log(errorMessage);
    return { success: false, message: errorMessage };
  }
};

const getCurrentStateUser = async (game_id, user_id) => {
  // Fetch user cards for a specific game_id and user_id
  const userCards = await db.any(Sql.SELECT_USERCARDS, [game_id, user_id]);
  // Fetch users in the specified game_id
  const users = await db.any(Sql.GET_USERS, [game_id]);
  // Count user's cards in the specified game_id
  const userCardCount = await db.any(Sql.COUNT_USERCARDS, [game_id, user_id]);

  // Create a mapping of user_id to user_count
  const userCardCountMap = new Map(
    userCardCount.map((element) => [element.user_id, element.user_count]),
  );

  // Fetch current game state
  let currentGame;
  const game = await db.one("SELECT * FROM games where id=$1", [parseInt(game_id)]);
  if (game.is_started) {
    currentGame = await db.one(Sql.GET_CURRENT_GAME, [game_id]);
  } else {
    currentGame = { current_value: "Skip", current_color: "red", specialcard: "true" }; // Default if game not started
  }

  // Create an array of user states based on the fetched data
  const userStates = await Promise.all(
    users.map(async (user) => {
      const mapVal = userCardCountMap.get(user.id) || 0; // Count of cards user holds
      const userState = {
        user: user.id,
        userinfo: {
          username: user.email,
          count: mapVal,
        },
        gamecards: userCards,
        current_game: currentGame,
      };

      return userState;
    }),
  );

  return userStates;
};

const getCurrentGame = async (game_id) => {
  return await db.one(Sql.GET_CURRENT_GAME, [game_id]);
};

const updateuser = async (game_id, user_id) => {
  //console.log(user_id);
  await db.none(Sql.UPDATE_CURRENT_GAME_USER, [user_id, game_id]);
};
const exitFromGameLobby = async (user_id, game_id) => {
  //getting the player count from the game
  const player_count = await db.one(Sql.GET_GAME_USERS_COUNT, [game_id]);
  //deleting the user from the game
  await db.none(Sql.DELETE_USER_GAME, [user_id, game_id]);

  if (isStarted(game_id)) {
    await db.none(Sql.REMOVE_USER_GAMECARDS, [game_id, user_id]);
    const current_game = await getCurrentGame(game_id);
    if (current_game.user_id == user_id) {
      const nextUserId = nextUser(game_id, user_id);
      updateuser(game_id, nextUserId);
    }
  }
  //checking the player count, if it is 1 then the game should end and the game will be going to be in a dead state
  if (player_count == 1) {
    //sets the game to dead mode by updating the is_alive to false
    await db.none(Sql.UPDATE_IS_ALIVE, [game_id]);
  }
};

const gamestate = async (gameId) => {
  try {
    let usercards = [];
    // Check if the game has already started
    const game = await db.oneOrNone("SELECT is_started FROM games WHERE id = $1", [gameId]);
    // console.log("checking gamestate@@@@@@@@@@@@@@@@@@@", game);
    if (game && game.is_started == false) {
      return usercards;
    }

    const gamedesc = await db.any(Sql.GET_GAME, [gameId]);
    const gamedata = gamedesc[0];

    const userdata = await db.any(Sql.GET_USERS, [gameId]);
    // console.log(userdata);

    const users = await db.any(Sql.GET_USERS, [gameId]);

    usercards.push({ userid: 0, cards: gamedata });

    // Draw the top card for the deck and get its details
    const topCardDetails = await db.any(Sql.currentgamecard, [gameId]);
    usercards.push({ userid: -1, cards: [topCardDetails[0]] });

    // Draw 7 cards for each user and assign them
    for (const user of users) {
      const userCardDetails = await db.any(Sql.usergamecards, [gameId, user.id]);
      usercards.push({
        userid: user.id,
        userinfo: userdata.find((userin) => userin.id === user.id),
        cards: userCardDetails,
      });
    }

    // console.log("cards json", JSON.stringify(usercards));

    return usercards;
  } catch (error) {
    //console.error("Game is not started yet to display the cards", error);
    throw error;
  }
};

export default {
  create,
  startnewgame,
  get,
  available,
  join,
  rejoin,
  isStarted,
  start,
  getUsers,
  playCard,
  getCurrentStateUser,
  getCurrentGame,
  getOneCardFromDeck,
  updateuser,
  exitFromGameLobby,
  gamestate,
  getOneCard,
  running,
  nextUser,
};
