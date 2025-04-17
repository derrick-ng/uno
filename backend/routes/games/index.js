import express from "express";

import db, { pgp } from "../../db/connection.js";
import Sql from "../../db/deck/index.js";
import { Games } from "../../db/index.js";
import {
  GAME_CREATED,
  GAME_ENDED,
  GAME_JOINED,
  GAME_REMOVED,
  GAME_UPDATED,
} from "../../sockets/constants.js";

const router = express.Router();

router.post("/create", async (request, response) => {
  const { id: creatorId, gravatar: creatorGravatar, email: creatorEmail } = request.session.user;
  const { description } = request.body;

  try {
    const io = request.app.get("io");
    const { id, description: finalDescription } = await Games.create(creatorId, description);

    io.emit(GAME_CREATED, {
      gameId: id,
      description: finalDescription,
      creatorGravatar,
      creatorEmail,
    });

    response.redirect(`/games/${id}`);
  } catch (error) {
    response.redirect("/lobby");
  }
});

router.get("/:id/getgamedata", async (request, response) => {
  const gameid = Number(request.params.id);
  var userid = 0;
  if (request.session) {
    userid = request.session.user.id;
  }
  console.log(gameid);
  const io = request.app.get("io");
  const gameData = await Games.gamestate(gameid);

  // const userdata = gameData.filter(
  //   (user) => user.userid === userid || user.userid === 0 || user.userid === -1,
  // );
  console.log(userid, " in the getgamedata", JSON.stringify(gameData));
  var responseObj = {};
  await gamestateemit(io, gameid, gameData);
  let cardsObject = {};
  // Construct the cardsObject for all users, including the top card
  gameData.forEach((user) => {
    if (user.userid === -1) {
      // Handling the top card under the key "-1"
      cardsObject["-1"] = {
        count: user.cards ? user.cards.length : 0,
        cards: user.cards,
      };
    } else {
      cardsObject[user.userid] = {
        count: user.cards ? user.cards.length : 0,
        cards: user.cards,
        userinfo: user.userinfo || {},
      };
    }
  });
  gameData.forEach((user) => {
    if (user.userid == userid) {
      // Exclude direct emission for the top card entry itself
      let individualCardsObject = JSON.parse(JSON.stringify(cardsObject)); // Deep clone to avoid reference issues

      // Show only the count of cards for other users but keep full data for user ID 0
      Object.keys(individualCardsObject).forEach((key) => {
        if (key !== "-1" && key !== user.userid.toString()) {
          if (key === "0") {
            // Special handling for user ID 0, keep the cards data
            individualCardsObject[key] = {
              ...individualCardsObject[key],
              cards: individualCardsObject[key].cards,
            };
          } else {
            // For all other users, only include count and userinfo
            individualCardsObject[key] = {
              count: individualCardsObject[key].count,
              userinfo: individualCardsObject[key].userinfo,
            };
          }
        }
      });

      // console.log(GAME_UPDATED(gameid, user.userid));
      console.log("&&&&&&&&&&&&&&&&&&&&", JSON.stringify(individualCardsObject));
      // io.emit(GAME_UPDATED(game_id, user.userid), individualCardsObject);
      responseObj = individualCardsObject;
    }
  });
  response.status(200).send(responseObj);
});

router.get("/:id", async (request, response) => {
  const { id } = request.params;
  const io = request.app.get("io");
  const gameData = await Games.get(id);
  //await gamestateemit(io, id, await Games.gamestate(id));

  io.emit(GAME_JOINED(id), gameData);
  const users = await Games.getUsers(id);
  users.forEach((user) => {
    io.emit(GAME_JOINED(id, user.id), gameData);
  });
  response.render("games/games", gameData);
});

// Inside router.post("/join/:id", ...)
router.post("/join/:id", async (request, response) => {
  const { id: gameId } = request.params;
  const { id: userId } = request.session.user;

  try {
    const io = request.app.get("io");
    await Games.join(gameId, userId);
    io.emit(GAME_REMOVED, { gameId });

    // // Get userGameData
    // const userGameData = await Games.getCurrentStateUser(gameId, userId);
    // console.log("logging userGameDara", userGameData);
    // console.log("Emitting GAME_UPDATED event with name:", GAME_UPDATED);

    // // Emit GAME_UPDATED event with gameId, userId, and userGameData
    // io.emit(GAME_UPDATED(gameId, userId), userGameData);

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.log(error);
    response.redirect("/lobby");
  }
});

router.get("/:id/start", async (request, response) => {
  const { id: game_id } = request.params;
  const { id: user_id } = request.session.user;
  const io = request.app.get("io");
  const gamestartedObjet = await Games.startnewgame(game_id, user_id);
  await gamestateemit(io, game_id, gamestartedObjet);

  response.send().status(200);
});

router.post("/play/:id", async (request, response) => {
  const { id: user_id } = request.session.user;
  const io = request.app.get("io");
  const { id: game_id } = request.params;
  const card = request.body;
  const users = await Games.getUsers(game_id);
  console.log(JSON.stringify(card));

  try {
    const result = await Games.playCard(parseInt(game_id), user_id, card);
    if (!result.success) {
      return response.status(400).send(result);
    }
    const game_state = await Games.gamestate(game_id);
    await gamestateemit(io, game_id, game_state);
    if (result.gameEnded) {
      // Emit an event to notify both users that the game has ended
      io.emit(GAME_ENDED(game_id), result.message);
    }
    response.status(200).send(result);
  } catch (error) {
    console.log({ error });
    console.error(error.message);
    response.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

router.post("/:id/draw", async (request, response) => {
  const { id: user_id } = request.session.user;
  const io = request.app.get("io");
  const { id: game_id } = request.params;

  try {
    const current_game = await Games.getCurrentGame(game_id);
    console.log("inside the draw");
    console.log("current game........", JSON.stringify(current_game));
    console.log("current user", user_id);
    console.log("inside if condition....");

    console.log(current_game.user_id, user_id);

    if (current_game.user_id !== user_id) {
      console.log("inside current user not matching..............");
      response
        .status(400)
        .send({ success: false, message: "Not your turn, cannot draw a card now!" });
      return;
    }

    const drawCard = await Games.getOneCard(user_id, game_id);
    console.log("drawCard", JSON.stringify(drawCard));

    console.log("done with card draw....");
    const isPlayable =
      drawCard.color === current_game.current_color ||
      drawCard.value === current_game.current_value ||
      drawCard.value === "Wild Draw Four" ||
      drawCard.value === "Wild";

    if (!isPlayable) {
      console.log("inside not playable.........");
      console.log("checking user_id", user_id);
      console.log("checking game_id", game_id);
      const nextUserId = await Games.nextUser(game_id, user_id);
      console.log("updating nextUser with this..", nextUserId);
      await db.none(Sql.UPDATE_CURRENT_GAME, [
        current_game.current_value,
        current_game.current_color,
        current_game.current_direction,
        nextUserId,
        current_game.specialcard,
        current_game.current_buffer,
        current_game.buffer_count,
        current_game.game_id,
      ]);
    }

    const game_state = await Games.gamestate(game_id);
    await gamestateemit(io, game_id, game_state);

    console.log("hello");
    response.status(200).send();
  } catch (error) {
    console.error("An error occurred:", error);
    response.status(500).send("An error occurred");
  }
});

// router.get("/exit/:id", async (request, response) => {
//   const { id: user_id } = request.session.user;
//   const { id: game_id } = request.params;
//   const io = request.app.get("io");

//   Games.exitFromGameLobby(user_id, game_id);
//   const gamestateobject = Games.gamestate(game_id);
//   gamestateemit(io, game_id, gamestateobject);

//   response.redirect("/lobby");
// });

router.get("/getcards/:id", async (request, response) => {
  const { id: user_id } = request.session.user;
  const { id: game_id } = request.params;
  const io = request.app.get("io");
  const gamestateobject = Games.getOneCardFromDeck(user_id, game_id);
  gamestateemit(io, game_id, gamestateobject);
  response.status(200);
});

const gamestateemit = async (io, game_id, gamestateobject) => {
  let cardsObject = {};
  // Construct the cardsObject for all users, including the top card
  gamestateobject.forEach((user) => {
    if (user.userid === -1) {
      // Handling the top card under the key "-1"
      cardsObject["-1"] = {
        count: user.cards ? user.cards.length : 0,
        cards: user.cards,
      };
    } else {
      cardsObject[user.userid] = {
        count: user.cards ? user.cards.length : 0,
        cards: user.cards,
        userinfo: user.userinfo || {},
      };
    }
  });

  console.log("Emitting game update");

  // Emitting the complete game data to all users
  gamestateobject.forEach((user) => {
    if (user.userid !== -1) {
      // Exclude direct emission for the top card entry itself
      let individualCardsObject = JSON.parse(JSON.stringify(cardsObject)); // Deep clone to avoid reference issues

      // Show only the count of cards for other users but keep full data for user ID 0
      Object.keys(individualCardsObject).forEach((key) => {
        if (key !== "-1" && key !== user.userid.toString()) {
          if (key === "0") {
            // Special handling for user ID 0, keep the cards data
            individualCardsObject[key] = {
              ...individualCardsObject[key],
              cards: individualCardsObject[key].cards,
            };
          } else {
            // For all other users, only include count and userinfo
            individualCardsObject[key] = {
              count: individualCardsObject[key].count,
              userinfo: individualCardsObject[key].userinfo,
            };
          }
        }
      });

      console.log(GAME_UPDATED(game_id, user.userid));
      console.log("&&&&&&&&&&&&&&&&&&&&", JSON.stringify(individualCardsObject));
      io.emit(GAME_UPDATED(game_id, user.userid), individualCardsObject);
    }
  });
  return null;
};

export default router;
