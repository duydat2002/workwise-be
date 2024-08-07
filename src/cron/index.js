const cron = require("node-cron");
const { checkDueProjects, checkDueTasks } = require("./checkDue");

const initCron = () => {
  cron.schedule("0 8 * * *", checkDueProjects);
  cron.schedule("0 8 * * *", checkDueTasks);
};

module.exports = initCron;
