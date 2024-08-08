require("module-alias/register");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const { createServer } = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const socketHandle = require("./sockets");
const initCron = require("./cron");

dotenv.config();

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://admin.socket.io",
      "http://localhost:5555",
      "http://localhost:5173",
      "https://workwise-datn.vercel.app",
    ],
  },
});

app.use(
  cors({
    origin: ["http://192.168.1.2:4173", "http://localhost:5173", "https://workwise-datn.vercel.app"],
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Workwise app listening on port ${port}`);
});

socketHandle(io);
global.io = io;

routes(app);

initCron();

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log(`Connected to mongodb`);
    server.listen(process.env.PORT, () => {
      console.log(`Workwise running onn PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));

mongoose.set("toJSON", { virtuals: true });
