import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: path.join(logDir, 'app.log'),
          mkdir: true,
        },
      },
    ],
  },
});

// File logging for user activities (text format)
export const logUserActivity = (username, email, action, details = '') => {
  const logEntry = `
========================================
Timestamp: ${new Date().toLocaleString()}
Username: ${username}
Email: ${email}
Action: ${action}
Details: ${details}
========================================
`;
  fs.appendFileSync(path.join(logDir, 'users.log'), logEntry);
};

export default logger;