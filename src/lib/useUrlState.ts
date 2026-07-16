import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Keeps a piece of "what the user pressed" (active tab, filter, etc.) in the URL
// query string instead of local React state, so it survives a page refresh.
// With HashRouter the query lives in the hash (e.g. #/settings?tab=team) and is
// restored on reload. Returns the current value and a setter, mirroring useState.
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          // Drop the param when it matches the default to keep URLs clean.
          if (next === defaultValue) params.delete(key);
          else params.set(key, next);
          return params;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue];
}
