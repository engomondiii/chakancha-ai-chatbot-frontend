import { useState, useEffect, useRef } from 'react';

/**
 * useIntersection Hook
 * Uses Intersection Observer API to detect when element enters viewport
 * Useful for lazy loading, infinite scroll, animations on scroll
 * 
 * @param {object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1, default: 0)
 * @param {string} options.root - Root element (default: null = viewport)
 * @param {string} options.rootMargin - Margin around root (default: '0px')
 * @param {boolean} options.triggerOnce - Only trigger once (default: false)
 * @returns {[React.Ref, boolean, IntersectionObserverEntry]} - [ref, isIntersecting, entry]
 * 
 * @example
 * const [ref, isVisible] = useIntersection({ threshold: 0.5 });
 * 
 * return (
 *   <div ref={ref}>
 *     {isVisible && <ExpensiveComponent />}
 *   </div>
 * );
 */
export function useIntersection({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
} = {}) {
  const [entry, setEntry] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver is not supported in this browser');
      setIsIntersecting(true); // Fallback: assume visible
      return;
    }

    // Callback when intersection changes
    const handleIntersection = (entries) => {
      const [entry] = entries;
      
      setEntry(entry);
      
      // Update intersection state
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        
        if (triggerOnce) {
          hasTriggered.current = true;
          // Disconnect observer after first trigger
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      } else {
        // Only update if not triggerOnce or hasn't triggered yet
        if (!triggerOnce || !hasTriggered.current) {
          setIsIntersecting(false);
        }
      }
    };

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      root,
      rootMargin,
    });

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [elementRef, isIntersecting, entry];
}

/**
 * useInView Hook
 * Simplified version - just returns if element is in view
 * 
 * @param {object} options - Options
 * @returns {[React.Ref, boolean]} - [ref, isInView]
 * 
 * @example
 * const [ref, isInView] = useInView({ threshold: 0.5, triggerOnce: true });
 */
export function useInView(options = {}) {
  const [ref, isIntersecting] = useIntersection(options);
  return [ref, isIntersecting];
}

/**
 * useLazyLoad Hook
 * Specifically for lazy loading images and components
 * Triggers once when element becomes visible
 * 
 * @param {number} threshold - Visibility threshold (default: 0.1)
 * @param {string} rootMargin - Root margin (default: '50px')
 * @returns {[React.Ref, boolean]} - [ref, shouldLoad]
 * 
 * @example
 * const [ref, shouldLoad] = useLazyLoad();
 * 
 * return (
 *   <div ref={ref}>
 *     {shouldLoad ? <img src="full.jpg" /> : <div className="placeholder" />}
 *   </div>
 * );
 */
export function useLazyLoad(threshold = 0.1, rootMargin = '50px') {
  return useIntersection({
    threshold,
    rootMargin,
    triggerOnce: true,
  });
}

/**
 * useInfiniteScroll Hook
 * Detects when user scrolls near bottom of list
 * Useful for infinite scroll pagination
 * 
 * @param {function} callback - Function to call when near bottom
 * @param {boolean} hasMore - Whether there's more content to load
 * @param {boolean} isLoading - Whether currently loading
 * @param {number} threshold - Distance from bottom to trigger (default: 0.8)
 * @returns {React.Ref} - Ref to attach to bottom sentinel element
 * 
 * @example
 * const loadMoreRef = useInfiniteScroll(
 *   () => fetchMoreItems(),
 *   hasMore,
 *   isLoading
 * );
 * 
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={loadMoreRef} />
 *   </div>
 * );
 */
export function useInfiniteScroll(
  callback,
  hasMore = true,
  isLoading = false,
  threshold = 0.8
) {
  const [ref, isIntersecting] = useIntersection({
    threshold,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      callback();
    }
  }, [isIntersecting, hasMore, isLoading, callback]);

  return ref;
}

/**
 * useScrollDirection Hook
 * Detects scroll direction
 * 
 * @returns {string} - 'up', 'down', or null
 * 
 * @example
 * const scrollDirection = useScrollDirection();
 * // Hide header when scrolling down
 */
export function useScrollDirection() {
  const [direction, setDirection] = useState(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current) {
        setDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setDirection('up');
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return direction;
}

/**
 * useOnScreen Hook
 * Simpler alternative that just returns boolean
 * 
 * @param {React.RefObject} ref - Element ref
 * @param {string} rootMargin - Root margin (default: '0px')
 * @returns {boolean} - Whether element is on screen
 * 
 * @example
 * const elementRef = useRef();
 * const isOnScreen = useOnScreen(elementRef);
 */
export function useOnScreen(ref, rootMargin = '0px') {
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);

  return isOnScreen;
}

export default useIntersection;