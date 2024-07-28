const express = require("express");
const approvalController = require("@/controllers/Approval");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/tasks/:taskId", verifyToken, handleErrors(approvalController.getTaskApprovals));
router.post("/tasks/:taskId", verifyToken, upload.any("files"), handleErrors(approvalController.createTaskApproval));
router.patch("/:approvalId", verifyToken, upload.any("files"), handleErrors(approvalController.updateTaskApproval));
router.patch("/:approvalId/accept", verifyToken, handleErrors(approvalController.acceptTaskAproval));
router.patch("/:approvalId/reject", verifyToken, handleErrors(approvalController.rejectTaskAproval));
router.delete("/:approvalId", verifyToken, handleErrors(approvalController.deleteTaskApproval));

module.exports = router;
