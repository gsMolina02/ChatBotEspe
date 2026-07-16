const crypto = require('crypto');
const db = require('../config/firebase');

const ratingsCollection = db.collection('professorRatings');

function createRatingId(userId, profId) {
    return crypto
        .createHash('sha256')
        .update(`${userId}:${profId}`)
        .digest('hex');
}

async function getRatings() {
    const snapshot = await ratingsCollection.get();
    const groupedRatings = {};

    snapshot.docs.forEach(document => {
        const rating = document.data();

        if (!groupedRatings[rating.profId]) {
            groupedRatings[rating.profId] = {
                totalScore: 0,
                count: 0,
                average: 0
            };
        }

        groupedRatings[rating.profId].totalScore += Number(rating.score);
        groupedRatings[rating.profId].count += 1;
    });

    Object.values(groupedRatings).forEach(rating => {
        rating.average = Math.round((rating.totalScore / rating.count) * 10) / 10;
    });

    return groupedRatings;
}

async function addRating(userId, profId, score) {
    const ratingId = createRatingId(userId, profId);
    const reference = ratingsCollection.doc(ratingId);
    const existing = await reference.get();
    const now = new Date().toISOString();

    await reference.set({
        userId,
        profId,
        score,
        createdAt: existing.exists ? existing.data().createdAt : now,
        updatedAt: now
    });

    const ratings = await getRatings();

    return ratings[profId];
}

module.exports = {
    getRatings,
    addRating
};