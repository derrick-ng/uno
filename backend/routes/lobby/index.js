import express from "express";

import { Games } from "../../db/index.js";

const router = express.Router();

router.get("/", async (request, response) => {
  const { id: user_id } = request.session.user;
  try {
    const availableGames = await Games.available(user_id);
    const rejoinGames = await Games.rejoin(user_id);
    const runningGames = await Games.running(user_id);
    console.log({ runningGames });
    response.render("lobby/lobby", { availableGames, rejoinGames, runningGames });
  } catch (error) {
    console.error(error);
    response.render("lobby/lobby", { availableGames: [], rejoinGames: [], runningGames: [] });
  }
});

export default router;
