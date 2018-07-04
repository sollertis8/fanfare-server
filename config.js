exports.DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL || 'mongodb://fanfare.mizugo.com';
exports.PORT = process.env.PORT || 27017;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';