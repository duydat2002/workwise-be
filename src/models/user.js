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
    },
    avatar: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    projectLabels: [
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
