const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // frontend URL
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
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
