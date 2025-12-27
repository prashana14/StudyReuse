const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken } = require('../controller/userController'); // ✅ ADD refreshToken

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); // ✅ ADD THIS LINE

module.exports = router;