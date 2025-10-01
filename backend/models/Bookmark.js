
const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
    note: { type: String },
    meta: {
        title: { type: String },
        description: { type: String },
        image: { type: String },
        video: { type: String },
        siteName: { type: String },
        publishedAt: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
