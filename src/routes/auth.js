const express = require("express");
const authController = require("@/controllers/Auth");
const { verifyToken } = require("@/middlewares/auth");

const router = express.Router();

router.post("/register", authController.register);
router.get("/login", authController.login);
router.get("/test", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    result: "test",
  });
});

module.exports = router;
