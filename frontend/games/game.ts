import axios from "axios";
import { Socket } from "socket.io-client";

import { GAME_ENDED, GAME_JOINED, GAME_UPDATED } from "../../backend/sockets/constants";

export default function handleGameUpdates(socket: Socket): void {
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("hellowdfklasdj");
    const location = window.location.pathname;
    const gameIdStr = location.substring(location.lastIndexOf("/") + 1);
    const game_id = gameIdStr === "" || isNaN(parseInt(gameIdStr)) ? 0 : parseInt(gameIdStr);

    console.log(game_id);
    console.log(location.substring(location.lastIndexOf("/") + 1));

    var user_id;

    async function fetchUserId() {
      try {
        const response = await fetch("/auth/userid", {
          method: "GET",
        });
        const data = await response.json();
        const userId = data.id;
        console.log(userId, "fsakldjflkasdjfkl asjkldfjaskldjflk");
        user_id = userId;
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
      return null;
    }

    async function handlegameData(user_id, flag, Data) {
      var gameData;
      console.log("in handlegameData", flag);
      if (flag) {
        try {
          const response = await axios.get(`/games/${game_id}/getgamedata`);
          console.log("*********************inside if case of getgamedata", response);
          const gameDataobject = response.data;
          console.log("*********************", JSON.stringify(gameDataobject));
          if (gameDataobject.length == 0) {
            return null;
          }
          // gameData = gameDataobject.reduce((acc, current) => {
          //   acc[current.userid] = current;
          //   return acc;
          // }, {});

          gameData = gameDataobject;

          console.log(gameData, " this is in fetch data");
        } catch (error) {
          console.error("Game not started", error);
          return null;
        }
      } else {
        gameData = Data;
        console.log(gameData);
      }

      console.log(JSON.stringify(gameData), "game data object after ifelse...");
      const currentPlayerTurn = document.querySelector<HTMLSpanElement>("#current-player-turn");
      const startButton = document.querySelector<HTMLButtonElement>("#start-button");
      const drawButton = document.querySelector<HTMLButtonElement>("#draw-button");
      const topCardImageContainer = document.querySelector<HTMLDivElement>("#topcardimg");
      const chosenColorDisplay = document.querySelector<HTMLDivElement>("#chosen-color-display");
      const cardTemplate = document.querySelector<HTMLTemplateElement>("#card-template");
      // Get the player template and players container
      const playerTableTemplate = document.querySelector<HTMLTemplateElement>("#players-template");
      const playersTableContainer = document.querySelector("#players");
      const tableHeader = document.getElementById("table-header");
      // Clear the existing players
      playersTableContainer!.innerHTML = "";
      const otherplayersContainer = document.querySelector<HTMLDivElement>("#otherplayers-cards");

      const currentplayerContainer = document.querySelector<HTMLDivElement>("#currentplayer-cards");

      console.log("Draw Button: %%%%%%%%%%%%%%%%% ", drawButton);
      console.log("checking game data........", JSON.stringify(gameData));
      if (Object.keys(gameData).length === 0) {
        console.log("empty game data return");
        return;
      }

      if (gameData["0"] && gameData["0"].cards && gameData["0"].cards.is_started) {
        if (startButton) startButton.style.display = "none"; // Hide the start button
        if (drawButton) drawButton.style.display = "block";
      } else {
        if (startButton) startButton.style.display = "block"; // Show the start button
        if (drawButton) drawButton.style.display = "none";
      }

      const { "-1": topcardData, ...playercardData } = gameData;
      const topcard = topcardData.cards[0];

      // currentplayerContainer!.appendChild(currentPlayerTurn)

      const topCardImg = document.createElement("img");
      topCardImg.src = `/images/favicons/${topcard.color}_${topcard.value}_${topcard.specialcard}.png`;
      topCardImg.classList.add("w-16", "h-24");
      console.log(topCardImg.src, " src ");
      topCardImageContainer!.innerHTML = `Current Color : ${topcard.color} `;
      // topCardImageContainer!.style.color = topcard.color || "black";
      topCardImageContainer!.appendChild(topCardImg);
      console.log({ chosenColorDisplay });
      var currentUser;

      // chosenColorDisplay!.innerHTML = `Chosen Color: <span class="font-bold">${topcard.color}</span>`;

      for (var key in playercardData) {
        if (key !== "-1" && playercardData[key].userinfo && playercardData[key].userinfo.email) {
          // Check if userinfo exists and has email
          // Create a player entry based on the template
          const playerEntry = playerTableTemplate!.content.cloneNode(true) as DocumentFragment;
          // Access elements and cast them to HTMLElement to update their properties
          const usernameElement = playerEntry.querySelector(".username") as HTMLElement;
          const countElement = playerEntry.querySelector(".count") as HTMLElement;
          if (usernameElement) {
            const userId = gameData[key].userinfo.id;
            const username = gameData[key].userinfo.email.substring(
              0,
              gameData[key].userinfo.email.indexOf("@"),
            );
            if (topcard.user_id == userId) {
              currentUser = username;
            }

            usernameElement.textContent =
              user_id == userId
                ? `${username} (User ID: ${userId})  (You)`
                : `${username} (User ID: ${userId})`;
            usernameElement.classList.add("font-medium", "text-gray-900");
          }
          if (countElement)
            countElement.textContent = gameData[key].count.toString() + " cards holding";
          countElement.classList.add("text-sm", "text-gray-600", "font-semibold", "px-4", "py-2");

          // Append the player entry to the players container
          playersTableContainer!.appendChild(document.importNode(playerEntry, true));
          // Append the player entry to the players container
          // playersTableContainer!.appendChild(playerEntry);
        }
        if (key == user_id) {
          currentplayerContainer!.innerHTML = "";
          playercardData[key].cards.forEach((card) => {
            const currentcard = document.createElement("img");
            currentcard.src = `/images/favicons/${card.color}_${card.value}_${card.specialcard}.png`;
            currentcard.classList.add("w-16", "h-24");
            var chosenColor = card.color;

            currentcard.addEventListener("click", async function () {
              if (card.value === "Wild" || card.value === "Wild Draw Four") {
                // Prompt the user to select a color for the wild card
                chosenColor = prompt("Please choose a color: red, yellow, green, or blue");
                if (!["red", "yellow", "green", "blue"].includes(chosenColor?.toLowerCase())) {
                  alert("You must choose a color: red, yellow, green, or blue");
                  return; // Exit the function if the chosen color is invalid
                } else {
                  card.color = chosenColor.toLowerCase();
                }
              }
              try {
                const response = await axios.post(
                  `/games/play/${card.game_id}`,
                  JSON.stringify(card), // Manually stringify the card object
                  {
                    headers: { "Content-Type": "application/json" },
                  },
                );
                console.log("chekcing response&&&&&&&&&&&&", response);
                if (!response.data.success) {
                  alert(response.data.message); // Display the error message
                } else if (response.data.message) {
                  alert(response.data.message);
                }
              } catch (error) {
                console.log("logging error...........", error);
                if (error.response && error.response.data && error.response.data.message) {
                  alert(error.response.data.message); // Display the error message from the server
                } else {
                  alert("An error occurred while playing the card. Please try again."); // Display a generic error message
                }
              }
            });
            currentplayerContainer!.appendChild(currentcard);
          });
        }
      }
      console.log({ currentUser });

      let displayText = topcard.user_id === -1 ? "" : `Current Player Turn: ${currentUser}`;
      currentPlayerTurn!.textContent = displayText;

      console.log({ currentPlayerTurn });

      return null;
    }

    await fetchUserId();
    if (user_id == undefined) {
      return null;
    }
    // async function loadGameData(){}

    socket.on(GAME_JOINED(game_id, user_id), (data) => {
      console.log("game joined", data);
      const divele = document.getElementsByClassName("usercontainer1")[0];
      divele.innerHTML = "";
      data.users.forEach((user) => {
        const divcontainer = document.createElement("div");
        divcontainer.classList.add("flex", "flex-col", "items-center", "px-10");
        const pelement = document.createElement("p");
        const imgElement = document.createElement("img");
        imgElement.src = `https://gravatar.com/avatar/${user.gravatar}`;
        imgElement.classList.add("h-10", "w-10", "rounded-full");
        imgElement.alt = "User Avatar";
        pelement.innerText = user.email.substring(0, user.email.indexOf("@"));
        pelement.classList.add("font-bold", "text-gray-800");
        divcontainer.appendChild(imgElement);
        divcontainer.appendChild(pelement);
        divele.appendChild(divcontainer);
      });
    });

    socket.on(GAME_ENDED(game_id), (message) => {
      alert(message);
      window.location.href = "/lobby";
    });

    await handlegameData(user_id, true, {});

    const event_name = GAME_UPDATED(game_id, user_id); //game1:10updated

    console.log("event name", event_name);
    socket.on(event_name, async (game) => {
      await handlegameData(user_id, false, game);
      const isstartele = document.getElementsByClassName("isstartedelement")[0];
      isstartele.textContent = "";
    });

    console.log("Listening for GAME_UPDATED event with name:", event_name);
  });
}
