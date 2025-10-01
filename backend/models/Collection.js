const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
}, { timestamps: true });

// Compound index to ensure unique collection names per user
CollectionSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Collection', CollectionSchema);