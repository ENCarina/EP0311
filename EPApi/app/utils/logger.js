export const log = (message) => {
  if (process.env.APP_LOG === 'console.log') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] LOG: ${message}`);
  }
};

export default log;