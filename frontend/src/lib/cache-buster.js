// Cache busting utility
export class CacheBuster {
  constructor() {
    this.version = this.generateVersion();
    this.timestamp = Date.now();
  }

  generateVersion() {
    // Generate a version based on current timestamp and random string
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  // Get cache busting parameter for URLs
  getCacheBuster() {
    return `v=${this.version}&t=${this.timestamp}`;
  }

  // Add cache busting to any URL
  bustCache(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.getCacheBuster()}`;
  }

  // Get current version
  getVersion() {
    return this.version;
  }

  // Check if version has changed (useful for detecting updates)
  hasVersionChanged(storedVersion) {
    return storedVersion !== this.version;
  }
}

// Create singleton instance
export const cacheBuster = new CacheBuster();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.cacheBuster = cacheBuster;
}
