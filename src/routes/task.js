const express = require("express");
const taskController = require("@/controllers/Task");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/get-by-project/:projectId", verifyToken, handleErrors(taskController.getTasksByProjectId));
router.post("/create", verifyToken, handleErrors(taskController.createTask));

router.post("/activity", verifyToken, handleErrors(taskController.testActivity));

module.exports = router;
