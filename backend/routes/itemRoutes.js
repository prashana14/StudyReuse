const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  deleteItem
} = require('../controller/itemController');

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.delete('/:id', deleteItem);

module.exports = router;
