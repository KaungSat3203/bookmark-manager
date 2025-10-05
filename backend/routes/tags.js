const router = require('express').Router();
const Tag = require('../models/Tag');
const Bookmark = require('../models/Bookmark');
const auth = require('../middleware/auth');

// Get all tags for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const tags = await Tag.find({ userId: req.userId });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new tag (this is usually done automatically when creating bookmarks)
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        // Try to find existing tag first
        let tag = await Tag.findOne({ name, userId: req.userId });
        
        if (!tag) {
            // Create new tag if it doesn't exist
            tag = new Tag({ name, userId: req.userId });
            await tag.save();
        }
        
        res.status(201).json(tag);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tag already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Delete a tag
router.delete('/:id', auth, async (req, res) => {
    try {
        await Tag.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to clean up unused tags
router.post('/cleanup', auth, async (req, res) => {
    try {
        const tags = await Tag.find({ userId: req.userId }).select('_id');
        const bookmarks = await Bookmark.find({ userId: req.userId }).select('tags');
        
        // Get all tags in use
        const usedTags = new Set(
            bookmarks.flatMap(b => b.tags.map(t => t.toString()))
        );
        
        // Find tags that aren't used in any bookmarks
        const unusedTags = tags.filter(tag => !usedTags.has(tag._id.toString()));
        
        if (unusedTags.length > 0) {
            await Tag.deleteMany({
                _id: { $in: unusedTags.map(t => t._id) },
                userId: req.userId
            });
            
            res.json({ 
                message: `Cleaned up ${unusedTags.length} unused tags`,
                deletedCount: unusedTags.length
            });
        } else {
            res.json({ 
                message: 'No unused tags found',
                deletedCount: 0
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;