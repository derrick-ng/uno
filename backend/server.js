import cookieParser from "cookie-parser";
import "dotenv/config.js";
import express from "express";
import { createServer } from "http";
import createError from "http-errors";
import morgan from "morgan";
import * as path from "path";

import * as configure from "./config/index.js";
import * as middleware from "./middleware/index.js";
import * as routes from "./routes/index.js";
import * as sockets from "./sockets/index.js";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 3000;

// Note that this path omits "backend" - server is running in the backend directory
// so BACKEND_PATH is PROJECT_ROOT/backend

/*---------------------------- WINDOWS START -------------------------------------------------*/
//const moduleURL = new URL(import.meta.url);
//const __filename = fileURLToPath(moduleURL);
//const __dirname = path.dirname(__filename);
//const BACKEND_PATH = __dirname;
/*---------------------------- WINDOWS END -------------------------------------------------*/

/*---------------------------- DEFAULT CODE START -----------------------------------------------*/
const BACKEND_PATH = import.meta.dirname;
/*---------------------------- DEFAULT CODE END -------------------------------------------------*/

const STATIC_PATH = path.join(BACKEND_PATH, "static");
const VIEW_PATH = path.join(BACKEND_PATH, "routes");

const app = express();
const server = createServer(app);
const io = sockets.initialize(server);
// Make the io object accessible to the routes
app.set("io", io);
app.use(middleware.menuItemsDefault);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const sessionMiddleware = configure.session();
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
configure.liveReload(app, STATIC_PATH);
configure.views(app, VIEW_PATH, STATIC_PATH);

app.use("/", routes.home);
app.use("/test", routes.test);
app.use("/auth", routes.auth);

app.use(middleware.isAuthenticated);
app.use(middleware.menuItemsAuthenticated);
app.use("/lobby", routes.lobby);
app.use("/chat", routes.chat);
app.use("/games", routes.games);
app.use("/api", routes.api);

server.listen(PORT, () => {
  console.log(
    `Server started on port ${PORT}, in the ${process.env.NODE_ENV ?? "production"} environment`,
  );
});

app.use((_request, _response, next) => {
  return next(createError(404));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500);
  response.send({
    error: {
      message: error.message,
    },
  });
});

