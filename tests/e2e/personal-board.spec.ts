import { test, expect } from "@playwright/test";
test("personal board can apply a labelled example, undo and restore saved notes", async ({
  page,
}) => {
  const boardId = "11111111-1111-4111-8111-111111111111";
  let elements: unknown[] = [];
  let revision = 1;
  await page.route("**/api/pv1", (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? [
              {
                id: "topic",
                name: "Fields",
                revision: 1,
                pv_boards: [
                  {
                    id: "22222222-2222-4222-8222-222222222222",
                    title: "Draft",
                  },
                  { id: boardId, title: "Board" },
                ],
                pv_conversations: [],
              },
            ]
          : { token: "fixture" },
    }),
  );
  await page.route("**/api/pv1/board", (route) => {
    const b = route.request().postDataJSON();
    expect(b.boardId).toBe(boardId);
    if (b.action === "save") {
      expect(b.revision).toBe(revision);
      elements = b.elements;
      return route.fulfill({ json: { revision: ++revision } });
    }
    if (b.action === "ask") {
      expect(b.example).toBe(true);
      expect(b.selected).toBeTruthy();
      return route.fulfill({
        json: {
          reply: "Two roots",
          proposal: { action: "append", text: "Example roots", tex: "x^2=2" },
        },
      });
    }
    return route.fulfill({
      json: { elements, revision, history: [], live: false },
    });
  });
  await page.goto("/workspaces");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("example");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  const open = () => page.getByRole("button", { name: "Board ↗" }).click();
  await page.getByLabel("学びたいこと").fill("Fields: what is an embedding?");
  await expect(page.getByLabel("保存先のTopic")).toHaveValue("topic");
  await expect(
    page.getByRole("button", { name: "質問からBoardを開く" }),
  ).toBeDisabled();
  await page.getByLabel("保存先のBoard").selectOption(boardId);
  await page.getByRole("button", { name: "質問からBoardを開く" }).click();
  await expect(page.locator("[data-note]")).toContainText(
    "Fields: what is an embedding?",
  );
  await page.getByRole("button", { name: "編集", exact: true }).click();
  await page.getByLabel("本文").fill("My question");
  await page.getByRole("button", { name: "完了" }).click();
  await page.getByRole("button", { name: /^保存/ }).click();
  await page.getByRole("button", { name: "固定例で操作を試す" }).click();
  await page.getByRole("button", { name: "Boardに反映" }).click();
  const cards = page.locator("[data-note]");
  await expect(cards).toHaveCount(2);
  await page.getByRole("button", { name: "↶ Undo" }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole("button", { name: "↷ Redo" }).click();
  await page.getByRole("button", { name: /^保存/ }).click();
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "← 一覧" }).click();
  await open();
  await expect(cards).toHaveCount(2);
  await expect(cards.last()).toContainText("Example roots");
});

test("tree and map open the same saved board and retain focus", async ({
  page,
}) => {
  const topic = {
    id: "galois-private",
    name: "ガロア理論",
    revision: 1,
    pv_boards: [{ id: "proofs", title: "証明メモ" }],
    pv_conversations: [],
  };
  await page.route("**/api/pv1", (r) =>
    r.fulfill({
      json: r.request().method() === "GET" ? [topic] : { token: "fixture" },
    }),
  );
  await page.route("**/api/pv1/board", (r) => {
    expect(r.request().postDataJSON().boardId).toBe("proofs");
    return r.fulfill({
      json: { revision: 1, elements: [], history: [], live: false },
    });
  });
  await page.goto("/workspaces");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("fixture");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await page.getByRole("button", { name: "知識構造を探索" }).click();
  const knowledge = page.getByRole("region", { name: "個人の知識構造" });
  await knowledge.getByRole("button", { name: "ガロア理論 個人" }).click();
  const open = async () => {
    await knowledge.getByRole("button", { name: "証明メモ ↗" }).click();
    await expect(
      page.getByRole("heading", { name: "ガロア理論 · 証明メモ" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "← 一覧" }).click();
  };
  await open();
  await knowledge.getByRole("button", { name: "Map", exact: true }).click();
  await knowledge
    .getByRole("button", { name: "体の拡大", exact: true })
    .click();
  await knowledge
    .getByRole("button", { name: "ガロア理論", exact: true })
    .click();
  await open();
  await expect(knowledge.getByLabel("中心のTopic")).toHaveValue(
    "galois-private",
  );
});
