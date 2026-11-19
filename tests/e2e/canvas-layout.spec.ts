import { test, expect } from "@playwright/test";

test("learning and knowledge fill the workspace with a separate right inspector", async ({
  page,
}, info) => {
  for (const [route, surface, inspector] of [
    ["/learn", ".v4-board-scroll", ".v4-tutor"],
    ["/knowledge", ".map-canvas", ".topic-detail"],
  ]) {
    await page.goto(route);
    const main = page.locator("main");
    await expect(page.locator(inspector)).toBeVisible();
    const m = (await main.boundingBox())!;
    const board = (await page.locator(surface).boundingBox())!;
    const panel = (await page.locator(inspector).boundingBox())!;
    expect(board.height).toBeGreaterThan(m.height * 0.65);
    expect(Math.abs(board.x - m.x)).toBeLessThan(2);
    expect(Math.abs(panel.x + panel.width - m.x - m.width)).toBeLessThan(2);
    expect(Math.abs(panel.y - m.y)).toBeLessThan(2);
    expect(Math.abs(panel.y + panel.height - m.y - m.height)).toBeLessThan(2);
    expect(board.x + board.width).toBeLessThanOrEqual(panel.x + 1);
    expect(Math.abs(board.y + board.height - m.y - m.height)).toBeLessThan(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: info.outputPath(route.slice(1) + "-split.png"),
    });
  }
});
