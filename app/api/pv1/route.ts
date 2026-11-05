import { NextRequest } from "next/server";
const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });
export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
async function handle(req: NextRequest) {
  const base = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return error("Preview database is not configured", 503);
  try {
    const body = req.method === "POST" ? await req.json() : {};
    const read = req.method === "GET";
    const login = !read && body.action === "login";
    const auth = req.headers.get("authorization");
    if (!login && !auth?.startsWith("Bearer "))
      return error("Sign in required", 401);
    const headers: Record<string, string> = {
      apikey: key,
      "Content-Type": "application/json",
    };
    if (auth && !login) headers.Authorization = auth;
    let path =
      "/rest/v1/pv_topics?select=id,name,revision,locale,pv_boards(id,title),pv_conversations(id,title)&order=name";
    let method = "GET",
      data;
    if (login) {
      path = "/auth/v1/token?grant_type=password";
      method = "POST";
      data = { email: body.email, password: body.password };
    } else if (!read && body.action === "import") {
      path = "/rest/v1/rpc/pv_import_v4";
      method = "POST";
      data = { payload: body.payload };
    } else if (!read) {
      const title = typeof body.name === "string" ? body.name.trim() : "";
      if (!title || title.length > 200)
        return error("Name must contain 1–200 characters", 400);
      method = "POST";
      headers.Prefer = "return=representation";
      if (body.action === "create") {
        path = "/rest/v1/pv_topics";
        data = { name: title, locale: body.locale === "en" ? "en" : "ja" };
      } else {
        if (!/^[a-f0-9-]{36}$/i.test(body.topicId))
          return error("Invalid topic", 400);
        if (body.action === "rename" && Number.isInteger(body.revision)) {
          method = "PATCH";
          path =
            "/rest/v1/pv_topics?id=eq." +
            body.topicId +
            "&revision=eq." +
            body.revision;
          data = { name: title };
        } else if (body.action === "board" || body.action === "conversation") {
          path =
            "/rest/v1/pv_" +
            (body.action === "board" ? "boards" : "conversations");
          data = { topic_id: body.topicId, title };
        } else return error("Unknown action", 400);
      }
    }
    const r = await fetch(new URL(path, base), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
    });
    if (!r.ok) return error("Request rejected", r.status);
    const result = await r.json();
    if (method === "PATCH" && !result.length)
      return error("Topic changed or unavailable", 409);
    return Response.json(login ? { token: result.access_token } : result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return error("Invalid request or unavailable service", 400);
  }
}
