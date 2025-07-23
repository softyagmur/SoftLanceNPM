import { NextFunction, Request, Response } from "express";
import RateLimitOptions from "../../types/RateLimit.js";

type RequestLog = number[];

const ipStore: Map<string, RequestLog> = new Map();

/**
 * Rate limit middleware for Express applications.
 * This middleware limits the number of requests from a single IP address within a specified time window.
 * @param {RateLimitOptions} options - Configuration options for the rate limiter.
 * @param {number} options.windowMs - The time window in milliseconds for rate limiting.
 * @param {number} options.limit - The maximum number of requests allowed within the time window.
 * @param {string} [options.standardHeaders="draft-6"] - The standard headers to use for rate limiting information.
 * @param {boolean} [options.legacyHeaders=true] - Whether to use legacy headers for rate limiting information.
 * @param {boolean} [options.autoCleanup=true] - Whether to automatically clean up expired requests.
 * @param {number} [options.cleanupIntervalMs=60000] - The interval in milliseconds for cleaning up expired requests.
 * @example
 * ```ts
 * // CommonJS
 * const { rateLimit, softify } = require("softlance");
 * const express = require("express");
 * 
 * // ES Module
 * import { rateLimit, softify } from "softlance";
 * import express from "express";
 *
 * // Add main file to your express app
 * softify(express(), {
 *   routeFolder: "./routes",
 *   manageFile: "./manage.json",
 *   rateLimiters: {
 *     "/": rateLimit({ windowMs: 6000, limit: 100 }), // 100 requests per 6 seconds
 *   }
 * });
 * ```
 */

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    limit,
    standardHeaders = "draft-6",
    legacyHeaders = true,
    autoCleanup = true,
    cleanupIntervalMs = 60_000,
  } = options;

  if (autoCleanup) {
    setInterval(() => {
      const now = Date.now();

      for (const [ip, timestamps] of ipStore.entries()) {
        const valid = timestamps.filter((t) => now - t < windowMs);

        if (valid.length === 0) {
          ipStore.delete(ip);
        } else {
          ipStore.set(ip, valid);
        }
      }
    }, cleanupIntervalMs);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip as string;

    if (!ipStore.has(ip)) {
      ipStore.set(ip, []);
    }

    const timestamps = ipStore.get(ip)!.filter((t) => now - t < windowMs);
    timestamps.push(now);
    ipStore.set(ip, timestamps);

    const remaining = limit - timestamps.length;

    if (legacyHeaders) {
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil((timestamps[0] + windowMs) / 1000)
      );
    }

    if (standardHeaders === "draft-7" || standardHeaders === "draft-8") {
      const resetSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.setHeader(
        "RateLimit",
        `limit=${limit}, remaining=${Math.max(
          0,
          remaining
        )}, reset=${resetSeconds}`
      );
    }

    if (timestamps.length > limit) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    }

    next();
  };
}
