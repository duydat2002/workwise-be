const express = require("express");
const commentController = require("@/controllers/Comment");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");

const router = express.Router();

router.get("/:taskId", verifyToken, handleErrors(commentController.getComments));
router.post("/", verifyToken, handleErrors(commentController.commentTask));
router.patch("/:commentId", verifyToken, handleErrors(commentController.updateComment));
router.delete("/:commentId", verifyToken, handleErrors(commentController.deleteComment));

module.exports = router;
