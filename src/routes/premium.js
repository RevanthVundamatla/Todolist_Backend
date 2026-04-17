const express = require('express');
const auth = require('../middleware/auth');
const premiumController = require('../controllers/premiumController');
const router = express.Router();

router.use(auth);
router.post('/order', premiumController.createOrder);
router.post('/verify', premiumController.verifyPayment);

module.exports = router;