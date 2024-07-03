const userRoutes = require("@/routes/user");
const projectRoutes = require("@/routes/project");

const routes = (app) => {
  app.use("/api/users", userRoutes);
  app.use("/api/projects", projectRoutes);
};

module.exports = routes;
