const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema, Types } = mongoose;

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
        name: {
          type: String,
          unique: true,
          required: true,
        },
        color: {
          type: String,
          required: true,
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
    members: [
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
    ],
    taskLabels: [
      {
        name: {
          type: String,
          unique: true,
          required: true,
        },
        color: {
          type: String,
          required: true,
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
  },
  { timestamps: true }
);

ProjectSchema.plugin(autopopulate);

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
