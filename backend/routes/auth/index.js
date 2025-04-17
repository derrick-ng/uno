import express from "express";

import { Users } from "../../db/index.js";
import { checkPassword, encryptPassword } from "./password-handling.js";

const router = express.Router();

router.get("/register", (_request, response) => {
  response.render("auth/register", { error: null });
});

router.post("/register", async (request, response) => {
  const { password, email } = request.body;
  console.log({ email });
  if (password.length < 8) {
    return response.render("auth/register", {
      error: "Password must be at least 8 characters long.",
    });
  }
  if (await Users.exists(email)) {
    return response.render("auth/register", {
      error: "Email already exists. Please log in.",
    });
  } else {
    const encryptedPassword = await encryptPassword(password);
    request.session.user = await Users.create(email, encryptedPassword);
    response.redirect("/lobby");
  }
});

router.get("/login", (_request, response) => {
  response.render("auth/login", { error: null });
});

router.post("/login", async (request, response) => {
  const { password, email } = request.body;
  try {
    if (await checkPassword(email, password)) {
      const user = await Users.find(email);
      request.session.user = {
        id: user.id,
        email: user.email,
        gravatar: user.gravatar,
      };
      response.redirect("/lobby");
    } else {
      response.render("auth/login", { error: "Incorrect email or password." });
    }
  } catch (error) {
    response.render("auth/login", { error: "An error occurred. Please try again." });
  }
});

router.get("/logout", (request, response, next) => {
  request.session.user = null;
  request.session.save((error) => {
    if (error) {
      next(error);
    }
    request.session.regenerate((error) => {
      if (error) {
        next(error);
      }
      response.redirect("/");
    });
  });
});

router.get("/userid", (request, response) => {
  var id;
  try {
    if (request.session && request.session.user) {
      id = request.session.user.id;
    } else {
      return response.status(401).send({ error: "Not authenticated" });
    }
  } catch (error) {
    console.log(error);
    return response.status(401).send({ error: "Not authenticated" });
  }

  response.json({ id });
});

export default router;
