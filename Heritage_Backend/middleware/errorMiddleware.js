// middleware/errorMiddleware.js
// Express global centralized error handling middleware

module.exports = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    message: message
  });
};
