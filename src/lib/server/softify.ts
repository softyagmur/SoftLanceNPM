import type { Express, RequestHandler } from "express";
import { logError, logInfo, logWarn } from "../../helpers/logger.js";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

export interface RouteDef {
  name: string;
  route: string;
  method: "get" | "post" | "put" | "delete" | "patch";
}

async function loadModule(filePath: string): Promise<any> {
  const ext = path.extname(filePath);
  const isESM = [".mjs", ".ts"].includes(ext) || ext === ".js";

  try {
    if (isESM) {
      return await import(pathToFileURL(filePath).href);
    } else {
      return require(filePath);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Softify an Express application by loading routes and applying middleware.
 * @param app - The Express application instance.
 * @param options - Configuration options for softify.
 * @returns A promise that resolves when softify is complete.
 * @example
 * ```ts
 * // CommonJS
 * const { softify } = require("softlance");
 * const express = require("express");
 * 
 * // ES Module
 * import { softify } from "softlance";
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

export async function softify(
  app: Express,
  options: {
    routeFolder: string;
    manageFile: string;
    rateLimiters?: Record<string, RequestHandler>;
  }
): Promise<void> {
  const managePath = path.resolve(options.manageFile);
  let routes: RouteDef[] = [];

  try {
    const fileContent = fs.readFileSync(managePath, "utf-8");
    routes = JSON.parse(fileContent) as RouteDef[];
  } catch (error) {
    logError(
      `Failed to read or parse manage file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return;
  }

  for (const route of routes) {
    const possibleExtensions = [".ts", ".js", ".mjs", ".cjs"];
    let filePath: string | null = null;

    for (const ext of possibleExtensions) {
      const tryPath = path.join(
        path.resolve(options.routeFolder),
        `${route.name}${ext}`
      );
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        break;
      }
    }

    if (!filePath) {
      logWarn(`Route file not found for: ${route.name}`);
      continue;
    }

    let routeModule: any;
    try {
      routeModule = await loadModule(filePath);
    } catch (error) {
      logError(`Failed to load route module: ${filePath}\n${error}`);
      continue;
    }

    const handler: RequestHandler | undefined =
      typeof routeModule === "function"
        ? routeModule
        : typeof routeModule.run === "function"
        ? routeModule.run
        : typeof routeModule.default === "function"
        ? routeModule.default
        : typeof routeModule.default?.run === "function"
        ? routeModule.default.run
        : undefined;

    if (!handler) {
      logWarn(`No valid handler found in: ${filePath}`);
      continue;
    }

    const limiter = options.rateLimiters?.[route.route];

    const args = limiter ? [limiter, handler] : [handler];
    switch (route.method.toLowerCase()) {
      case "get":
        app.get(route.route, ...args);
        break;
      case "post":
        app.post(route.route, ...args);
        break;
      case "put":
        app.put(route.route, ...args);
        break;
      case "delete":
        app.delete(route.route, ...args);
        break;
      case "patch":
        app.patch(route.route, ...args);
        break;
      default:
        logWarn(`Unsupported HTTP method: ${route.method}`);
        continue;
    }

    logInfo(`Route loaded: [${route.method.toUpperCase()}] ${route.route}`);
  }
}
