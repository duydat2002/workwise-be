const userRoutes = require("@/routes/user");
const projectRoutes = require("@/routes/project");
const storageRoutes = require("@/routes/storage");

const routes = (app) => {
  app.use("/api/users", userRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/storage", storageRoutes);
};

module.exports = routes;
