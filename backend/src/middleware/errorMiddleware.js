import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    statusCode = 400;
    const match = err.detail?.match(/\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    message = `Duplicate value for ${field}. Please use a different value.`;
  }

  // PostgreSQL foreign key error
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference. Related record not found.';
  }

  // PostgreSQL connection error
  if (err.code === 'ECONNREFUSED') {
    statusCode = 500;
    message = 'Database connection failed. Please check if PostgreSQL is running.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;