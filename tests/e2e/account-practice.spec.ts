import { test, expect } from "@playwright/test";
import type { Pack } from "../../lib/practice-catalog";
test("a saved numeric answer contributes to progress after signing in again", async ({
  page,
}) => {
  const packs: Pack[] = [];
  await page.route("**/api/pv1", (r) =>
    r.fulfill({
      json:
        r.request().method() === "GET"
          ? [
              {
                id: "topic",
                name: "ガロア理論",
                revision: 1,
                pv_boards: [],
                pv_conversations: [],
              },
            ]
          : { token: "fixture" },
    }),
  );
  await page.route("**/api/pv1/practice", (r) => {
    if (r.request().method() === "GET") return r.fulfill({ json: packs });
    const b = r.request().postDataJSON();
    if (b.action === "create") {
      packs.push({
        id: b.id,
        title: b.title,
        questions: b.versions,
        pv_package_topics: b.topics.map((topic_id: string) => ({ topic_id })),
        pv_attempts: [],
      });
    } else {
      packs[0].pv_attempts.push({
        id: b.id,
        question_version: b.version,
        answer: b.answer,
        solution_seen: b.seen,
        created_at: new Date().toISOString(),
      });
    }
    return r.fulfill({ json: b.id });
  });
  const enter = async () => {
    await page.getByLabel("Email", { exact: true }).fill("test@example.com");
    await page.getByLabel("Password").fill("fixture");
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await page.getByRole("button", { name: "個人演習・学習記録" }).click();
  };
  await page.goto("/workspaces");
  await enter();
  await page.getByLabel("ガロア理論", { exact: true }).check();
  await page.getByRole("button", { name: "作成", exact: true }).click();
  const problem = page.locator(".account-practice article").nth(1);
  await problem.getByRole("textbox").fill("2");
  await problem.getByRole("button", { name: "解答を保存" }).click();
  await expect(problem.getByRole("status")).toContainText("正解");
  await page.reload();
  await enter();
  await page.getByRole("button", { name: "Learning Progress" }).click();
  await expect(page.getByText(/採点対象の正解/)).toContainText("1 / 1");
  await page.getByText(/ガロア理論 · 正解/).click();
  await expect(page.getByText("2", { exact: true })).toBeVisible();
});
