import { test, expect } from "@playwright/test";
test("map identity, topic handoff, practice, persistence and evidence record", async ({
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
  await page.getByRole("link", { name: "この概念を演習する" }).click();
  await expect(page.getByLabel("演習トピック")).toHaveValue("galois");
  await page
    .getByLabel("あなたの解答・考え方")
    .fill("√2 の像は x²−2 の根である。");
  await page.getByRole("button", { name: "解答を記録・確認" }).click();
  await expect(page.getByRole("status")).toContainText("自動判定なし");
  await page.getByRole("link", { name: "演習記録を見る" }).click();
  await expect(page.locator(".attempt-row")).toHaveCount(1);
  await page.locator(".attempt-row summary").click();
  await expect(page.locator(".attempt-body")).toContainText("√2 の像");
  await page.reload();
  await expect(page.locator(".attempt-row")).toHaveCount(1);
});
test("hint separation, retry preservation, accurate aggregate and data deletion", async ({
  page,
}) => {
  await page.goto("/exercise?topic=conics");
  await page.getByRole("button", { name: "次のヒントを見る" }).click();
  await expect(page.locator(".solution p")).not.toBeVisible();
  await page.getByLabel("あなたの解答・考え方").fill("2");
  await page.getByRole("button", { name: "解答を記録・確認" }).click();
  await expect(page.locator(".evaluation")).toContainText("再検討");
  await page.getByRole("button", { name: "解答を修正" }).click();
  await page.getByLabel("あなたの解答・考え方").fill("-2, 2");
  await page.getByRole("button", { name: "解答を記録・確認" }).click();
  await page.getByRole("link", { name: "演習記録を見る" }).click();
  await expect(page.locator(".metric").nth(1)).toContainText("1 / 2");
  await expect(page.locator(".attempt-row")).toHaveCount(2);
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
});
test("settings override Board and arbitrary tutor input stays safe", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByLabel("Boardの解説量").selectOption("compact");
  await page.goto("/learn");
  await expect(
    page.getByRole("heading", { name: "具体例から考える" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Tutorへの質問")
    .fill("<img src=x onerror=alert(1)> ホロノミーについて");
  await page.getByRole("button", { name: "質問を送信" }).click();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "実AIは未接続",
  );
  await expect(page.locator(".chat-message.user")).toContainText("<img src=x");
  await expect(page.locator(".chat-message img")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".chat-message.user")).toContainText("ホロノミー");
});
test("dismissal persists and layout fits viewport", async ({
  page,
}, testInfo) => {
  await page.goto("/progress");
  await page
    .getByRole("button", { name: "条件から、もう一度。の提案を閉じる" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "条件から、もう一度。" }),
  ).toHaveCount(0);
  for (const route of [
    "/learn",
    "/exercise",
    "/knowledge",
    "/progress",
    "/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    if (route === "/learn" || route === "/knowledge")
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
