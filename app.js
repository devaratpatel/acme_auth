const express = require("express");
const app = express();

app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
    // console.log("this will run on the temrinal:");
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/notes", async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: Note,
    });
    res.json(user.notes);
  } catch (error) {
    next(error);
  }
});
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
