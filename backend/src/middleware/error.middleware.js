export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  console.error(`[Error Boundary] ${req.method} ${req.url} - ${status}: ${message}`);

  res.status(status).json({
    success: false,
    error: message,
  });
};
