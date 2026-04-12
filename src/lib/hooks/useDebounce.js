import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDebounce Hook
 * Debounces a value - useful for search inputs, API calls, etc.
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {any} - Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // API call with debouncedSearchTerm
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * Debounces a callback function
 * 
 * @param {function} callback - Callback function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {function} - Debounced callback function
 * 
 * @example
 * const handleSearch = useDebouncedCallback((query) => {
 *   // API call
 * }, 500);
 */
export function useDebouncedCallback(callback, delay = 500) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create debounced function
  const debouncedCallback = useCallback(
    (...args) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * useThrottle Hook
 * Throttles a value - limits how often value updates
 * 
 * @param {any} value - Value to throttle
 * @param {number} limit - Time limit in milliseconds (default: 500)
 * @returns {any} - Throttled value
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 */
export function useThrottle(value, limit = 500) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * useThrottledCallback Hook
 * Throttles a callback function
 * 
 * @param {function} callback - Callback function to throttle
 * @param {number} limit - Time limit in milliseconds (default: 500)
 * @returns {function} - Throttled callback function
 * 
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   // Expensive operation
 * }, 100);
 */
export function useThrottledCallback(callback, limit = 500) {
  const inThrottle = useRef(false);
  const lastRan = useRef(Date.now());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args) => {
      if (!inThrottle.current) {
        callbackRef.current(...args);
        lastRan.current = Date.now();
        inThrottle.current = true;

        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [limit]
  );
}

/**
 * useDebouncedState Hook
 * Combines useState with debouncing
 * Returns both immediate and debounced values
 * 
 * @param {any} initialValue - Initial value
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {[any, any, function]} - [immediateValue, debouncedValue, setValue]
 * 
 * @example
 * const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('', 500);
 */
export function useDebouncedState(initialValue, delay = 500) {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const debouncedValue = useDebounce(immediateValue, delay);

  return [immediateValue, debouncedValue, setImmediateValue];
}

/**
 * useDebouncedEffect Hook
 * Debounced version of useEffect
 * 
 * @param {function} effect - Effect function
 * @param {number} delay - Delay in milliseconds
 * @param {array} deps - Dependencies array
 * 
 * @example
 * useDebouncedEffect(() => {
 *   // API call
 * }, 500, [searchTerm]);
 */
export function useDebouncedEffect(effect, delay, deps) {
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

export default useDebounce;