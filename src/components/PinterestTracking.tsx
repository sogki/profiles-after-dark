import { useEffect, useRef } from "react";
import { useAuth } from "../context/authContext";
import { useLocation } from "react-router-dom";
import { trackPageVisit } from "../lib/pinterestTracking";

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
 * Component to handle Pinterest tracking with user email
 * Updates Pinterest tag with user email when user logs in
 * Tracks page views on route changes
 */
export default function PinterestTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const hasLoadedRef = useRef(false);

  // Load Pinterest tag with user email (only once)
  useEffect(() => {
    const loadPinterest = () => {
      if (typeof window !== "undefined" && window.pintrk) {
        const userEmail = user?.email;
        
        if (!hasLoadedRef.current) {
          if (userEmail) {
            // Load Pinterest tag with user email
            window.pintrk("load", "2612837208252", { em: userEmail });
          } else {
            // Load Pinterest tag without email (for anonymous users)
            window.pintrk("load", "2612837208252");
          }
          hasLoadedRef.current = true;
        } else if (userEmail) {
          // Update email if user logs in after initial load
          window.pintrk("load", "2612837208252", { em: userEmail });
        }
      } else {
        // If pintrk is not loaded yet, wait for it
        const checkPintrk = setInterval(() => {
          if (window.pintrk) {
            clearInterval(checkPintrk);
            const userEmail = user?.email;
            if (!hasLoadedRef.current) {
              if (userEmail) {
                window.pintrk("load", "2612837208252", { em: userEmail });
              } else {
                window.pintrk("load", "2612837208252");
              }
              hasLoadedRef.current = true;
            } else if (userEmail) {
              window.pintrk("load", "2612837208252", { em: userEmail });
            }
          }
        }, 100);

        // Clear interval after 5 seconds to avoid infinite loop
        setTimeout(() => clearInterval(checkPintrk), 5000);
      }
    };

    loadPinterest();
  }, [user?.email]);

  // Track page visits on route changes
  useEffect(() => {
    if (hasLoadedRef.current) {
      // Small delay to ensure Pinterest script is ready
      const timer = setTimeout(() => {
        trackPageVisit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return null; // This component doesn't render anything
}

