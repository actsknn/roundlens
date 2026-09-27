import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Ajay", exact: true }).waitFor();
  assert.equal(await page.locator(".stat").count(), 5);
  assert.equal(await page.locator(".match-table tbody tr").count(), 10);
  assert.equal(await page.locator(".recharts-line-curve").count(), 1);
  assert.match(await page.locator(".stat-strip").innerText(), /60%/);
  await page
    .locator(".history-panel")
    .getByRole("button", { name: "WINS", exact: true })
    .click();
  assert.equal(await page.locator(".match-table .loss").count(), 0);
  await page
    .locator(".history-panel")
    .getByRole("button", { name: "Next" })
    .click();
  assert.equal(await page.locator(".match-table tbody tr").count(), 2);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download example CSV" }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  assert.equal(csv.split("\r\n").length, 21);
  const headers = csv.split("\r\n")[0];
  const upload = page.getByLabel("Upload match CSV");
  await upload.setInputFiles({
    name: "two-matches.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      headers +
        "\n2026-09-01,Haven,Neon,W,13,8,30,10,5,300,6,2,35\n2026-09-02,Bind,Jett,L,9,13,10,20,3,100,2,6,20",
    ),
  });
  await page
    .getByRole("status")
    .filter({ hasText: "Imported 2 matches" })
    .waitFor();
  assert.match(await page.locator(".stat-strip").innerText(), /50%/);
  assert.match(await page.locator(".stat-strip").innerText(), /1\.33/);
  assert.match(await page.locator(".stat-strip").innerText(), /200/);
  assert.equal(await page.locator(".match-table tbody tr").count(), 2);
  await upload.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("bad,data"),
  });
  await page.getByRole("alert").waitFor();
  assert.equal(await page.locator(".match-table tbody tr").count(), 2);
  await page.getByRole("button", { name: "Load Demo Data" }).click();
  await page.getByRole("status").filter({ hasText: "Loaded 20" }).waitFor();
  await page.screenshot({
    path: process.argv[3] + "/roundlens-desktop.png",
    fullPage: true,
  });
  for (const width of [1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const size = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      size.scroll <= size.viewport,
      `Horizontal overflow at ${width}: ${JSON.stringify(size)}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: process.argv[3] + "/roundlens-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: demo, chart, filters, pagination, CSV download/upload/errors, and 5 responsive widths. No console errors.",
  );
} finally {
  await browser.close();
}
