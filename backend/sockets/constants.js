// constants.js

// export const GAME_CREATED = (game_id, user_id) => `game${game_id}:${user_id}created`;
// export const GAME_REMOVED = "game:removed";
export const GAME_JOINED = (game_id, user_id) => `game${game_id}:${user_id}joined`;
export const GAME_ENDED = (game_id) => `game${game_id}:ended`;

// Function to generate the event name for GAME_UPDATED
export const GAME_UPDATED = (game_id, user_id) => `game${game_id}:${user_id}updated`;

export const CHAT_MESSAGE = (game_id) => `chat${game_id}:message`;
export const GAME_CREATED = "game:created";
export const GAME_REMOVED = "game:removed";

/*


game :[{
    userid:-1,
    gamecards:[{}],
    only passing the deck top card(the one which is open to all), game_direction, next_player,
},{
    userid: 1,
    gamecards:[{},{}]
},{
    userid: 2,
    gamecards:[{},{}]
}]

GAME_UPDATED(game_id,user_id) => game
const total=game.length - 1
systemdeck = game[0]

playersdeck = game[1:]

DeckCardImages template 

OpponentsImages template:

playersdeck.foreach(player=>{
    if(player.userid == user_id){
        player.gamecards.foreach(card=>{
            const childnode=<img src=`card${card.card_id}`></img>
            DeckCardImages.add(childnode)
        })
    }else{
        update span count(which indicates number  of cards with the playerr)
    }
})


*/
