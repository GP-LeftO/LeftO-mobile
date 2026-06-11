// Full-width web layout: screens receive the real browser window width.
// WEB_FRAME_WIDTH is exported for any component that needs a reference width
// (e.g., OnboardingSlide animation calculations).
export const WEB_FRAME_WIDTH = typeof window !== "undefined" ? window.innerWidth : 1280;
