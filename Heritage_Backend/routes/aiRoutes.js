// routes/aiRoutes.js
// Route mapping for AI recommending and natural language search endpoints

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/recommend', aiController.recommend);
router.post('/search', aiController.search);
router.post('/identify', aiController.identify);
router.post('/site-info', aiController.getSiteInfo);

module.exports = router;
