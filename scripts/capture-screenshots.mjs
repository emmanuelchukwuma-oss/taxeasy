import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "screenshots");
await fs.mkdir(outputDir, { recursive: true });

const pages = await fetch("http://127.0.0.1:9222/json/list").then((response) =>
  response.json()
);
const page = pages.find((item) => item.type === "page");

if (!page) {
  throw new Error("No Chrome DevTools page found on port 9222.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
let commandId = 0;
const pending = new Map();

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(JSON.stringify(message.error)));
  else resolve(message.result);
});

await new Promise((resolve) => {
  socket.addEventListener("open", resolve, { once: true });
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const evaluate = (expression) =>
  send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

const clickText = async (text, waitMs = 900) => {
  await evaluate(`(() => {
    const target = [...document.querySelectorAll('button')].find((el) =>
      el.textContent.trim().includes(${JSON.stringify(text)})
    );
    if (!target) throw new Error('Button not found: ${text}');
    target.click();
  })()`);
  await wait(waitMs);
};

const capture = async (name) => {
  await wait(500);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  await fs.writeFile(
    path.join(outputDir, `${name}.png`),
    Buffer.from(screenshot.data, "base64")
  );
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
});

await send("Page.navigate", { url: "http://localhost:3001/?demo=true" });
await wait(1800);
await capture("01-home");

await clickText("Upload statement");
await capture("02-upload");

await clickText("Use sample statement", 1200);
await capture("03-review");

await clickText("Calculate from reviewed statement", 1200);
await capture("04-result");

await clickText("Proceed to payment");
await evaluate(`(() => {
  const input = document.querySelector('input[placeholder*="BVN"], input[placeholder*="NIN"]');
  input.value = '12345678901';
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await clickText("Verify and continue", 1200);
await clickText("Pay", 2600);
await capture("05-payment-success");

await clickText("View receipt");
await capture("06-receipt");

await clickText("Impact");
await capture("07-transparency");

socket.close();
console.log("Captured TaxEasy screenshots in docs/screenshots");
