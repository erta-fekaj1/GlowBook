const User = require('../models/User');

const BADGES = [
    { points: 50, label: 'Bronze Client' },
    { points: 120, label: 'Silver Client' },
    { points: 220, label: 'Gold Client' },
    { points: 350, label: 'VIP Client' },
];

function deriveBadges(points) {
    return BADGES.filter((b) => points >= b.points).map((b) => b.label);
}

async function awardPointsToUser(userId, points) {
    const user = await User.findById(userId);
    if (!user) return null;
    user.loyaltyPoints = Number(user.loyaltyPoints || 0) + Number(points || 0);
    user.badges = deriveBadges(user.loyaltyPoints);
    await user.save();
    return user;
}

module.exports = { awardPointsToUser, deriveBadges };
