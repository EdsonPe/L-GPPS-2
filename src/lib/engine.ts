import CryptoJS from 'crypto-js';

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

/**
 * L-GPPS Core Engine
 * Implements Flow Coherence Index (ICF) and Entropy Filter
 */
export class LGPPSEngine {
  /**
   * Calculates the distance between two coordinates in meters
   */
  static getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * P_kin: Kinematic Penalty function
   * Calibrates based on pedestrian vs vehicle speeds
   */
  static calculateKinematicPenalty(v: number, a: number): number {
    // Pedestrian centric for civic evidence
    // Max speed 120km/h (33.3m/s)
    if (v > 33.3) return 0; 
    
    // Antropomorphic plausibility
    if (v < 0.2) return 0.5; // Stagnation
    if (v > 0.5 && v < 2) return 1.0; // Efficient walking
    if (v > 2 && v < 15) return 0.8; // Running/Cycling
    
    return 0.6; // Motorized
  }

  /**
   * ICF(pe) = (Σ ωi Pkin(pre)) × (Σ ωj Pkin(post))
   */
  static calculateICF(trajectory: TrajectoryPoint[], eventIndex: number): number {
    if (trajectory.length < 3) return 0;

    const preWindow = trajectory.slice(Math.max(0, eventIndex - 5), eventIndex);
    const postWindow = trajectory.slice(eventIndex + 1, Math.min(trajectory.length, eventIndex + 6));

    if (preWindow.length === 0 || postWindow.length === 0) return 0.5;

    const calculateWindowScore = (window: TrajectoryPoint[]) => {
      let score = 0;
      for (let i = 1; i < window.length; i++) {
        const dt = (window[i].timestamp - window[i - 1].timestamp) / 1000;
        const dx = this.getDistance(window[i - 1], window[i]);
        const v = dx / dt;
        const a = 0; // Simplified for MVP
        score += this.calculateKinematicPenalty(v, a);
      }
      return score / (window.length - 1 || 1);
    };

    const preScore = calculateWindowScore(preWindow);
    const postScore = calculateWindowScore(postWindow);

    return preScore * postScore;
  }

  /**
   * Entropy Filter (Anti-Bot)
   * Prevents perfect copies or teleports
   */
  static calculateEntropy(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length < 2) return 0;
    
    // Simplified Mahalanobis distance simulation
    let variation = 0;
    for (let i = 1; i < trajectory.length; i++) {
      const d = this.getDistance(trajectory[i-1], trajectory[i]);
      if (d > 500) return 5; // Teleportation detection
      variation += d;
    }
    
    const avg = variation / trajectory.length;
    if (avg < 0.1) return 0.05; // Robotic precision detection
    
    return Math.min(3.5, avg / 10); // Normalized entropy
  }

  /**
   * Generate SHA256 Hash for Trustless Ledger
   */
  static generateHashChain(prevHash: string, position: { lat: number, lng: number }, time: number, icf: number): string {
    return CryptoJS.SHA256(`${prevHash}|${position.lat},${position.lng}|${time}|${icf}`).toString();
  }
}
