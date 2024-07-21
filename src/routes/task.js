const express = require("express");
const taskController = require("@/controllers/Task");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/get-by-project/:projectId", verifyToken, handleErrors(taskController.getTasksByProjectId));
router.get("/:taskId", verifyToken, handleErrors(taskController.getTaskById));
router.post("/create", verifyToken, handleErrors(taskController.createTask));
router.patch("/:taskId/reorder", verifyToken, handleErrors(taskController.reorderTask));
router.patch("/:taskId", verifyToken, handleErrors(taskController.updateTask));
router.patch("/:taskId/change-status", verifyToken, handleErrors(taskController.changeStatusTask));
router.patch("/:taskId/assign", verifyToken, handleErrors(taskController.assignTask));
router.patch("/:taskId/archive", verifyToken, handleErrors(taskController.archiveTask));
router.patch("/:taskId/unarchive", verifyToken, handleErrors(taskController.unarchiveTask));
router.delete("/:taskId", verifyToken, handleErrors(taskController.deleteTask));

router.post("/activity", verifyToken, handleErrors(taskController.testActivity));

module.exports = router;
