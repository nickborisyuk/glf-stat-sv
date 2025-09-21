import { gpsLocation, gpsError, gpsDistance, gpsTracking } from '../stores/app.js';

class GPSManager {
  constructor() {
    this.watchId = null;
    this.startLocation = null;
    this.currentLocation = null;
    this.isTracking = false;
    this.distanceUpdateCallbacks = [];
    this.activeTrackings = new Map(); // Track individual shot distances
  }

  // Start GPS tracking
  async startTracking() {
    if (!navigator.geolocation) {
      gpsError.set('Geolocation is not supported by this browser');
      return false;
    }

    try {
      // Get initial position
      const position = await this.getCurrentPosition();
      this.startLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
      this.currentLocation = this.startLocation;
      
      gpsLocation.set(this.currentLocation);
      gpsError.set(null);
      gpsDistance.set(0);
      gpsTracking.set(true);

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      this.handlePositionError(error);
      return false;
    }
  }

  // Stop GPS tracking
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.startLocation = null;
    this.currentLocation = null;
    this.distanceUpdateCallbacks = [];
    this.activeTrackings.clear();
    gpsTracking.set(false);
    gpsLocation.set(null);
    gpsDistance.set(0);
  }

  // Start tracking for a specific shot
  startShotTracking(shotId) {
    if (!this.currentLocation) {
      console.warn('No current location available for shot tracking');
      return false;
    }

    const shotStartLocation = {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      timestamp: this.currentLocation.timestamp
    };

    this.activeTrackings.set(shotId, {
      startLocation: shotStartLocation,
      currentDistance: 0
    });

    console.log(`Started tracking for shot ${shotId} from:`, shotStartLocation);
    return true;
  }

  // Stop tracking for a specific shot
  stopShotTracking(shotId) {
    this.activeTrackings.delete(shotId);
    console.log(`Stopped tracking for shot ${shotId}`);
  }

  // Get distance for a specific shot
  getShotDistance(shotId) {
    const tracking = this.activeTrackings.get(shotId);
    if (!tracking || !this.currentLocation) {
      return 0;
    }

    return this.calculateDistance(
      tracking.startLocation.latitude,
      tracking.startLocation.longitude,
      this.currentLocation.latitude,
      this.currentLocation.longitude
    );
  }

  // Get current position (one-time)
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });
    });
  }

  // Handle position updates
  handlePositionUpdate(position) {
    this.currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy
    };

    gpsLocation.set(this.currentLocation);

    // Update global distance if we have a start location
    if (this.startLocation) {
      const distance = this.calculateDistance(
        this.startLocation.latitude,
        this.startLocation.longitude,
        this.currentLocation.latitude,
        this.currentLocation.longitude
      );
      const roundedDistance = Math.round(distance);
      gpsDistance.set(roundedDistance);
      
      // Call all distance update callbacks
      this.distanceUpdateCallbacks.forEach(callback => {
        try {
          callback(roundedDistance);
        } catch (error) {
          console.error('Error in distance update callback:', error);
        }
      });
    }

    // Update distances for all active shot trackings
    this.activeTrackings.forEach((tracking, shotId) => {
      const shotDistance = this.calculateDistance(
        tracking.startLocation.latitude,
        tracking.startLocation.longitude,
        this.currentLocation.latitude,
        this.currentLocation.longitude
      );
      tracking.currentDistance = Math.round(shotDistance);
    });
  }

  // Handle position errors
  handlePositionError(error) {
    let errorMessage = 'Unknown GPS error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    gpsError.set(errorMessage);
    console.error('GPS Error:', errorMessage, error);
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Get current distance from start location
  getCurrentDistance() {
    if (!this.startLocation || !this.currentLocation) {
      return 0;
    }
    return this.calculateDistance(
      this.startLocation.latitude,
      this.startLocation.longitude,
      this.currentLocation.latitude,
      this.currentLocation.longitude
    );
  }

  // Reset distance tracking (new shot)
  resetDistance() {
    if (this.currentLocation) {
      this.startLocation = {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        timestamp: this.currentLocation.timestamp
      };
      gpsDistance.set(0);
      
      // Call all distance update callbacks with 0
      this.distanceUpdateCallbacks.forEach(callback => {
        try {
          callback(0);
        } catch (error) {
          console.error('Error in distance update callback:', error);
        }
      });
    }
  }

  // Subscribe to distance updates
  onDistanceUpdate(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.distanceUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.distanceUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.distanceUpdateCallbacks.splice(index, 1);
      }
    };
  }

  // Get location accuracy status
  getAccuracyStatus() {
    if (!this.currentLocation || !this.currentLocation.accuracy) {
      return { status: 'unknown', color: 'gray' };
    }

    const accuracy = this.currentLocation.accuracy;
    
    if (accuracy <= 5) {
      return { status: 'excellent', color: 'green' };
    } else if (accuracy <= 10) {
      return { status: 'good', color: 'blue' };
    } else if (accuracy <= 20) {
      return { status: 'fair', color: 'orange' };
    } else {
      return { status: 'poor', color: 'red' };
    }
  }
}

// Create singleton instance
export const gpsManager = new GPSManager();

// Export utility functions
export function formatDistance(distance) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  return `${distance}m`;
}

export function getDistanceColor(distance) {
  if (distance < 50) return 'text-green-600';
  if (distance < 100) return 'text-blue-600';
  if (distance < 200) return 'text-orange-600';
  return 'text-red-600';
}
