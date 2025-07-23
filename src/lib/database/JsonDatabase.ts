import { error, logInfo, logWarn } from "../../helpers/logger.js";
import path from "path";
import fs from "fs";

/**
 * JSON Database class for managing a JSON file as a database.
 * This class provides methods to set, get, add, subtract, delete, and manipulate data stored in a JSON file.
 * It supports nested keys using dot notation and handles various data types including strings, numbers, booleans, and objects.
 * It also includes methods for checking existence, pushing and unpushing values in arrays, and deleting all data with a confirmation message.
 * The class ensures that the database file is writable and exists, and it provides console logging for operations if enabled.
 * @example
 * ```ts
 * // CommonJS
 * const { JsonDatabase } = require("softlance");
 * // ES Module
 * import { JsonDatabase } from "softlance";
 *
 * // Create a new database instance
 * const db = new JsonDatabase(
 * "database", // Folder
 * "database.json", // File
 * "true" // Enable console logging
 * )
 * ```
 */
export class JsonDatabase {
  private databasePath: string;
  private consoleLog: boolean;
  private connected: boolean = false;

  constructor(
    folderPath?: string,
    filePath?: string,
    consoleLog: boolean = false
  ) {
    this.consoleLog = consoleLog;
    if (folderPath && filePath) {
      if (!fs.existsSync(folderPath)) {
        logWarn(`Database folder does not exist: ${folderPath}`);
        fs.mkdirSync(folderPath, { recursive: true });
      }
      if (!fs.existsSync(path.join(folderPath, filePath))) {
        logWarn(`Database file does not exist: ${filePath}`);
        fs.writeFileSync(path.join(folderPath, filePath), JSON.stringify({}));
      }
      if (!fs.statSync(folderPath).isDirectory()) {
        throw new Error(`Provided path is not a directory: ${folderPath}`);
      }
      if (!fs.statSync(path.join(folderPath, filePath)).isFile()) {
        throw new Error(`Provided path is not a file: ${filePath}`);
      }
      if (!filePath.endsWith(".json")) {
        throw new Error(`Database file must be a JSON file: ${filePath}`);
      }
      try {
        fs.accessSync(folderPath, fs.constants.W_OK);
      } catch (err) {
        throw new Error(`No write permission for folder: ${folderPath}`);
      }
      this.databasePath = path.join(process.cwd(), folderPath, filePath);
    } else {
      logWarn("No folder or file path provided, using default database path.");
      if (!fs.existsSync(path.join(process.cwd(), "database"))) {
        fs.mkdirSync(path.join(process.cwd(), "database"), { recursive: true });
      }
      if (
        !fs.existsSync(path.join(process.cwd(), "database", "database.json"))
      ) {
        fs.writeFileSync(
          path.join(process.cwd(), "database", "database.json"),
          JSON.stringify({})
        );
      }
      try {
        fs.accessSync(
          path.join(process.cwd(), "database", "database.json"),
          fs.constants.W_OK
        );
      } catch (err) {
        error(`No write permission for file: database.json`);
      }
      if (
        !fs.statSync(path.join(process.cwd(), "database")).isDirectory() ||
        !fs
          .statSync(path.join(process.cwd(), "database", "database.json"))
          .isFile()
      ) {
        error(
          `Default database path is not a valid directory or file: ${path.join(
            process.cwd(),
            "database",
            "database.json"
          )}`
        );
      }
      this.databasePath = path.join(process.cwd(), "database", "database.json");
    }
  }

  connect(): void {
    if (!fs.existsSync(this.databasePath)) {
      logWarn(`Database file does not exist: ${this.databasePath}`);
      fs.writeFileSync(this.databasePath, JSON.stringify({}));
    }
    try {
      fs.accessSync(this.databasePath, fs.constants.W_OK);
    } catch (err) {
      error(`No write permission for database file: ${this.databasePath}`);
    }
    if (!fs.statSync(this.databasePath).isFile()) {
      error(`Provided path is not a file: ${this.databasePath}`);
    }
    if (!this.databasePath.endsWith(".json")) {
      error(`Database file must be a JSON file: ${this.databasePath}`);
    }
    this.connected = true;
    logInfo(`Connected to database at: ${this.databasePath}`);
  }

  private CheckConnection(): boolean {
    if (!this.connected) {
      logWarn("Database not connected. Please call connect() first.");
      process.exit(0);
    }
    return true;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return false;

    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 !== "object") return obj1 === obj2;

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  private partialMatch(target: any, partial: any): boolean {
    if (typeof target !== "object" || typeof partial !== "object") {
      return this.deepEqual(target, partial);
    }

    if (target == null || partial == null) return false;

    const partialKeys = Object.keys(partial);

    for (const key of partialKeys) {
      if (!(key in target)) return false;
      if (!this.deepEqual(target[key], partial[key])) return false;
    }

    return true;
  }

  private ReadDatabase(): Record<string, any> {
    try {
      const data = fs.readFileSync(this.databasePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      logWarn(
        `Failed to read database file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {};
    }
  }

  private WriteDatabase(data: Record<string, any>): void {
    try {
      fs.writeFileSync(
        this.databasePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
      if (this.consoleLog) {
        logInfo(`Database file written successfully: ${this.databasePath}`);
      }
    } catch (error) {
      logWarn(
        `Failed to write to database file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  set(key: string, value: string | number | boolean | object): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      typeof value !== "object"
    ) {
      logWarn(
        "Invalid value type. Value must be a string, number, boolean, or object."
      );
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }
      current[keys[keys.length - 1]] = value;
      this.WriteDatabase(data);
      if (this.consoleLog) {
        logInfo(`Set value for key "${key}" successfully.`);
      }
    } catch (error) {
      logWarn(
        `Failed to set key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  get(key: string): string | number | boolean | object | undefined {
    if (!this.CheckConnection()) return undefined;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return undefined;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;
      for (const k of keys) {
        if (current[k] === undefined) {
          logWarn(`Key "${key}" not found in the database.`);
          return undefined;
        }
        current = current[k];
      }
      if (this.consoleLog) {
        logInfo(`Retrieved value for key "${key}" successfully.`);
      }
      return current;
    } catch (error) {
      logWarn(
        `Failed to get key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return undefined;
    }
  }

  getAll(): Record<string, any> {
    if (!this.CheckConnection()) return {};

    try {
      const data = this.ReadDatabase();
      if (this.consoleLog) {
        logInfo("Retrieved all data from the database successfully.");
      }
      return data;
    } catch (error) {
      logWarn(
        `Failed to get all data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {};
    }
  }

  has(key: string): boolean {
    if (!this.CheckConnection()) return false;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return false;
    }
    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;
      for (const k of keys) {
        if (
          current === null ||
          current === undefined ||
          typeof current !== "object"
        ) {
          return false;
        }
        if (!(k in current)) {
          return false;
        }
        current = current[k];
      }
      return true;
    } catch (error) {
      logWarn(
        `Failed to check existence of key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  add(key: string, value: number): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (typeof value !== "number") {
      logWarn("Invalid value provided. Value must be a number.");
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];
      const currentValue = current[finalKey];

      if (currentValue === undefined) {
        current[finalKey] = 0 + value;
        if (this.consoleLog) {
          logInfo(`Created new key "${key}" and set value to ${value}.`);
        }
      } else if (typeof currentValue !== "number") {
        logWarn(`Key "${key}" is not a number, cannot add.`);
        return;
      } else {
        current[finalKey] = currentValue + value;
        if (this.consoleLog) {
          logInfo(`Added ${value} to key "${key}" successfully.`);
        }
      }

      this.WriteDatabase(data);
    } catch (error) {
      logWarn(
        `Failed to add value to key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  subtract(key: string, value: number): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (typeof value !== "number") {
      logWarn("Invalid value provided. Value must be a number.");
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];
      const currentValue = current[finalKey];

      if (currentValue === undefined) {
        current[finalKey] = 0 - value;
        if (this.consoleLog) {
          logInfo(`Created new key "${key}" and set value to ${-value}.`);
        }
      } else if (typeof currentValue !== "number") {
        logWarn(`Key "${key}" is not a number, cannot subtract.`);
        return;
      } else {
        current[finalKey] = currentValue - value;
        if (this.consoleLog) {
          logInfo(`Subtracted ${value} from key "${key}" successfully.`);
        }
      }

      this.WriteDatabase(data);
    } catch (error) {
      logWarn(
        `Failed to subtract value from key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  delete(key: string): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          logWarn(`Key "${key}" does not exist.`);
          return;
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];
      if (finalKey in current) {
        delete current[finalKey];
        this.WriteDatabase(data);
        if (this.consoleLog) {
          logInfo(`Deleted key "${key}" successfully.`);
        }
      } else {
        logWarn(`Key "${key}" does not exist.`);
      }
    } catch (error) {
      logWarn(
        `Failed to delete key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  deleteAll(
    approve:
      | "Tüm verilerimin silineceğini kabul ediyor ve bu işlemle ilgili tüm sorumluluğun tarafıma ait olduğunu beyan ediyorum."
      | "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
  ) {
    if (!this.CheckConnection()) return;

    if (
      approve !==
        "Tüm verilerimin silineceğini kabul ediyor ve bu işlemle ilgili tüm sorumluluğun tarafıma ait olduğunu beyan ediyorum." &&
      approve !==
        "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
    ) {
      logWarn("Invalid approval message.");
      return;
    }

    try {
      const data = this.ReadDatabase();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          delete data[key];
        }
      }
      this.WriteDatabase(data);
      if (this.consoleLog) {
        logInfo("Deleted all keys successfully.");
      }
    } catch (error) {
      logWarn(
        `Failed to delete all keys: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  push(key: string, value: string | number | boolean | object): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      typeof value !== "object"
    ) {
      logWarn(
        "Invalid value type. Value must be a string, number, boolean, or object."
      );
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];

      if (!current[finalKey] || !Array.isArray(current[finalKey])) {
        current[finalKey] = [];
      }

      current[finalKey].push(value);
      this.WriteDatabase(data);
      if (this.consoleLog) {
        logInfo(`Pushed value to key "${key}" successfully.`);
      }
    } catch (error) {
      logWarn(
        `Failed to push value to key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  unpush(key: string, value: string | number | boolean | object): void {
    if (!this.CheckConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      typeof value !== "object"
    ) {
      logWarn(
        "Invalid value type. Value must be a string, number, boolean, or object."
      );
      return;
    }

    try {
      const data = this.ReadDatabase();
      const keys = key.split(".");
      let current = data;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          logWarn(`Key "${key}" path does not exist.`);
          return;
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];

      if (!current[finalKey] || !Array.isArray(current[finalKey])) {
        logWarn(`Key "${key}" is not an array.`);
        return;
      }

      const array = current[finalKey];
      const initialLength = array.length;
      let removedCount = 0;

      for (let i = array.length - 1; i >= 0; i--) {
        let shouldRemove = false;

        if (typeof value === "object" && value !== null) {
          if (
            this.deepEqual(array[i], value) ||
            this.partialMatch(array[i], value)
          ) {
            shouldRemove = true;
          }
        } else {
          if (array[i] === value) {
            shouldRemove = true;
          }
        }

        if (shouldRemove) {
          current[finalKey].splice(i, 1);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.WriteDatabase(data);
        if (this.consoleLog) {
          logInfo(
            `Unpushed ${removedCount} item(s) from key "${key}" successfully.`
          );
        }
      } else {
        logWarn(`No matching values found in key "${key}".`);
      }
    } catch (error) {
      logWarn(
        `Failed to unpush value from key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
