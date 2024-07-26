const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const AttachmentSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    approval: {
      type: String,
      ref: "Approval",
    },
    name: {
      type: String,
      required: true,
    },
    minetype: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

AttachmentSchema.plugin(autopopulate);

const Attachment = mongoose.model("Attachment", AttachmentSchema);

module.exports = Attachment;
