import mongoose, { Document, Model, Schema } from "mongoose";
import { logInfo, logWarn } from "../../helpers/logger.js";

interface DatabaseDocument extends Document {
  key: string;
  value: any;
}

const DatabaseSchema = new Schema<DatabaseDocument>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
});

/**
 * MongoDB Database class for managing data in MongoDB.
 * This class provides methods to set, get, add, subtract, delete, and manipulate data stored in MongoDB.
 * It supports nested keys using dot notation and handles various data types including strings, numbers, booleans, and objects.
 * It also includes methods for checking existence, pushing and unpushing values in arrays, and deleting all data with a confirmation message.
 * @example
 * ```ts
 * // CommonJS
 * const { MongoDatabase } = require("softlance");
 * // ES Module
 * import { MongoDatabase } from "softlance";
 *
 * // Create a new database instance
 * const db = new MongoDatabase(
 * "mongodb://localhost:27017/mydb", // MongoDB URI
 * "myCollection", // Collection name
 * true // Enable console logging
 * )
 * ```
 */
export class MongoDatabase {
  private consoleLog: boolean;
  private uri: string;
  private collectionName: string;
  private connected: boolean = false;
  private model: Model<DatabaseDocument> | null = null;

  constructor(uri: string, collectionName: string = "database", consoleLog: boolean = false) {
    this.uri = uri;
    this.collectionName = collectionName;
    this.consoleLog = consoleLog;
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri);
      this.model = mongoose.model<DatabaseDocument>(this.collectionName, DatabaseSchema);
      this.connected = true;
      logInfo(`Connected to MongoDB at ${this.uri}`);
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private checkConnection(): boolean {
    if (!this.connected || !this.model) {
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

  private setNestedValue(obj: any, path: string[], value: any): any {
    if (path.length === 1) {
      obj[path[0]] = value;
      return obj;
    }

    const [first, ...rest] = path;
    if (!obj[first] || typeof obj[first] !== "object") {
      obj[first] = {};
    }
    this.setNestedValue(obj[first], rest, value);
    return obj;
  }

  private getNestedValue(obj: any, path: string[]): any {
    let current = obj;
    for (const key of path) {
      if (current == null || typeof current !== "object" || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  async set(key: string, value: string | number | boolean | object): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }

    try {
      const keys = key.split(".");
      let document = await this.model!.findOne({ key: keys[0] });

      if (!document) {
        const newValue: Record<string, any> = {};
        this.setNestedValue(newValue, keys, value);
        document = new this.model!({ key: keys[0], value: newValue[keys[0]] });
      } else {
        const updatedValue = document.value || {};
        this.setNestedValue({ [keys[0]]: updatedValue }, keys, value);
        document.value = updatedValue;
      }

      await document.save();

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

  async get(key: string): Promise<string | number | boolean | object | undefined> {
    if (!this.checkConnection()) return undefined;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return undefined;
    }

    try {
      const keys = key.split(".");
      const document = await this.model!.findOne({ key: keys[0] });

      if (!document) {
        logWarn(`Key "${key}" not found in the database.`);
        return undefined;
      }

      const value = this.getNestedValue({ [keys[0]]: document.value }, keys);

      if (value === undefined) {
        logWarn(`Key "${key}" not found in the database.`);
        return undefined;
      }

      if (this.consoleLog) {
        logInfo(`Retrieved value for key "${key}" successfully.`);
      }

      return value;
    } catch (error) {
      logWarn(
        `Failed to get key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return undefined;
    }
  }

  async getAll(): Promise<Record<string, any>> {
    if (!this.checkConnection()) return {};

    try {
      const documents = await this.model!.find({});
      const result: Record<string, any> = {};

      for (const doc of documents) {
        result[doc.key] = doc.value;
      }

      if (this.consoleLog) {
        logInfo("Retrieved all data from the database successfully.");
      }

      return result;
    } catch (error) {
      logWarn(
        `Failed to get all data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {};
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.checkConnection()) return false;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return false;
    }

    try {
      const keys = key.split(".");
      const document = await this.model!.findOne({ key: keys[0] });

      if (!document) return false;

      const value = this.getNestedValue({ [keys[0]]: document.value }, keys);
      return value !== undefined;
    } catch (error) {
      logWarn(
        `Failed to check existence of key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  async add(key: string, value: number): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (typeof value !== "number") {
      logWarn("Invalid value provided. Value must be a number.");
      return;
    }

    try {
      const currentValue = await this.get(key);

      if (currentValue === undefined) {
        await this.set(key, value);
        if (this.consoleLog) {
          logInfo(`Created new key "${key}" and set value to ${value}.`);
        }
      } else if (typeof currentValue !== "number") {
        logWarn(`Key "${key}" is not a number, cannot add.`);
        return;
      } else {
        await this.set(key, currentValue + value);
        if (this.consoleLog) {
          logInfo(`Added ${value} to key "${key}" successfully.`);
        }
      }
    } catch (error) {
      logWarn(
        `Failed to add value to key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async subtract(key: string, value: number): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (typeof value !== "number") {
      logWarn("Invalid value provided. Value must be a number.");
      return;
    }

    try {
      const currentValue = await this.get(key);

      if (currentValue === undefined) {
        await this.set(key, -value);
        if (this.consoleLog) {
          logInfo(`Created new key "${key}" and set value to ${-value}.`);
        }
      } else if (typeof currentValue !== "number") {
        logWarn(`Key "${key}" is not a number, cannot subtract.`);
        return;
      } else {
        await this.set(key, currentValue - value);
        if (this.consoleLog) {
          logInfo(`Subtracted ${value} from key "${key}" successfully.`);
        }
      }
    } catch (error) {
      logWarn(
        `Failed to subtract value from key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }

    try {
      const keys = key.split(".");
      
      if (keys.length === 1) {
        const result = await this.model!.deleteOne({ key: keys[0] });
        if (result.deletedCount > 0) {
          if (this.consoleLog) {
            logInfo(`Deleted key "${key}" successfully.`);
          }
        } else {
          logWarn(`Key "${key}" does not exist.`);
        }
      } else {
        const document = await this.model!.findOne({ key: keys[0] });
        if (!document) {
          logWarn(`Key "${key}" does not exist.`);
          return;
        }

        const obj = { [keys[0]]: document.value };
        const parentPath = keys.slice(0, -1);
        const finalKey = keys[keys.length - 1];
        const parent = this.getNestedValue(obj, parentPath);

        if (parent && typeof parent === "object" && finalKey in parent) {
          delete parent[finalKey];
          document.value = obj[keys[0]];
          await document.save();
          
          if (this.consoleLog) {
            logInfo(`Deleted key "${key}" successfully.`);
          }
        } else {
          logWarn(`Key "${key}" does not exist.`);
        }
      }
    } catch (error) {
      logWarn(
        `Failed to delete key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deleteAll(
    approve:
      | "Tüm verilerimin silineceğini kabul ediyor ve bu işlemle ilgili tüm sorumluluğun tarafıma ait olduğunu beyan ediyorum."
      | "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
  ): Promise<void> {
    if (!this.checkConnection()) return;

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
      await this.model!.deleteMany({});
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

  async push(key: string, value: string | number | boolean | object): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }

    try {
      const currentValue = await this.get(key);

      if (!currentValue || !Array.isArray(currentValue)) {
        await this.set(key, [value]);
      } else {
        currentValue.push(value);
        await this.set(key, currentValue);
      }

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

  async pull(key: string, value: string | number | boolean | object): Promise<void> {
    if (!this.checkConnection()) return;

    if (!key || typeof key !== "string") {
      logWarn("Invalid key provided. Key must be a non-empty string.");
      return;
    }
    if (value === undefined) {
      logWarn("Invalid value provided. Value cannot be undefined.");
      return;
    }

    try {
      const currentValue = await this.get(key);

      if (!currentValue || !Array.isArray(currentValue)) {
        logWarn(`Key "${key}" is not an array.`);
        return;
      }

      let removedCount = 0;

      for (let i = currentValue.length - 1; i >= 0; i--) {
        let shouldRemove = false;

        if (typeof value === "object" && value !== null) {
          if (this.deepEqual(currentValue[i], value) || this.partialMatch(currentValue[i], value)) {
            shouldRemove = true;
          }
        } else {
          if (currentValue[i] === value) {
            shouldRemove = true;
          }
        }

        if (shouldRemove) {
          currentValue.splice(i, 1);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await this.set(key, currentValue);
        if (this.consoleLog) {
          logInfo(`Unpushed ${removedCount} item(s) from key "${key}" successfully.`);
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

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.connected = false;
      logInfo("Disconnected from MongoDB.");
    } catch (error) {
      logWarn(`Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
