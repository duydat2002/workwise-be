const express = require("express");
const storageController = require("@/controllers/Storage");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/background-templates", handleErrors(storageController.getBackgroundTemplates));

module.exports = router;
