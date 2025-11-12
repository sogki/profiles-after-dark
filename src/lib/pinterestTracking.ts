/**
 * Pinterest Event Tracking Utility
 * Provides helper functions to track Pinterest conversion events
 */

// Extend Window interface for Pinterest tracking
declare global {
  interface Window {
    pintrk?: {
      (action: string, ...args: any[]): void;
      queue?: any[];
      version?: string;
    };
  }
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track a Pinterest event
 */
export function trackPinterestEvent(
  eventName: string,
  eventData?: Record<string, any>
): void {
  if (typeof window === "undefined" || !window.pintrk) {
    // If Pinterest script hasn't loaded yet, queue the event
    if (!window.pintrk) {
      window.pintrk = function () {
        (window.pintrk!.queue = window.pintrk!.queue || []).push(
          Array.prototype.slice.call(arguments)
        );
      } as any;
      window.pintrk.queue = [];
    }
  }

  const eventId = eventData?.event_id || generateEventId();
  const trackingData = {
    event_id: eventId,
    ...eventData,
  };

  window.pintrk("track", eventName, trackingData);
}

/**
 * Track page visit
 */
export function trackPageVisit(): void {
  trackPinterestEvent("pagevisit", {
    event_id: generateEventId(),
  });
}

/**
 * Track user signup
 */
export function trackSignup(): void {
  trackPinterestEvent("signup", {
    event_id: generateEventId(),
  });
}

/**
 * Track lead (newsletter signup, etc.)
 */
export function trackLead(leadType: string = "Newsletter"): void {
  trackPinterestEvent("lead", {
    event_id: generateEventId(),
    lead_type: leadType,
  });
}

/**
 * Track search query
 */
export function trackSearch(searchQuery: string): void {
  if (!searchQuery || searchQuery.trim().length === 0) return;

  trackPinterestEvent("search", {
    event_id: generateEventId(),
    search_query: searchQuery.trim(),
  });
}

