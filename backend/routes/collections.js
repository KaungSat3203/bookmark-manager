const router = require('express').Router();
const Collection = require('../models/Collection');
const auth = require('../middleware/auth');

// Get all collections for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const collections = await Collection.find({ userId: req.userId });
        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get collection by id
router.get('/:id', auth, async (req, res) => {
    try {
        const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
        if (!collection) return res.status(404).json({ message: 'Not found' });
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new collection
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const collection = new Collection({ name, description, userId: req.userId });
        await collection.save();
        res.status(201).json(collection);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Collection name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Update a collection
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const collection = await Collection.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, description },
            { new: true }
        );
        res.json(collection);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Collection name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Delete a collection
router.delete('/:id', auth, async (req, res) => {
    try {
        const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;