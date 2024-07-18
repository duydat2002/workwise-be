const express = require("express");
const taskGroupController = require("@/controllers/TaskGroup");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");

const router = express.Router();

router.get("/:projectId", verifyToken, handleErrors(taskGroupController.getTaskGroups));
router.post("/create", verifyToken, handleErrors(taskGroupController.createTaskGroups));
router.patch("/:taskGroupId", verifyToken, handleErrors(taskGroupController.updateTaskGroup));
router.patch("/:projectId/reorder", verifyToken, handleErrors(taskGroupController.reorderTaskGroup));
router.patch("/:taskGroupId/archive", verifyToken, handleErrors(taskGroupController.archiveTaskGroup));
router.patch("/:taskGroupId/unarchive", verifyToken, handleErrors(taskGroupController.unarchiveTaskGroup));
router.delete("/:taskGroupId", verifyToken, handleErrors(taskGroupController.deleteTaskGroup));

module.exports = router;
