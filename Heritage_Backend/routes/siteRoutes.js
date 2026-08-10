// routes/siteRoutes.js
// Route mapping for public site querying and profiling endpoints

const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

router.get('/', siteController.getAllSites);
router.get('/:id', siteController.getSiteById);

module.exports = router;
