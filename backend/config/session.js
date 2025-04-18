import connectPgSimple from "connect-pg-simple";
import session from "express-session";

let sessionMiddleware = undefined;

export default function getSession() {
  if (sessionMiddleware === undefined) {
    return session({
      store: new (connectPgSimple(session))({ createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
      secure: process.env.NODE_ENV === "production",
    });
  }

  return sessionMiddleware;
}
