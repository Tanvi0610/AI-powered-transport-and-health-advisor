const {
  signupValidation,
  loginValidation,
} = require("../Middlewares/Validation");
const { signup, login } = require("../Controllers/AuthController");
const router = require("express").Router();

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);

module.exports = router;
