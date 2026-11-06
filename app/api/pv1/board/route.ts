import { aiExecutionPolicy } from "@/ai/execution-policy";
import { exampleReply, generateReply } from "@/ai/board-tutor";
import { validBoardElements } from "@/lib/board-elements";
export async function POST(req: Request) {
  const err = (error: string, status: number) =>
    Response.json({ error }, { status });
  const auth = req.headers.get("authorization"),
    base = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!auth?.startsWith("Bearer ")) return err("Sign in required", 401);
  if (!base || !key) return err("Preview database is not configured", 503);
  try {
    const b = await req.json();
    if (typeof b.boardId !== "string" || !/^[a-f0-9-]{36}$/i.test(b.boardId))
      return err("Invalid board", 400);
    const db = (path: string, data?: object) =>
      fetch(new URL("/rest/v1/" + path, base), {
        method: data ? "POST" : "GET",
        headers: {
          Authorization: auth,
          apikey: key,
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
        cache: "no-store",
      });
    if (b.action === "save") {
      if (!Number.isSafeInteger(b.revision) || !validBoardElements(b.elements))
        return err("Invalid save", 400);
      const r = await db("rpc/pv_save_board", {
        board_id: b.boardId,
        expected_revision: b.revision,
        new_elements: b.elements,
      });
      if (!r.ok) return err("Board save unavailable", r.status);
      const revision = await r.json();
      return revision === null
        ? err("Board changed. Reopen to load the latest version.", 409)
        : Response.json({ revision });
    }
    const boardResult = await db(
      "pv_boards?id=eq." +
        b.boardId +
        "&select=id,revision,elements,pv_topics(name)",
    );
    if (!boardResult.ok)
      return err(
        "Board unavailable. Check the M2 migration.",
        boardResult.status,
      );
    const [board] = await boardResult.json();
    if (!board) return err("Board unavailable", 404);
    const turns = await db(
      "pv_board_turns?board_id=eq." +
        b.boardId +
        "&select=question,reply,example&order=created_at.desc&limit=20",
    );
    if (!turns.ok)
      return err(
        "Tutor history unavailable. Check the M2 migration.",
        turns.status,
      );
    const history = (await turns.json()).reverse();
    const policy = aiExecutionPolicy();
    const live = policy.liveEnabled;
    if (b.action === "open")
      return Response.json({ ...board, history, live, aiMode: policy.mode });
    if (
      b.action !== "ask" ||
      typeof b.question !== "string" ||
      !b.question.trim() ||
      b.question.length > 3000
    )
      return err("Invalid question", 400);
    if (board.revision !== b.revision)
      return err("Board changed. Reopen to continue.", 409);
    if (b.example && !policy.mockEnabled)
      return err("Example Tutor is disabled", 503);
    if (!b.example && !live) return err("Live Tutor is disabled", 503);
    const selected = board.elements.find(
      (n: { id: string }) => n.id === b.selected,
    );
    const en = b.locale === "en";
    const reply = b.example
      ? exampleReply(en)
      : await generateReply(
          {
            topic: board.pv_topics.name,
            locale: en ? "en" : "ja",
            selected,
            notes: JSON.stringify(board.elements).slice(0, 12000),
            history: history
              .filter((x: { example: boolean }) => !x.example)
              .slice(-4),
            question: b.question,
          },
          process.env.OPENAI_API_KEY!,
          process.env.OPENAI_MODEL!,
        );
    if (reply.proposal.action === "replace" && !selected)
      return err("Invalid proposal target", 502);
    const saved = await db("pv_board_turns", {
      board_id: b.boardId,
      question: b.question,
      reply: reply.reply,
      example: !!b.example,
    });
    if (!saved.ok) return err("Could not save the conversation", saved.status);
    return Response.json(reply);
  } catch {
    return err("Tutor or storage temporarily unavailable", 502);
  }
}
