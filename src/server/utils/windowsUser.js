import { execSync } from 'child_process';
import os from 'os';

/**
 * Gets the current Windows username
 * @returns {string} The Windows username
 */
export function getWindowsUsername() {
  try {
    // Try to get username from environment variables first
    const envUsername = process.env.USERNAME || process.env.USER;
    if (envUsername) {
      return envUsername;
    }
    
    // If environment variables don't work, try OS module
    const hostname = os.hostname();
    const userInfo = os.userInfo();
    if (userInfo && userInfo.username) {
      return userInfo.username;
    }
    
    // As a last resort, try to execute whoami command
    if (process.platform === 'win32') {
      try {
        const whoami = execSync('whoami').toString().trim();
        if (whoami) {
          console.log(`Found username from whoami: ${whoami}`);
          // Extract username from domain\username format
          const parts = whoami.split('\\');
          return parts.length > 1 ? parts[1] : whoami;
        }
      } catch (cmdError) {
        console.error('Error executing whoami command:', cmdError);
      }
    }
    
    // If we're in production, use a default username rather than blocking access
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('In production, using default username: defra-user');
      return 'defra-user';
    }
    
    // Default fallback
    return 'unknown';
  } catch (error) {
    console.error('Error getting Windows username:', error);
    
    // In production, use a default username rather than blocking access
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return 'defra-user';
    }
    
    return 'unknown';
  }
}