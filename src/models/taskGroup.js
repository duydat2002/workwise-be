const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const TaskGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "archived"],
        message: "Task group status must be in ['active', 'archived']",
      },
      default: "active",
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

TaskGroupSchema.plugin(autopopulate);

const TaskGroup = mongoose.model("TaskGroup", TaskGroupSchema);

module.exports = TaskGroup;
