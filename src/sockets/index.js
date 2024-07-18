const handleProjectSocket = require("@/sockets/project");

const socketHandle = (io) => {
  io.on("connection", (socket) => {
    console.log("connection");

    socket.on("init", (userData) => {
      socket.user = userData;
      socket.join(userData.id);
      userData.projects?.forEach((p) => {
        socket.join(p);
      });
      console.log(userData.fullname);
    });

    handleProjectSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("disconnect");
    });
  });
};

module.exports = socketHandle;
