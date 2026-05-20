// Utility functions for request/response normalization.
// Add shared helper functions here as patterns emerge across controllers.

export const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const sendError = (res, message, status = 400) => {
  res.status(status).json({ success: false, error: message });
};

export const extractBearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};
