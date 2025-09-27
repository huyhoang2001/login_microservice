// Mask sensitive data (tokens, passwords, etc.)
const maskToken = (token) => {
  if (!token || typeof token !== 'string') return token;
  
  if (token.length <= 10) {
    // For short tokens, just mask middle
    return token.charAt(0) + '***' + token.slice(-1);
  } else if (token.length <= 20) {
    // For medium tokens, show first 3 and last 3
    return token.slice(0, 3) + '***' + token.slice(-3);
  } else {
    // For long tokens (like JWT), show first 8 and last 8
    return token.slice(0, 8) + '*'.repeat(Math.min(15, token.length - 16)) + token.slice(-8);
  }
};

// Mask password
const maskPassword = (password) => {
  if (!password) return password;
  return '***';
};

// Mask email partially
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 ? 
    username.charAt(0) + '*'.repeat(Math.max(1, username.length - 2)) + username.slice(-1) :
    username;
  return `${maskedUsername}@${domain}`;
};

// Mask sensitive fields in object
const maskSensitiveData = (obj, fieldsToMask = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const masked = { ...obj };
  
  // Default sensitive fields
  const defaultSensitive = ['password', 'token', 'accessToken', 'refreshToken'];
  const allSensitive = [...defaultSensitive, ...fieldsToMask];
  
  allSensitive.forEach(field => {
    if (masked[field]) {
      if (field === 'password') {
        masked[field] = maskPassword(masked[field]);
      } else if (field.toLowerCase().includes('token')) {
        masked[field] = maskToken(masked[field]);
      } else {
        masked[field] = '***';
      }
    }
  });
  
  return masked;
};

// Safe logging with masked sensitive data
const safeLog = (message, data = null) => {
  if (data) {
    const maskedData = maskSensitiveData(data);
    console.log(message, maskedData);
  } else {
    console.log(message);
  }
};

module.exports = {
  maskToken,
  maskPassword,
  maskEmail,
  maskSensitiveData,
  safeLog
};