const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// CRUD
router.post('/', auth, async (req, res) => {
    const { name } = req.body;
    const category = new Category({ name, userId: req.userId });
    await category.save();
    res.status(201).json(category);
});

router.get('/', auth, async (req, res) => {
    const categories = await Category.find({ userId: req.userId });
    res.json(categories);
});

router.put('/:id', auth, async (req, res) => {
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { name },
        { new: true }
    );
    res.json(category);
});

router.delete('/:id', auth, async (req, res) => {
    await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Category deleted' });
});

module.exports = router;
