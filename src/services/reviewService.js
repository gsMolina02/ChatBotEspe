const db = require('../config/firebase');
const collection = db.collection('reviews');

async function getReviewsByCategory(category) {
    const snapshot = await collection.where('category', '==', category).get();
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function addReview({ category, roomId, roomName, author, avatar, content, citedRoom }) {
    const review = {
        category,
        roomId: roomId || null,
        roomName: roomName || null,
        author,
        avatar,
        content: content.trim().slice(0, 280),
        citedRoom: citedRoom || null,
        timestamp: new Date().toISOString()
    };
    const ref = await collection.add(review);
    return { id: ref.id, ...review };
}

module.exports = { getReviewsByCategory, addReview };
