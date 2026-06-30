const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../data/ratings.json');

function readRatings() {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return {};
    }
}

function writeRatings(ratings) {
    fs.writeFileSync(filePath, JSON.stringify(ratings, null, 2), 'utf8');
}

function getRatings() {
    return readRatings();
}

function addRating(profId, score) {
    const ratings = readRatings();
    if (!ratings[profId]) {
        ratings[profId] = { totalScore: 0, count: 0, average: 0 };
    }
    ratings[profId].totalScore += score;
    ratings[profId].count += 1;
    ratings[profId].average = Math.round((ratings[profId].totalScore / ratings[profId].count) * 10) / 10;
    writeRatings(ratings);
    return ratings[profId];
}

module.exports = { getRatings, addRating };
