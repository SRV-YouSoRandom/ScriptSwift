import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Standard mobile breakpoint (md in Tailwind)

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false); // Default to false or a sensible server-side default

  React.useEffect(() => {
    // Initial check
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkDevice(); // Call on mount

    // Listener for window resize
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return isMobile;
}
