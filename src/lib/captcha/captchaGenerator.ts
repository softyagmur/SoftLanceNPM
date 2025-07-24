import { createCanvas, registerFont } from "canvas";
import path from "path";
import crypto from "crypto";

interface CaptchaResult {
  buffer: Buffer;
  text: string;
  hash: string;
}

interface CaptchaAttachment {
  attachment: Buffer;
  name: string;
}

function generateSecureCaptchaText(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRTUVWXYZ23467892468";
  let result = "";

  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

function addDistortionEffect(ctx: any, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newImageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const waveX = Math.sin(y * 0.05) * 3;
      const waveY = Math.sin(x * 0.03) * 2;

      const sourceX = Math.max(0, Math.min(width - 1, Math.round(x + waveX)));
      const sourceY = Math.max(0, Math.min(height - 1, Math.round(y + waveY)));

      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * width + x) * 4;

      newImageData.data[targetIndex] = data[sourceIndex];
      newImageData.data[targetIndex + 1] = data[sourceIndex + 1];
      newImageData.data[targetIndex + 2] = data[sourceIndex + 2];
      newImageData.data[targetIndex + 3] = data[sourceIndex + 3];
    }
  }

  ctx.putImageData(newImageData, 0, 0);
}

function addComplexNoise(ctx: any, width: number, height: number): void {
  for (let i = 0; i < 5; i++) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `hsla(${Math.random() * 360}, 50%, 50%, 0.1)`);
    gradient.addColorStop(1, `hsla(${Math.random() * 360}, 50%, 50%, 0.1)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 40%, ${
      0.3 + Math.random() * 0.4
    })`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();

    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const cp1X = Math.random() * width;
    const cp1Y = Math.random() * height;
    const cp2X = Math.random() * width;
    const cp2Y = Math.random() * height;
    const endX = Math.random() * width;
    const endY = Math.random() * height;

    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    ctx.stroke();
  }

  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `hsla(${Math.random() * 360}, 80%, 60%, ${
      0.2 + Math.random() * 0.6
    })`;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2;
    ctx.fillRect(x, y, size, size);
  }
}

function addGeometricShapes(ctx: any, width: number, height: number): void {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `hsla(${Math.random() * 360}, 60%, 50%, 0.15)`;
    ctx.strokeStyle = `hsla(${Math.random() * 360}, 80%, 40%, 0.3)`;
    ctx.lineWidth = 1 + Math.random();

    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 5 + Math.random() * 15;

    ctx.beginPath();
    if (Math.random() > 0.5) {
      ctx.arc(x, y, size, 0, Math.PI * 2);
    } else {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  }
}

try {
  const fontPath = path.join(__dirname, "fonts", "arial.ttf");
  registerFont(fontPath, { family: "Arial" });
} catch (error) {
  console.warn("Custom font could not be loaded, using default font");
}

export function captchaGenerator(): CaptchaResult {
  const width = 280;
  const height = 120;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const text = generateSecureCaptchaText(6);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#16213e");
  gradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  addComplexNoise(ctx, width, height);
  addGeometricShapes(ctx, width, height);

  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textBaseline = "middle";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    const hue = (i * 60 + Math.random() * 30) % 360;
    ctx.fillStyle = `hsl(${hue}, 85%, 75%)`;
    ctx.strokeStyle = `hsl(${hue}, 95%, 60%)`;
    ctx.lineWidth = 1;

    const angle = (Math.random() - 0.5) * 0.8;
    const x = 25 + i * 40 + (Math.random() - 0.5) * 20;
    const y = height / 2 + (Math.random() - 0.5) * 30;

    const scale = 0.8 + Math.random() * 0.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(char, 0, 0);
    ctx.strokeText(char, 0, 0);
    ctx.restore();
  }

  addDistortionEffect(ctx, width, height);

  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 80%, 0.1)`;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;
    ctx.fillRect(x, y, size, size);
  }

  const hash = crypto
    .createHash("sha256")
    .update(text + Date.now().toString())
    .digest("hex");

  return {
    buffer: canvas.toBuffer("image/png"),
    text: text,
    hash: hash,
  };
}

export function captchaGeneratorForDiscord(): CaptchaAttachment & {
  text: string;
  hash: string;
} {
  const result = captchaGenerator();

  return {
    attachment: result.buffer,
    name: `captcha_${Date.now()}.png`,
    text: result.text,
    hash: result.hash,
  };
}

export function verifyCaptcha(
  userInput: string,
  originalText: string
): boolean {
  if (!userInput || !originalText) return false;

  return userInput.toUpperCase().trim() === originalText.toUpperCase().trim();
}

export function captchaGeneratorWithDifficulty(
  difficulty: "easy" | "medium" | "hard" = "medium"
): CaptchaResult {
  const settings = {
    easy: { length: 4, noise: 0.3 },
    medium: { length: 6, noise: 0.6 },
    hard: { length: 8, noise: 1.0 },
  };

  settings[difficulty];

  return captchaGenerator();
}
