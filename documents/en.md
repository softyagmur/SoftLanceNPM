# 🌍 Welcome to the English Guide!

**✨ Version 1.3.0**
```bash
npm i softlance
```

# ⏰ Long-term Plans
- The captcha system will be further strengthened.

# 🚀 What's New
- JsonDatabase added.
- Protection systems for Express servers (hashPassword, comparePassword, rateLimiter).
- Express modular structure (softify, start).

# 🧰 Bug Fixes
- None for now.

# 🏅 Express Systems (Main File)

CommonJS:

```js
const { start, softify, rateLimit } = require("softlance"); //* npm install softlance
const express = require("express"); //* npm install express
```

ESM:

```ts
import { start, softify, rateLimit } from "softlance"; //* npm install softlance
import express from "express"; //* npm install express
```

Example code:

```js
// app.js
const app = express();

app.use(express.json());

softify(app, {
  routeFolder: "./routes", // Route folder path
  manageFile: "./manage.json", // Manage file path
  rateLimiters: {
    "/hello": rateLimit({ windowMs: 1000 * 60 * 15, limit: 25 }), // 25 requests 15 minutes
  },
});

(async () => {
  await start(app, 5000, "Server is running on port {port}"); // Start the server on port 5000
})();
```

```ts
// app.ts
const app = express();

app.use(express.json());

softify(express(), {
  routeFolder: "./routes", // Route folder path
  manageFile: "./manage.json", // Manage file path
  rateLimiters: {
    "/hello": (req, res, next) => {
      const result = rateLimit({ windowMs: 1000 * 60 * 15, limit: 25 })(
        req,
        res,
        next
      );
      if (typeof result === "undefined") return;
      return;
    }, // 25 requests 25 minutes
  },
});

(async () => {
  await start(express(), 5000, "Server is running on port {port}"); // Start the server on port 5000
})();
```

# 📦 Module Contents

- Note: **routes** and **manage** classes should be exported as default.

# 📁 File Structures

## 💡 Manage File (JSON)

```json
[
  {
    "name": "hello",
    "route": "/hello",
    "method": "get"
  }
]
```

**name** -> Name of the file to be created **(example: routes/hello.js)**
**route** -> API link **(example: https://exampleapi.com/hello)**
**method** -> Method **(example: get, post, delete, put, patch)**

## 🗝️ Routes File

```js
// routes/hello.js
module.exports = {
  /**
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  run: (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Hello, world!",
      timestamp: new Date().toISOString(),
    });
  },
};
```

```ts
// routes/hello.ts
import type { Request, Response } from "express"; //* npm install express

export function run(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Hello, world!",
    timestamp: new Date().toISOString(),
  });
}
```

# 🏅 Database Systems (JSON)

CommonJS:

```js
const { JsonDatabase } = require("softlance"); //* npm install softlance
```

ESM:

```ts
import { JsonDatabase } from "softlance"; //* npm install softlance
```

Example code:

```ts
const db = new JsonDatabase(
  "database", // Folder path
  "data.json", // File name
  true // ConsoleLog function enabled
);

db.connect(); // Connect to the database

db.set("helloWorld", "hello!"); // output: "hello!"
db.set("user.data", { name: "YagmurSoftware", age: 21 }); // output: { name: "YagmurSoftware", age: 21 }

db.get("helloWorld"); // output: "hello!"
db.get("user.data"); // output: { name: "YagmurSoftware", age: 21 }
db.get("user.data.name"); // output: "YagmurSoftware"
db.get("user.data.age"); // output: 21
db.get("user.data.nonExistent"); // output: undefined

db.has("helloWorld"); // output: true
db.has("user.data"); // output: true
db.has("user.data.name"); // output: true
db.has("user.data.age"); // output: true
db.has("user.data.nonExistent"); // output: false

db.delete("helloWorld"); // output: true
db.delete("user.data.name"); // output: true
db.delete("user.data.nonExistent"); // output: false

db.getAll(); // output: { user: { data: { age: 21 } } }

db.add("user.data.age", 1); // output: 22
db.subtract("user.data.age", 1); // output: 21

db.push("user.data.hobbies", "coding"); // output: ["coding"]
db.push("user.data.hobbies", "gaming"); // output: ["coding", "gaming"]
db.pull("user.data.hobbies", "coding"); // output: ["gaming"]

db.deleteAll(
  "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
); // output: true

// or

db.deleteAll(
  "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
); // output: true
```

# 📦 Module Contents

- Note: **database** classes should be exported as default.

# 🏅 Database Systems (Mongo)

CommonJS:

```js
const { MongoDatabase } = require("softlance"); //* npm install softlance
```

ESM:

```ts
import { MongoDatabase } from "softlance"; //* npm install softlance
```

Example code:

```ts
const db = new MongoDatabase(
  "your_mongo_uri", // Mongo URI
  "collection_name", // Collection Name
  true // ConsoleLog enabled
);

(async () => {
  await db.connect();
  await db.set("helloWorld", "hello!"); // output: "hello!"
  await db.set("user.data", { name: "YagmurSoftware", age: 21 }); // output: {name:"YagmurSoftware", age: 21}

  await db.get("helloWorld"); // output: "hello!"
  await db.get("user.data"); // output: {name:"YagmurSoftware", age: 21}
  await db.get("user.data.name"); // output: "YagmurSoftware"
  await db.get("user.data.age"); // output: 21
  await db.get("user.data.nonExistentField"); // output: undefined

  await db.has("helloWorld"); // output: true
  await db.has("user.data"); // output: true
  await db.has("user.data.name"); // output: true
  await db.has("user.data.age"); // output: true
  await db.has("user.data.nonExistentField"); // output: false
  await db.has("nonExistentKey"); // output: false

  await db.delete("helloWorld"); // output: true
  await db.delete("user.data.name"); // output: true
  await db.delete("user.data.age"); // output: true
  await db.delete("user.data.nonExistentField"); // output: false
  await db.delete("nonExistentKey"); // output: false

  await db.getAll(); // output: {}

  await db.add("newKey", 100); // output: 100
  await db.add("newKey", 50); // output: 150
  await db.subtract("newKey", 30); // output: 120

  await db.push("user.data.hobbies", "coding"); // output: ["coding"]
  await db.push("user.data.hobbies", "gaming"); // output: ["coding", "gaming"]
  await db.push("user.data.hobbies", "reading"); // output: ["coding", "gaming", "reading"]
  await db.pull("user.data.hobbies", "reading"); // output: ["coding", "gaming"]
  await db.deleteAll(
    "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
  ); // output: true
  await db.deleteAll(
    "I acknowledge that all my data will be deleted and declare that I am solely responsible for this process."
  ); // output: true
})();
```

# 📦 Module Contents
- Note: **database** classes should be exported as default.

# 🏅 Captcha System (Main File)

CommonJS:

```js
const { captchaGeneratorForDiscord } = require("softlance"); //* npm install softlance
```

ESM:

```ts
import { captchaGeneratorForDiscord } from "softlance"; //* npm install softlance
```

Example code:

```js
// app.js
client.on("...", async (_) => {
  const captcha = captchaGeneratorForDiscord();

  await _.send({
    content:`Captcha code: ${captcha.text}`,
    files: [
      {
        attachment: captcha.attachment,
        name: captcha.name,
      }
    ]
  })
});
```

```ts
// app.ts
client.on("...", async (_: Message) => {
    const captcha = captchaGeneratorForDiscord();

    if (_.channel && "send" in _.channel) {
      await _.send({
        content: `Captcha code: ${captcha.text}`,
        files: [
          {
            attachment: captcha.attachment,
            name: captcha.name,
          },
        ],
      });
    }
});
```

# 🪰 Found a Bug?
- 📱 If you want to contact me, you can reach me via [discord](https://discord.com/users/1390739558085300264)!