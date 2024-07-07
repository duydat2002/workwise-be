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
    ownerType: {
      type: String,
      enum: {
        values: ["task", "approval"],
        message: "Owner type must be in ['task', 'approval']",
      },
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "ownerType",
      autopopulate: {
        maxDepth: 1,
      },
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
