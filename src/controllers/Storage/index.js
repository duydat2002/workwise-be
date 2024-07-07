const Project = require("@/models/project");
const User = require("@/models/user");
const { singleUpload, multipleUpload, getFileUrls } = require("@/handlers/firebaseUpload");

const storageController = {
  getBackgroundTemplates: async (req, res) => {
    const backgroundTemplates = await getFileUrls("backgroundTemplates");

    return res.status(200).json({
      success: true,
      result: { backgroundTemplates },
      message: "Successfully get background templates.",
    });
  },
};

module.exports = storageController;
