// Chạy đoạn mã này MỘT LẦN trong terminal Node.js để tạo khóa
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log(secret);
