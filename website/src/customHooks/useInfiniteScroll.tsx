import { useState } from 'react';
/**
 * @params
 * start - The starting number of elements to be rendered
 * pace - The subsequent number of elements to be rendered
 */
export default (start: number = 10, pace: number = 10): number => {
  const [limit, setLimit] = useState<number>(start);
  window.onscroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop ===
      document.documentElement.offsetHeight
    ) {
      setLimit(limit + pace);
    }
  };
  return limit;
};
