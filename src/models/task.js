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
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    taskGroupId: {
      type: Schema.Types.ObjectId,
      ref: "TaskGroup",
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "inprogress", "completed"],
        message: "Task status must be in ['todo', 'inprogress', 'completed']",
      },
      default: "todo",
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
          maxDepth: 1,
        },
      },
    ],
    approvals: [
      {
        type: Schema.Types.ObjectId,
        ref: "Approval",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

TaskSchema.plugin(autopopulate);

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
