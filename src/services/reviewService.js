const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../data/reviews.json');

function readReviews() {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return [];
    }
}

function writeReviews(reviews) {
    fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2), 'utf8');
}

function getReviewsByCategory(category) {
    return readReviews().filter(r => r.category === category);
}

function addReview({ category, roomId, roomName, author, avatar, content, citedRoom }) {
    const reviews = readReviews();
    const review = {
        id: Date.now().toString(),
        category,
        roomId: roomId || null,
        roomName: roomName || null,
        author,
        avatar,
        content: content.trim().slice(0, 280),
        citedRoom: citedRoom || null,
        timestamp: new Date().toISOString()
    };
    reviews.unshift(review);
    writeReviews(reviews);
    return review;
}

module.exports = { getReviewsByCategory, addReview };
