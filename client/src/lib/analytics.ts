// Analytics tracking utility
// Tracks user interactions for A/B testing and behavior analysis

interface TrackEventOptions {
  eventType: 'click' | 'page_view' | 'form_submit' | 'button_click' | 'link_click' | 'custom';
  eventName: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  elementType?: string;
  metadata?: Record<string, any>;
  experimentId?: string;
  variantId?: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private userEmail?: string;
  private enabled: boolean = true;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Try to get user info from localStorage
    this.loadUserInfo();
    
    // Track page views automatically
    this.trackPageView();
    
    // Set up automatic click tracking
    this.setupAutoTracking();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private loadUserInfo() {
    try {
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      if (userId) this.userId = userId;
      if (userEmail) this.userEmail = userEmail;
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  public setUser(userId: string, userEmail?: string) {
    this.userId = userId;
    this.userEmail = userEmail;
    
    try {
      localStorage.setItem('userId', userId);
      if (userEmail) localStorage.setItem('userEmail', userEmail);
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  public clearUser() {
    this.userId = undefined;
    this.userEmail = undefined;
    
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private setupAutoTracking() {
    // Track all clicks automatically
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Get element details
      const elementId = target.id;
      const elementClass = target.className;
      const elementText = target.textContent?.trim().substring(0, 500) || '';
      const elementType = target.tagName.toLowerCase();
      
      // Determine event name based on element
      let eventName = 'generic_click';
      if (elementType === 'button') {
        eventName = 'button_click';
      } else if (elementType === 'a') {
        eventName = 'link_click';
      } else if (target.getAttribute('role') === 'button') {
        eventName = 'button_click';
      }
      
      // Track the click
      this.track({
        eventType: 'click',
        eventName,
        elementId,
        elementClass,
        elementText,
        elementType,
      });
    }, true); // Use capture phase to catch all clicks
  }

  private trackPageView() {
    // Track initial page view
    this.track({
      eventType: 'page_view',
      eventName: 'page_view',
      metadata: {
        referrer: document.referrer,
      },
    });

    // Track page views on route changes (for SPAs)
    let lastPath = window.location.pathname;
    const checkPathChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        this.track({
          eventType: 'page_view',
          eventName: 'page_view',
          metadata: {
            referrer: document.referrer,
          },
        });
      }
    };

    // Check for path changes every 500ms (for client-side routing)
    setInterval(checkPathChange, 500);
  }

  public async track(options: TrackEventOptions): Promise<void> {
    if (!this.enabled) return;

    try {
      const eventData = {
        eventType: options.eventType,
        eventName: options.eventName,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        elementId: options.elementId,
        elementClass: options.elementClass,
        elementText: options.elementText,
        elementType: options.elementType,
        metadata: options.metadata,
        experimentId: options.experimentId,
        variantId: options.variantId,
      };

      // Send to backend (non-blocking)
      fetch('/api/tracking/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId,
          ...(this.userId && { 'x-user-id': this.userId }),
          ...(this.userEmail && { 'x-user-email': this.userEmail }),
        },
        body: JSON.stringify(eventData),
        // Use keepalive to ensure tracking works even on page unload
        keepalive: true,
      }).catch((error) => {
        // Silently fail - don't disrupt user experience
        console.debug('Analytics tracking failed:', error);
      });
    } catch (error) {
      console.debug('Analytics error:', error);
    }
  }

  // Convenience methods for common events
  public trackButtonClick(buttonText: string, metadata?: Record<string, any>) {
    this.track({
      eventType: 'button_click',
      eventName: 'button_click',
      elementText: buttonText,
      elementType: 'button',
      metadata,
    });
  }

  public trackLinkClick(linkText: string, href: string, metadata?: Record<string, any>) {
    this.track({
      eventType: 'link_click',
      eventName: 'link_click',
      elementText: linkText,
      elementType: 'a',
      metadata: { href, ...metadata },
    });
  }

  public trackFormSubmit(formName: string, metadata?: Record<string, any>) {
    this.track({
      eventType: 'form_submit',
      eventName: 'form_submit',
      elementText: formName,
      metadata,
    });
  }

  public trackCustomEvent(eventName: string, metadata?: Record<string, any>) {
    this.track({
      eventType: 'custom',
      eventName,
      metadata,
    });
  }

  // A/B testing support
  public trackExperiment(experimentId: string, variantId: string, metadata?: Record<string, any>) {
    this.track({
      eventType: 'custom',
      eventName: 'experiment_view',
      experimentId,
      variantId,
      metadata,
    });
  }

  public disable() {
    this.enabled = false;
  }

  public enable() {
    this.enabled = true;
  }
}

// Create singleton instance
const analytics = new Analytics();

// Export for use throughout the app
export default analytics;

// Export convenience functions
export const trackEvent = (options: TrackEventOptions) => analytics.track(options);
export const trackButtonClick = (buttonText: string, metadata?: Record<string, any>) => 
  analytics.trackButtonClick(buttonText, metadata);
export const trackLinkClick = (linkText: string, href: string, metadata?: Record<string, any>) => 
  analytics.trackLinkClick(linkText, href, metadata);
export const trackFormSubmit = (formName: string, metadata?: Record<string, any>) => 
  analytics.trackFormSubmit(formName, metadata);
export const trackCustomEvent = (eventName: string, metadata?: Record<string, any>) => 
  analytics.trackCustomEvent(eventName, metadata);
export const trackExperiment = (experimentId: string, variantId: string, metadata?: Record<string, any>) => 
  analytics.trackExperiment(experimentId, variantId, metadata);
export const setAnalyticsUser = (userId: string, userEmail?: string) => 
  analytics.setUser(userId, userEmail);
export const clearAnalyticsUser = () => analytics.clearUser();

