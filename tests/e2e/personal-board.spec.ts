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
  const note = page.locator("[data-note]").first();
  await note.press("Enter");
  await expect(page.getByLabel("本文")).toBeFocused();
  await page.getByLabel("本文").fill("My question");
  await page.keyboard.press("Escape");
  await expect(note).toBeFocused();
  const startX = await note.evaluate((el) =>
    parseFloat(getComputedStyle(el).left),
  );
  await page.keyboard.press("ArrowRight");
  await expect(note).toHaveCSS("left", `${startX + 10}px`);
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
  await note.focus();
  await page.getByRole("button", { name: "補足を書く" }).click();
  await page.getByLabel("補足の種類").selectOption("question");
  await page.getByLabel("本文").fill("なぜ像は根になる？");
  await page.getByRole("button", { name: "完了" }).click();
  await page.getByRole("button", { name: "解答を添える" }).click();
  await expect(page.getByLabel("補足の種類")).toHaveValue("answer");
  await page.getByLabel("本文").fill("準同型は積と和を保つ。");
  await page.getByLabel("数式", { exact: true }).fill("f(x)=0");
  await page.getByRole("button", { name: "完了" }).click();
  const savedQuestion = note.getByRole("button", { name: /問い.*なぜ像/ });
  await savedQuestion.click();
  await expect(
    note.getByText("準同型は積と和を保つ。", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^保存/ }).click();
  await page.getByRole("button", { name: "← 一覧" }).click();
  await open();
  await note.getByRole("button", { name: "補足を開く" }).click();
  await expect(savedQuestion).toHaveAttribute("aria-expanded", "false");
  await savedQuestion.click();
  await expect(
    note.locator(".reading-detail .math-display").last(),
  ).toBeVisible();
  await expect(note.locator("[data-inline-note]").last()).toContainText(
    "準同型",
  );
  const lesson = page.getByRole("button", { name: "教材 · 体の埋め込み" });
  await lesson.click();
  const why = page.getByRole("button", { name: "なぜ候補は二つ？" });
  const proof = page.getByRole("button", { name: "両方が埋め込みになる理由" });
  const example = page.getByRole("button", { name: "具体例で比較する" });
  const canvas = page.locator(".m2-view");
  const anchor = canvas.locator(".reading-anchor");
  const transform = await page
    .locator(".m2-world")
    .evaluate((el) => el.getAttribute("style"));
  await expect(canvas).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tutor", exact: true }),
  ).toBeVisible();
  await expect(
    anchor.getByRole("button", { name: "なぜ候補は二つ？" }),
  ).toBeVisible();
  const tutor = page.locator(".m2-layout aside");
  await tutor.getByRole("button", { name: "具体例を確認" }).click();
  await expect(example).toHaveAttribute("aria-expanded", "false");
  await tutor.getByRole("button", { name: "破棄" }).click();
  await tutor.getByRole("button", { name: "具体例を確認" }).click();
  await tutor.getByRole("button", { name: "Boardに反映" }).click();
  await expect(example).toHaveAttribute("aria-expanded", "true");
  await why.click();
  await proof.click();
  await why.press("Enter");
  await expect(why).toBeFocused();
  await expect(proof).toBeHidden();
  await expect(example).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".m2-world")).toHaveAttribute("style", transform!);
  await expect(cards).toHaveCount(3);
  await expect(anchor.locator("[data-inline-note]")).toHaveCount(1);
  await example.click();
  await example.click();
  await expect(page.locator(".m2-layout aside")).toContainText("元 1+√2");
  await tutor.getByRole("button", { name: "ここにメモを添える" }).click();
  await anchor.getByLabel("本文").fill("二つの像を比較した");
  await anchor.getByRole("button", { name: "完了" }).click();
  await anchor.getByRole("button", { name: "補足を閉じる" }).click();
  await expect(example).toBeHidden();
  await expect(cards).toHaveCount(3);
  await lesson.click();
  await page.getByRole("button", { name: /^保存/ }).click();
  await page.getByRole("button", { name: "← 一覧" }).click();
  await open();
  await lesson.click();
  await expect(
    anchor.getByRole("button", { name: "二つの像を比較した" }),
  ).toBeVisible();
  await expect(why).toHaveAttribute("aria-expanded", "false");
  await expect(example).toHaveAttribute("aria-expanded", "true");
  await why.click();
  await expect(proof).toHaveAttribute("aria-expanded", "true");
});

test("tree and map open the same saved board and retain focus", async ({
  page,
}) => {
  await page.route("**/api/pv1/knowledge", (r) =>
    r.fulfill({ json: { classes: [], links: [] } }),
  );
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
