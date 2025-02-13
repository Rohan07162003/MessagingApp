const express = require("express");
const router = express.Router();
const validateForm= require("../controllers/validateForm.js")
const {handleLogin, attemptLogin, attemptRegister}= require("../controllers/Authcontroller.js")
const {rateLimiter} = require("../controllers/Ratelimiter.js")
const {createGroup, joinGroup} = require("../controllers/GroupChatController.js")

router.route("/login")
.get(handleLogin)
.post(validateForm, rateLimiter(60, 10),attemptLogin)
router.post("/signup",validateForm, rateLimiter(60, 10),attemptRegister)

module.exports = router;
