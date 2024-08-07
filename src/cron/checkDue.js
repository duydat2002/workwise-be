const Project = require("@/models/project");
const Task = require("@/models/task");
const Notification = require("@/models/notification");
const { addDays, startOfDay, endOfDay } = require("date-fns");

const checkDueProjects = async () => {
  const oneDayFromNow = addDays(new Date(), 1);
  const projects = await Project.find({
    dueDate: {
      $gte: startOfDay(oneDayFromNow),
      $lt: endOfDay(oneDayFromNow),
    },
    isArchived: false,
    finishDate: { $exists: false },
  });

  projects.forEach(async (p) => {
    const members = p.members.map((m) => m.user.id);

    const notification = await new Notification({
      receivers: members,
      project: p.id,
      action: "project_due",
      datas: {},
    }).save();
    global.io.to(members).emit("notification:new-notification", notification);
  });
};

const checkDueTasks = async () => {
  console.log("checkDueTasks");
  const oneDayFromNow = addDays(new Date(), 1);
  const tasks = await Task.find({
    dueDate: {
      $gte: startOfDay(oneDayFromNow),
      $lt: endOfDay(oneDayFromNow),
    },
    isArchived: false,
    status: { $ne: "completed" },
  });

  tasks.forEach(async (t) => {
    if (t.project.isArchived || t.project.finishDate) return;

    const members = t.project.members;
    const admin = members.find((m) => m.role == "admin").user.toString();

    let receivers = [admin];
    if (t.assignee) receivers.push(t.assignee.id);

    const notification = await new Notification({
      receivers: receivers,
      project: t.project.id,
      action: "task_due",
      datas: {
        task: t,
      },
    }).save();
    global.io.to(receivers).emit("notification:new-notification", notification);
  });
};

module.exports = { checkDueProjects, checkDueTasks };
