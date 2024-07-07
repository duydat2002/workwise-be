require("module-alias/register");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const { createServer } = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const port = 3000;

const server = createServer(app);

app.use(
  cors({
    origin: ["http://192.168.1.2:4173", "http://localhost:5173"],
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

routes(app);

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log(`Connected to mongodb`);
    server.listen(process.env.PORT, () => {
      console.log(`Instagram running onn PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));

mongoose.set("toJSON", { virtuals: true });
