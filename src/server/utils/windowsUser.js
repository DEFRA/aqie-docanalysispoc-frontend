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
      const whoami = execSync('whoami').toString().trim();
      if (whoami) {
        // Extract username from domain\username format
        const parts = whoami.split('\\');
        return parts.length > 1 ? parts[1] : whoami;
      }
    }
    
    // Default fallback
    return 'unknown';
  } catch (error) {
    console.error('Error getting Windows username:', error);
    return 'unknown';
  }
}