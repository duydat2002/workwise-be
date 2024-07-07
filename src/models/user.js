const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema, Types } = mongoose;

const UserSchema = new Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    createdProjectLabels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  { timestamps: true }
);

UserSchema.plugin(autopopulate);

const User = mongoose.model("User", UserSchema);

module.exports = User;
