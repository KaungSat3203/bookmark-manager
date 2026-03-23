const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // support dynamic frontend URL
    credentials: true // allow cookies
}));
app.use(express.json()); // parse JSON request body
app.use(cookieParser()); // parse cookies

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/collections', require('./routes/collections'));

// Connect to MongoDB
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.log("MongoDB connection error:", err));
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Conditionally listen for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for Vercel serverless function
module.exports = app;
