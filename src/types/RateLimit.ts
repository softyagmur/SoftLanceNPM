export default interface RateLimitOptions {
  windowMs: number;
  limit: number;
  standardHeaders?: "draft-6" | "draft-7" | "draft-8";
  legacyHeaders?: boolean;
  ipv6Subnet?: number;
  autoCleanup?: boolean;
  cleanupIntervalMs?: number;
}
