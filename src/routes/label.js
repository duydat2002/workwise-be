const express = require("express");
const projectController = require("@/controllers/Project");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");

const router = express.Router();

// router.post("/create", verifyToken, upload.single("background"), handleErrors(projectController.createProject));

module.exports = router;
