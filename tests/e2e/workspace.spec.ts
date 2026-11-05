import { test, expect } from "@playwright/test";
test("map identity, list practice, topic handoff and record persistence", async ({
  page,
}) => {
  await page.goto("/knowledge?topic=conics");
  await page.getByRole("button", { name: "Tree", exact: true }).click();
  await page.getByRole("button", { name: /ガロア理論 Galois theory/ }).click();
  await expect(page.locator(".topic-detail h2")).toHaveText("ガロア理論");
  await page.getByRole("button", { name: "Graph", exact: true }).click();
  await expect(page.locator(".graph-node.selected")).toContainText(
    "ガロア理論",
  );
  await page
    .locator(".topic-detail")
    .getByRole("link", { name: "演習", exact: true })
    .click();
  await expect(page.locator(".v4-exercise-list article")).toHaveCount(6);
  const problem = page.locator("#problem-galois");
  await problem.getByRole("textbox").fill("√2 の像は x²−2 の根である。");
  await problem.getByRole("button", { name: "提出", exact: true }).click();
  await expect(problem.getByRole("status")).toContainText("自動判定なし");
  await problem.getByRole("link", { name: "Tutor", exact: true }).click();
  await expect(page.getByLabel("トピック", { exact: true })).toHaveValue(
    "galois",
  );
  await page.goto("/progress");
  await expect(page.locator(".attempt-row")).toHaveCount(1);
  await page.locator(".attempt-row summary").click();
  await expect(page.locator(".attempt-body")).toContainText("√2 の像");
  await page.reload();
  await expect(page.locator(".attempt-row")).toHaveCount(1);
});
test("drafts, retry preservation, solution provenance, export and deletion", async ({
  page,
}) => {
  await page.goto("/exercise");
  const problem = page.locator("#problem-conics");
  await problem.getByRole("button", { name: /ヒント/ }).click();
  await problem.getByRole("textbox").fill("2");
  await problem.getByRole("button", { name: "提出", exact: true }).click();
  await expect(problem.getByRole("status")).toContainText("要再検討");
  await problem.getByRole("textbox").fill("-2, 2");
  await problem.getByRole("button", { name: "提出", exact: true }).click();
  await page.goto("/progress");
  await expect(page.locator(".metric").nth(1)).toContainText("1 / 2");
  await page.goto("/exercise");
  await expect(problem.getByRole("textbox")).toHaveValue("-2, 2");
  await problem.getByText("解答例", { exact: true }).click();
  await page.reload();
  await problem.getByRole("button", { name: "提出", exact: true }).click();
  await page.goto("/progress");
  await expect(page.locator(".metric").nth(1)).toContainText("1 / 2");
  await expect(page.locator(".attempt-row")).toHaveCount(3);
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  expect((await download).suggestedFilename()).toBe("iamt-demo-data.json");
  await page.getByRole("button", { name: "このブラウザの記録を削除" }).click();
  await page
    .getByRole("button", { name: "すべて削除する", exact: true })
    .click();
  await page.goto("/progress");
  await expect(page.getByText("まだ、演習の記録はありません。")).toBeVisible();
  await page.goto("/exercise");
  await expect(problem.getByRole("textbox")).toHaveValue("");
});
test("board editing, movement, safe Tutor, language and collapsed navigation persist", async ({
  page,
}) => {
  await page.goto("/learn");
  await page.getByRole("button", { name: "Tutorを閉じる" }).click();
  await page.getByRole("button", { name: "ノートを追加" }).click();
  await page.getByLabel("ノート本文").fill("A saved note");
  const card = page.locator(".v4-card").last();
  const before = await card.evaluate((e) => e.getAttribute("style"));
  await card.getByRole("button", { name: /移動/ }).focus();
  await page.keyboard.press("ArrowRight");
  expect(await card.evaluate((e) => e.getAttribute("style"))).not.toBe(before);
  await card.getByRole("button", { name: "要素の幅を切替" }).click();
  await page.reload();
  await expect(page.getByLabel("ノート本文")).toHaveValue("A saved note");
  await expect(page.locator(".v4-card").last()).toHaveCSS("width", "480px");
  await page
    .getByLabel("Tutorへの質問")
    .fill("<img src=x onerror=alert(1)> ホロノミー");
  await page.getByRole("button", { name: "送信", exact: true }).click();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "実AIは未接続",
  );
  await expect(page.locator(".chat-message img")).toHaveCount(0);
  await page.getByLabel("Language").selectOption("en");
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Learning workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toggle sidebar" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await page
    .getByRole("link", { name: "Practice", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Practice", exact: true }),
  ).toBeVisible();
  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { name: "Learning progress", exact: true }),
  ).toBeVisible();
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
});
test("dismissal, math preview and all routes fit the viewport", async ({
  page,
}, testInfo) => {
  await page.goto("/progress");
  await page.getByRole("button", { name: "定義と条件の提案を閉じる" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "定義と条件", exact: true }),
  ).toHaveCount(0);
  await page.goto("/exercise");
  const problem = page.locator("#problem-conics");
  await problem.getByRole("textbox").fill("x^{2}");
  await problem.getByText("数式プレビュー", { exact: true }).click();
  await expect(problem.locator("details .katex").first()).toBeVisible();
  for (const route of [
    "/learn",
    "/exercise",
    "/knowledge",
    "/progress",
    "/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    if (route === "/learn" || route === "/exercise")
      await page.screenshot({
        path: testInfo.outputPath(route.slice(1) + ".png"),
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
});
