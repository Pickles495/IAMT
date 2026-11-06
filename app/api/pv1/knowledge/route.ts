import { topics } from "@/lib/domain";
const uuid = (v: unknown) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
async function handle(req: Request) {
  const auth = req.headers.get("authorization"),
    base = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const error = (message: string, status: number) =>
    Response.json({ error: message }, { status });
  if (!auth?.startsWith("Bearer ")) return error("Sign in required", 401);
  if (!base || !key) return error("Preview database is not configured", 503);
  const db = (
    path: string,
    method = "GET",
    data?: object,
    prefer = "return=minimal",
  ) =>
    fetch(new URL("/rest/v1/" + path, base), {
      method,
      headers: {
        Authorization: auth,
        apikey: key,
        "Content-Type": "application/json",
        Prefer: prefer,
      },
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
    });
  try {
    if (req.method === "GET") {
      const [c, r] = await Promise.all([
        db("pv_classifications?select=topic_id,concept"),
        db("pv_relations?select=source,target,kind,rationale"),
      ]);
      if (!c.ok || !r.ok)
        return error(
          "Personal knowledge settings unavailable. Check migration 005.",
          503,
        );
      return Response.json(
        { classes: await c.json(), links: await r.json() },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const b = await req.json();
    if (!uuid(b.source)) return error("Invalid topic", 400);
    let r;
    if (b.action === "classify" && topics.some((t) => t.id === b.concept))
      r = await db(
        "pv_classifications?on_conflict=topic_id",
        "POST",
        { topic_id: b.source, concept: b.concept },
        "resolution=merge-duplicates",
      );
    else if (b.action === "reset")
      r = await db("pv_classifications?topic_id=eq." + b.source, "DELETE");
    else if (
      uuid(b.target) &&
      b.target !== b.source &&
      ["related", "requires"].includes(b.kind)
    ) {
      if (b.action === "unlink")
        r = await db(
          "pv_relations?source=eq." +
            b.source +
            "&target=eq." +
            b.target +
            "&kind=eq." +
            b.kind,
          "DELETE",
        );
      else if (
        b.action === "link" &&
        typeof b.rationale === "string" &&
        b.rationale.length <= 500
      )
        r = await db("pv_relations", "POST", {
          source: b.source,
          target: b.target,
          kind: b.kind,
          rationale: b.rationale,
        });
    }
    if (!r) return error("Invalid update", 400);
    return r.ok
      ? Response.json({ ok: true })
      : error("Knowledge update rejected", r.status);
  } catch {
    return error("Knowledge service unavailable", 503);
  }
}
export const GET = handle,
  POST = handle;
