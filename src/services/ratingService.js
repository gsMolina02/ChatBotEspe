const db = require('../config/firebase');
const doc = db.collection('ratings').doc('data');

async function getRatings() {
    const snap = await doc.get();
    return snap.exists ? snap.data() : {};
}

async function addRating(profId, score) {
    const ratings = await getRatings();
    if (!ratings[profId]) {
        ratings[profId] = { totalScore: 0, count: 0, average: 0 };
    }
    ratings[profId].totalScore += score;
    ratings[profId].count += 1;
    ratings[profId].average = Math.round((ratings[profId].totalScore / ratings[profId].count) * 10) / 10;
    await doc.set(ratings);
    return ratings[profId];
}

module.exports = { getRatings, addRating };
