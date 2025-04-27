const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all items
router.get('/', itemController.getAllItems);

// Search items (must come before /:itemId routes)
router.get('/search', itemController.searchItems);

// Create new item
router.post('/', itemController.createItem);

// Transfer routes
router.post('/:itemId/transfer-to-cold', (req, res, next) => {
  console.log('Transfer to cold route hit:', req.params.itemId);
  itemController.transferToCold(req, res, next);
});

router.post('/:itemId/transfer-to-shop', (req, res, next) => {
  console.log('Transfer to shop route hit:', req.params.itemId);
  itemController.transferToShop(req, res, next);
});

// Get single item
router.get('/:itemId', itemController.getItem);

// Update item
router.put('/:itemId', itemController.updateItem);

// Delete item
router.delete('/:itemId', itemController.deleteItem);

module.exports = router; 