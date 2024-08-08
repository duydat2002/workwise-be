const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const membersSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "member"],
        message: "Member role type must be in ['admin', 'member']",
      },
      default: "member",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted"],
        message: "Member status type must be in ['pending', 'accepted']",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    background: {
      type: String,
      required: true,
    },
    labels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    members: [membersSchema],
    createdTaskLabels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    startDate: {
      type: Date,
      requried: [true, "Start date is required."],
    },
    dueDate: {
      type: Date,
      requried: [true, "Due date is required."],
    },
    finishDate: {
      type: Date,
      requried: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    taskGroups: [
      {
        type: Schema.Types.ObjectId,
        ref: "TaskGroup",
        autopopulate: {
          maxDepth: 5,
        },
      },
    ],
  },
  { timestamps: true }
);

ProjectSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const User = mongoose.model("User");
  const TaskGroup = mongoose.model("TaskGroup");
  const Task = mongoose.model("Task");
  const Activity = mongoose.model("Activity");
  const Notification = mongoose.model("Notification");

  const deletedProject = await Project.findOne(this.getFilter()).lean();
  if (!deletedProject) next();

  const userIds = deletedProject.members.map((m) => m.user);
  await Promise.all([
    User.updateMany({ _id: { $in: userIds } }, { $pull: { projects: deletedProject._id } }),
    TaskGroup.deleteMany({ projectId: deletedProject._id }),
    Task.deleteMany({ project: deletedProject._id }),
    Activity.deleteMany({ project: deletedProject._id }),
    Notification.deleteMany({ project: deletedProject._id }),
  ]);

  next();
});

ProjectSchema.plugin(autopopulate);

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
