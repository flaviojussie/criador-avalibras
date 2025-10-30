const isDev = process.env.NODE_ENV === 'development';

/**
 * Logs messages to the console only when in development mode.
 * @param  {...any} args - The values to log.
 */
export const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};
