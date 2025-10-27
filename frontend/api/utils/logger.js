const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };
  return JSON.stringify(logEntry);
}

// Allow console logging in development, use structured logging in production
const isDevelopment = process.env.NODE_ENV === 'development';

function log(level, formattedMessage) {
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console[level](formattedMessage);
  } else {
    // In production, we'd use a proper logging service
    // This is a placeholder for proper structured logging
    process.stdout.write(formattedMessage + '\n');
  }
}

export function debug(message, data = null) {
  log('debug', formatMessage(LOG_LEVELS.DEBUG, message, data));
}

export function info(message, data = null) {
  log('info', formatMessage(LOG_LEVELS.INFO, message, data));
}

export function warn(message, data = null) {
  log('warn', formatMessage(LOG_LEVELS.WARN, message, data));
}

export function error(message, error = null, data = null) {
  log(
    'error',
    formatMessage(LOG_LEVELS.ERROR, message, {
      ...(error && { error: error.message, stack: error.stack }),
      ...(data && { data }),
    })
  );
}
