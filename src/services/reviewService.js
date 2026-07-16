const crypto = require('crypto');
const db = require('../config/firebase');

const collection = db.collection('reviews');

function createReviewId(userId, category, targetId) {
    return crypto
        .createHash('sha256')
        .update(`${userId}:${category}:${targetId}`)
        .digest('hex');
}

async function getReviewsByCategory(category) {
    const snapshot = await collection.where('category', '==', category).get();

    return snapshot.docs
        .map(document => ({
            id: document.id,
            ...document.data()
        }))
        .sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp));
}

async function addReview({ userId, category, roomId, roomName, author, avatar, content, citedRoom }) {
    const targetId = String(roomId || citedRoom || roomName || '').trim();

    if (!userId || !targetId) {
        throw new Error('No fue posible identificar al usuario o al elemento reseñado.');
    }

    const reviewId = createReviewId(userId, category, targetId);
    const reference = collection.doc(reviewId);
    const existing = await reference.get();

    if (existing.exists) {
        throw new Error('Ya registraste una reseña para este elemento.');
    }

    const review = {
        userId,
        category,
        roomId: roomId || null,
        roomName: roomName || null,
        targetId,
        author,
        avatar,
        content: content.trim().slice(0, 500),
        citedRoom: citedRoom || null,
        timestamp: new Date().toISOString()
    };

    await reference.create(review);

    return {
        id: reviewId,
        ...review
    };
}

module.exports = {
    getReviewsByCategory,
    addReview
};