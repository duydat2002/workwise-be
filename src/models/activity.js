const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const { ACTIVITY_TYPE } = require("@/constant");

const { Schema, Types } = mongoose;

const ActivitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: {
        select: "_id name",
        maxDepth: 1,
      },
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      autopopulate: {
        select: "_id name",
        maxDepth: 1,
      },
    },
    datas: {
      type: Map,
      of: Object,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPE,
      required: true,
    },
  },
  { timestamps: true }
);

ActivitySchema.plugin(autopopulate);

const Activity = mongoose.model("Activity", ActivitySchema);

module.exports = Activity;
