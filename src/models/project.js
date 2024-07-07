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
        message: "User role type must be in ['admin', 'member']",
      },
      default: "member",
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
    status: {
      type: String,
      enum: {
        values: ["active", "archived"],
        message: "Project status must be in ['active', 'archived']",
      },
      default: "active",
    },
    startDate: {
      type: Date,
      requried: [true, "Start date is required."],
    },
    dueDate: {
      type: Date,
      requried: [true, "Due date is required."],
    },
    taskGroups: [
      {
        type: Schema.Types.ObjectId,
        ref: "TaskGroup",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: "Activity",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

ProjectSchema.plugin(autopopulate);

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
