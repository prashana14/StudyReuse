const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controller/userController');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post('/register', registerUser);
router.post(
'/login', loginUser);

module.exports = router;
