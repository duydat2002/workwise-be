const express = require("express");
const projectController = require("@/controllers/Project");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/", verifyToken, handleErrors(projectController.getProjects));
router.get("/:projectId", verifyToken, handleErrors(projectController.getProjectById));
router.post("/create", verifyToken, upload.single("background"), handleErrors(projectController.createProject));
router.patch("/:projectId", verifyToken, upload.single("background"), handleErrors(projectController.updateProject));
router.patch("/:projectId/archive", verifyToken, handleErrors(projectController.archiveProject));
router.patch("/:projectId/unarchive", verifyToken, handleErrors(projectController.unarchiveProject));
router.delete("/:projectId", verifyToken, handleErrors(projectController.deleteProject));

//Project Members
router.post("/:projectId/invite-members", verifyToken, handleErrors(projectController.inviteProjectMember));
router.patch("/:projectId/change-role", verifyToken, handleErrors(projectController.changeProjectMemberRole));
router.post("/:projectId/delete-member", verifyToken, handleErrors(projectController.deleteProjectMember));

//Project activities
router.get("/:projectId/activities", verifyToken, handleErrors(projectController.getProjectActivities));

module.exports = router;
