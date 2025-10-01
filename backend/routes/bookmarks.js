const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const Tag = require('../models/Tag');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function fetchMetadata(url) {
    try {
        const res = await fetch(url, { timeout: 5000 });
        const html = await res.text();
        const $ = cheerio.load(html);
        const get = (sel) => {
            const el = $(sel).first();
            return el && el.attr('content') ? el.attr('content') : (el && el.attr('src') ? el.attr('src') : el.text());
        };

        const meta = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text() || null,
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null,
            image: $('meta[property="og:image"]').attr('content') || $('link[rel="image_src"]').attr('href') || null,
            video: $('meta[property="og:video"]').attr('content') || null,
            siteName: $('meta[property="og:site_name"]').attr('content') || null,
            publishedAt: $('meta[property="article:published_time"]').attr('content') || null
        };

        if (meta.publishedAt) meta.publishedAt = new Date(meta.publishedAt);
        return meta;
    } catch (err) {
        return {};
    }
}

async function cleanupTagsIfUnused(tagIds, userId) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) return;
    for (const tagId of tagIds) {
        const count = await Bookmark.countDocuments({ tags: tagId, userId });
        if (count === 0) {
            await Tag.deleteOne({ _id: tagId, userId });
        }
    }
}

// CRUD
router.post('/', auth, async (req, res) => {
    try {
        const { title, url, note, tags, collectionId } = req.body;
        const tagIds = [];
        if (Array.isArray(tags)) {
            for (const tagName of tags) {
                let tag = await Tag.findOne({ name: tagName, userId: req.userId });
                if (!tag) {
                    tag = new Tag({ name: tagName, userId: req.userId });
                    await tag.save();
                }
                tagIds.push(tag._id);
            }
        }

        // fetch metadata (best-effort)
        const meta = await fetchMetadata(url);

        const bookmark = new Bookmark({ title, url, note, tags: tagIds, userId: req.userId, collectionId: collectionId || null, meta });
        await bookmark.save();
        await bookmark.populate('tags');

        res.status(201).json(bookmark);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Bookmark.find({ userId: req.userId }).populate('tags').populate('collectionId').skip(skip).limit(limit),
            Bookmark.countDocuments({ userId: req.userId })
        ]);

        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookmarks by tag id
router.get('/by-tag/:tagId', auth, async (req, res) => {
    try {
        const { tagId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Bookmark.find({ userId: req.userId, tags: tagId }).populate('tags').populate('collectionId').skip(skip).limit(limit),
            Bookmark.countDocuments({ userId: req.userId, tags: tagId })
        ]);

        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookmarks by collection id
router.get('/by-collection/:collectionId', auth, async (req, res) => {
    try {
        const { collectionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Bookmark.find({ userId: req.userId, collectionId }).populate('tags').populate('collectionId').skip(skip).limit(limit),
            Bookmark.countDocuments({ userId: req.userId, collectionId })
        ]);

        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, url, note, tags, collectionId } = req.body;
        const tagIds = [];
        if (Array.isArray(tags)) {
            for (const tagName of tags) {
                let tag = await Tag.findOne({ name: tagName, userId: req.userId });
                if (!tag) {
                    tag = new Tag({ name: tagName, userId: req.userId });
                    await tag.save();
                }
                tagIds.push(tag._id);
            }
        }

        // fetch metadata if url changed or meta is missing
        let meta = undefined;
        if (url) {
            meta = await fetchMetadata(url);
        }

    const updateDoc = { title, url, note, tags: tagIds };
        if (typeof collectionId !== 'undefined') {
            updateDoc.collectionId = collectionId || null;
        }

        if (meta) updateDoc.meta = meta;

        const prev = await Bookmark.findOne({ _id: req.params.id, userId: req.userId });

        const bookmark = await Bookmark.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateDoc,
            { new: true }
        ).populate('tags').populate('collectionId');

        // cleanup any tags that were removed
        try {
            const prevTagIds = prev && prev.tags ? prev.tags.map(t => t.toString()) : [];
            const newTagIds = tagIds.map(t => t.toString());
            const removed = prevTagIds.filter(id => !newTagIds.includes(id));
            await cleanupTagsIfUnused(removed, req.userId);
        } catch (e) {
            // ignore cleanup errors
        }

        res.json(bookmark);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const prev = await Bookmark.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (prev && Array.isArray(prev.tags) && prev.tags.length > 0) {
            const tagIds = prev.tags.map(t => t.toString());
            await cleanupTagsIfUnused(tagIds, req.userId);
        }
        res.json({ message: 'Bookmark deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
