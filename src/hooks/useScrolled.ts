import { useEffect, useState } from 'react';

/** True once the page has scrolled past the given offset (drives the frosted header). */
export function useScrolled(offset = 4): boolean {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return isScrolled;
}
