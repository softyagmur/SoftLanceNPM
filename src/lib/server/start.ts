import { logError, logInfo } from "../../helpers/logger.js";
import { Express } from "express";

/**
 * Start the Express application.
 * @param app Express application instance
 * @param port Port number to listen on
 * @param message Message to log when the server starts
 * @example
 * ```ts
 * // CommonJS
 * const { start } = require("softlance");
 * const express = require("express");
 * // ES Module
 * import express from "express";
 * import { start } from "softlance";
 * 
 * // Create an Express application and start it
 * const app = express();
 * start(app, 3000, "Server is running on port {port}");
 */
export function start(app: Express, port: number, message: string) {
  try {
    app.listen(port, () => {
      logInfo(`${message.replace("{port}", port.toString())}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to start the server: ${error.message}`);
    } else {
      logError(`Failed to start the server: ${String(error)}`);
    }
  }
}
