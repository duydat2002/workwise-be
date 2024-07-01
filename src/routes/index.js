const authRoutes = require("@/routes/auth");
const userRoutes = require("@/routes/user");
const projectRoutes = require("@/routes/project");

const routes = (app) => {
  // app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/projects", projectRoutes);
};

module.exports = routes;
