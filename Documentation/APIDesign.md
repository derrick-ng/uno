| Actions           | Inputs/Data    | Pre Condition(s)                 | Post Condition(s)                                                    | API Endpoint         |
| :---------------- | :------------- | :------------------------------- | :------------------------------------------------------------------- | :------------------- |
| Create a game     | 1. user_id     | 1. user_id is in session         | 1. A new game is created (game_id)                                   | POST /create         |
|                   | 2. description | 2. Valid game description        | 2. User is set as the game creator                                   |                      |
|                   |                |                                  | 3. Redirect to game page                                             |                      |
| Get game data     | 1. game_id     | 1. game_id exists                | 1. Game data is retrieved and emitted                                | GET /:id/getgamedata |
|                   |                | 2. user_id is in session         |                                                                      |                      |
| Join a game       | 1. game_id     | 1. user_id is in session         | 1. User is added to the game                                         | POST /join/:id       |
|                   | 2. user_id     | 2. game_id exists                | 2. Emit game join event                                              |                      |
|                   |                |                                  | 3. Redirect to game page                                             |                      |
| Start a game      | 1. game_id     | 1. game_id exists                | 1. New game is started                                               | GET /:id/start       |
|                   | 2. user_id     | 2. user_id is in session         | 2. Game state is updated and emitted                                 |                      |
|                   |                | 3. Game is not already started   |                                                                      |                      |
| Play a card       | 1. user_id     | 1. user_id in game_users         | 1. Game state is updated                                             | POST /play/:id       |
|                   | 2. game_id     | 2. it is user_id's turn          | 2. Next player's turn                                                |                      |
|                   | 3. card        | 3. user_id has the card in hand  | 3. Emit game state                                                   |                      |
|                   |                | 4. user_id playing card is legal | 4. If game ends, emit game end event                                 |                      |
| Draw a card       | 1. user_id     | 1. user_id in game_users         | 1. Card is drawn                                                     | POST /:id/draw       |
|                   | 2. game_id     | 2. it is user_id's turn          | 2. Update game state                                                 |                      |
|                   |                |                                  | 3. Emit game state                                                   |                      |
| Register          | 1. email       | 1. email must not exist in Users | 1. User is added to Users                                            | POST /register       |
|                   | 2. password    | 2. Valid email and password      | 2. User is logged in and redirected to lobby                         |                      |
| Login             | 1. email       | 1. email must exist in Users     | 1. User is logged in and redirected to lobby                         | POST /login          |
|                   | 2. password    | 2. Correct password              |                                                                      |                      |
| Logout            | No input data  | 1. user_id is in session         | 1. User is logged out                                                | GET /logout          |
|                   |                |                                  | 2. Session is cleared                                                |                      |
| Get User ID       | No input data  | 1. user_id is in session         | 1. User ID is returned if authenticated                              | GET /userid          |
| Send chat message | 1. roomId      | 1. user is in session            | 1. Message is emitted to the room                                    | POST /:id            |
|                   | 2. message     | 2. Valid room ID and message     |                                                                      |                      |
|                   | 3. email       |                                  |                                                                      |                      |
|                   | 4. gravatar    |                                  |                                                                      |                      |
| Get room ID       | 1. referer     | 1. Valid referer header          | 1. roomId is returned based on referer                               | POST /room-id        |
| Render home page  | No input data  | No pre conditions                | Home page is rendered                                                | GET /                |
| Render lobby page | No input data  | 1. user_id is in session         | Lobby page is rendered with available, rejoinable, and running games | GET /                |
| Test API          | No input data  | No pre conditions                | Response contains entries from test_table                            | GET /                |
