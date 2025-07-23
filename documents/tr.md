# 🌍 Türkçe kılavuza hoş geldiniz!

**✨ Sürüm 1.0.0-beta.32**
```bash
npm i softlance
```
**Not:** Bu bir beta sürümüdür. Hatalar olabilir.

# ⏰ Uzun süreli planlar
- Şu anlık yok.

# 🚀 Yenilikler
- JsonDatabase eklendi.
- Express sunucuları için koruma sistemileri (hashPassword,comparePassword,rateLimiter).
- Express modüler yapı (softify,start).

# 🧰 Hata düzeltmeleri
- Şu anlık yok.

# 🏅 Express sistemleri (Ana Dosya)

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

Örnek kod:

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

# 📦 Modülün içeriği

- Not: **routes** ve **manage** sınıflarının dosya dışına aktarımı varsayılan aktarım olarak ayarlanmalıdır.
# 📁 Dosya yapıları
## 💡 Manage dosyası (JSON)

```json
[
  {
    "name": "hello",
    "route": "/hello",
    "method": "get"
  }
]
```

**name** -> Oluşturulacak dosya ismi **(örnek: routes/hello.js)**
**route** -> API link **(örnek: https://exampleapi.com/hello)**
**method** -> Metot **(örnek: get,post,delete,put,patch)**

## 🗝️ Routes dosyası

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

# 🏅 Veritabanı sistemleri (JSON)

CommonJS:

```js
const { JsonDatabase } = require("softlance"); //* npm install softlance
```

ESM:

```ts
import { JsonDatabase } from "softlance"; //* npm install sofltance
```

Örnek kod:

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
  "Tüm verilerimin silineceğini kabul ediyor ve bu işlemle ilgili tüm sorumluluğun tarafıma ait olduğunu beyan ediyorum."
); // output: true
```

# 📦 Modülün içeriği

- Not: **database** sınıflarının dosya dışına aktarımı varsayılan aktarım olarak ayarlanmalıdır.

# 🪰 Hata mı Buldun?
- 📱 Bana ulaşmak istiyorsanız [discord](https://discord.com/users/1390739558085300264) üzerinden ulaşabilirsiniz!