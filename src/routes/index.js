const userRoutes = require("@/routes/user");
const projectRoutes = require("@/routes/project");
const taskGroupRoutes = require("@/routes/taskGroups");
const taskRoutes = require("@/routes/task");
const storageRoutes = require("@/routes/storage");

const routes = (app) => {
  app.use("/api/users", userRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/task-groups", taskGroupRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/storage", storageRoutes);
};

module.exports = routes;
