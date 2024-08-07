const { deleteFolderStorage } = require("@/handlers/firebaseUpload");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    priority: {
      type: String,
      enum: {
        values: ["none", "low", "medium", "high"],
        message: "Priority must be in ['none','low','medium','high']",
      },
      default: "none",
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
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    startDate: {
      type: Date,
      requried: false,
    },
    dueDate: {
      type: Date,
      requried: false,
    },
    finishDate: {
      type: Date,
      requried: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        maxDepth: 1,
      },
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: {
        maxDepth: 1,
      },
    },
    taskGroup: {
      type: Schema.Types.ObjectId,
      ref: "TaskGroup",
      autopopulate: {
        maxDepth: 1,
      },
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "inprogress", "completed"],
        message: "Task status must be in ['todo', 'inprogress', 'completed']",
      },
      default: "todo",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
        autopopulate: {
          maxDepth: 2,
        },
      },
    ],
    approvals: [
      {
        type: Schema.Types.ObjectId,
        ref: "Approval",
        autopopulate: {
          maxDepth: 2,
        },
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        autopopulate: {
          maxDepth: 2,
        },
      },
    ],
  },
  { timestamps: true }
);

TaskSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const TaskGroup = mongoose.model("TaskGroup");
  const Comment = mongoose.model("Comment");
  const Attachment = mongoose.model("Attachment");
  const Approval = mongoose.model("Approval");
  const Activity = mongoose.model("Activity");

  const deletedTask = await Task.findOne(this.getFilter());
  if (!deletedTask) next();

  await Promise.all([
    TaskGroup.updateOne({ _id: deletedTask.taskGroup }, { $pull: { tasks: deletedTask._id } }),
    Comment.deleteMany({ task: deletedTask._id }),
    Attachment.deleteMany({ task: deletedTask._id }),
    Approval.deleteMany({ task: deletedTask._id }),
    Activity.deleteMany({ task: deletedTask._id }),
    deleteFolderStorage(`projects/${deletedTask.project.id}/tasks/${deletedTask.id}`),
  ]);

  next();
});

TaskSchema.plugin(autopopulate);

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
