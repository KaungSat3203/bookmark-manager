const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const Tag = require('../models/Tag');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Search route
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        if (!q) {
            return res.json({ items: [], total: 0, page: 1, pages: 1 });
        }

        const searchRegex = new RegExp(q, 'i');
        const query = {
            userId: req.userId,
            $or: [
                { title: searchRegex },
                { url: searchRegex },
                { note: searchRegex },
                { 'meta.title': searchRegex },
                { 'meta.description': searchRegex },
                { 'meta.siteName': searchRegex }
            ]
        };

        const [bookmarks, total] = await Promise.all([
            Bookmark.find(query)
                .populate('tags')
                .populate('collectionId')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Bookmark.countDocuments(query)
        ]);

        const pages = Math.ceil(total / limit);
        res.json({
            items: bookmarks,
            total,
            page,
            pages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function fetchMetadata(url) {
    try {
        // Add user agent to avoid being blocked
        const res = await fetch(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BookmarkManager/1.0; +http://localhost)'
            }
        });
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const get = (selectors) => {
            for (const selector of selectors) {
                const el = $(selector).first();
                const value = el.attr('content') || el.attr('src') || el.text();
                if (value && value.trim()) return value.trim();
            }
            return null;
        };

        // Enhanced metadata extraction
        const meta = {
            title: get([
                'meta[property="og:title"]',
                'meta[name="twitter:title"]',
                'meta[name="title"]',
                'title'
            ]),
            description: get([
                'meta[property="og:description"]',
                'meta[name="twitter:description"]',
                'meta[name="description"]',
                'meta[itemprop="description"]'
            ]),
            image: get([
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                'meta[itemprop="image"]',
                'link[rel="image_src"]',
                'link[rel="icon"]',
                'link[rel="apple-touch-icon"]'
            ]),
            video: get([
                'meta[property="og:video"]',
                'meta[property="og:video:url"]',
                'meta[name="twitter:player"]'
            ]),
            siteName: get([
                'meta[property="og:site_name"]',
                'meta[name="application-name"]'
            ]) || new URL(url).hostname,
            publishedAt: get([
                'meta[property="article:published_time"]',
                'meta[name="date"]',
                'time[datetime]'
            ]),
            author: get([
                'meta[name="author"]',
                'meta[property="article:author"]'
            ]),
            type: get([
                'meta[property="og:type"]',
                'meta[name="twitter:card"]'
            ])
        };

        // Clean up and validate dates
        if (meta.publishedAt) {
            const date = new Date(meta.publishedAt);
            meta.publishedAt = !isNaN(date.getTime()) ? date : null;
        }

        // Ensure image URLs are absolute
        if (meta.image && !meta.image.startsWith('http')) {
            const baseUrl = new URL(url);
            meta.image = meta.image.startsWith('/') 
                ? `${baseUrl.protocol}//${baseUrl.host}${meta.image}`
                : `${baseUrl.protocol}//${baseUrl.host}/${meta.image}`;
        }

        return meta;
    } catch (err) {
        console.error(`Error fetching metadata for ${url}:`, err.message);
        return {};
    }
}

async function cleanupTagsIfUnused(tagIds, userId) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) return;
    
    try {
        // Get all bookmarks for this user that use any of these tags
        const bookmarks = await Bookmark.find({
            userId,
            tags: { $in: tagIds }
        }).select('tags');

        // Create a Set of tags that are still in use
        const usedTags = new Set(
            bookmarks.flatMap(b => b.tags.map(t => t.toString()))
        );

        // Delete tags that aren't in the usedTags set
        const tagsToDelete = tagIds.filter(id => !usedTags.has(id.toString()));
        
        if (tagsToDelete.length > 0) {
            await Tag.deleteMany({
                _id: { $in: tagsToDelete },
                userId
            });
            console.log(`Cleaned up ${tagsToDelete.length} unused tags for user ${userId}`);
        }
    } catch (err) {
        console.error('Error during tag cleanup:', err);
    }
}

// Add this function to do a full cleanup of all unused tags
async function cleanupAllUnusedTags(userId) {
    try {
        // Get all tags for this user
        const tags = await Tag.find({ userId }).select('_id');
        const tagIds = tags.map(t => t._id);
        
        // Clean them up
        await cleanupTagsIfUnused(tagIds, userId);
    } catch (err) {
        console.error('Error during full tag cleanup:', err);
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

        const [bookmarks, total] = await Promise.all([
            Bookmark.find({ userId: req.userId }).populate('tags').populate('collectionId').skip(skip).limit(limit),
            Bookmark.countDocuments({ userId: req.userId })
        ]);

        // Send paginated response
        const pages = Math.ceil(total / limit);
        res.json({
            items: bookmarks,
            total,
            page,
            pages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookmarks by tag ids
router.get('/by-tag/:tagIds', auth, async (req, res) => {
    try {
        const tagIds = req.params.tagIds.split(',');
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        // Find bookmarks that have ALL of the specified tags
        const [bookmarks, total] = await Promise.all([
            Bookmark.find({ 
                userId: req.userId, 
                tags: { $all: tagIds } // Changed from $in to $all to require all tags
            })
            .populate('tags')
            .populate('collectionId')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
            Bookmark.countDocuments({ 
                userId: req.userId, 
                tags: { $all: tagIds } // Changed from $in to $all to require all tags
            })
        ]);

        // Update metadata for bookmarks that are missing it
        for (let bookmark of bookmarks) {
            if (!bookmark.meta || !bookmark.meta.title) {
                try {
                    const meta = await fetchMetadata(bookmark.url);
                    if (meta) {
                        bookmark = await Bookmark.findOneAndUpdate(
                            { _id: bookmark._id },
                            { $set: { meta } },
                            { new: true }
                        ).populate('tags').populate('collectionId');
                    }
                } catch (e) {
                    // Silently handle metadata fetch errors
                    console.error(`Failed to fetch metadata for bookmark ${bookmark._id}:`, e.message);
                }
            }
        }

        const pages = Math.ceil(total / limit);
        res.json({
            items: bookmarks,
            total,
            page,
            pages
        });
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

        const [bookmarks, total] = await Promise.all([
            Bookmark.find({ userId: req.userId, collectionId }).populate('tags').populate('collectionId').skip(skip).limit(limit),
            Bookmark.countDocuments({ userId: req.userId, collectionId })
        ]);

        // Update metadata for bookmarks that are missing it
        for (let bookmark of bookmarks) {
            if (!bookmark.meta || !bookmark.meta.title) {
                try {
                    const meta = await fetchMetadata(bookmark.url);
                    if (meta) {
                        bookmark = await Bookmark.findOneAndUpdate(
                            { _id: bookmark._id },
                            { $set: { meta } },
                            { new: true }
                        ).populate('tags').populate('collectionId');
                    }
                } catch (e) {
                    // Silently handle metadata fetch errors
                    console.error(`Failed to fetch metadata for bookmark ${bookmark._id}:`, e.message);
                }
            }
        }

        const pages = Math.ceil(total / limit);
        res.json({
            items: bookmarks,
            total,
            page,
            pages
        });
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
