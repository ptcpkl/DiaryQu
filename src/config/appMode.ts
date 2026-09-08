// Frontend demo mode is intentionally limited to development builds.
// Release builds must use the real authentication/backend path so demo data
// can never leak into production behavior.
export const FRONTEND_DEMO_MODE = __DEV__;
