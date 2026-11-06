import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { executeJob, structureJob } from "../ai/pv1";
test("migration, atomic creation, owner isolation, revisions and reconstruction", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select current_setting('request.jwt.claim.sub',true)::uuid $$;grant usage on schema auth to authenticated;",
    );
    await db.exec(
      readFileSync("supabase/migrations/202611050001_core.sql", "utf8"),
    );
    await db.exec(
      readFileSync("supabase/migrations/202611050002_import.sql", "utf8"),
    );
    await db.exec(
      readFileSync("supabase/migrations/202611050003_board_edits.sql", "utf8"),
    );
    await db.exec(
      readFileSync("supabase/migrations/202611050004_board_turns.sql", "utf8"),
    );
    await db.exec(
      readFileSync("supabase/migrations/202611050005_practice.sql", "utf8"),
    );
    const a = crypto.randomUUID(),
      b = crypto.randomUUID(),
      id = crypto.randomUUID();
    await db.query("insert into auth.users values ($1),($2)", [a, b]);
    await db.exec("set role authenticated");
    const login = (uid: string) =>
      db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
    await login(a);
    await db.query("insert into pv_topics(id,name) values($1,'Galois')", [id]);
    await db.query(
      "insert into pv_boards(topic_id,title) values($1,'Proofs')",
      [id],
    );
    await db.query(
      "update pv_topics set name='Fields' where id=$1 and revision=1",
      [id],
    );
    assert.equal((await db.query("select * from pv_events")).rows.length, 2);
    assert.equal((await db.query("select * from pv_boards")).rows.length, 2);
    assert.equal(
      (await db.query("select * from pv_conversations")).rows.length,
      1,
    );
    const board = (
      await db.query<{ id: string }>(
        "select id from pv_boards where title=$1",
        ["Board"],
      )
    ).rows[0];
    const save = (revision: number, text: string) =>
      db.query<{ result: string | number | null }>(
        "select pv_save_board($1,$2,$3) as result",
        [board.id, revision, JSON.stringify([{ text }])],
      );
    assert.equal(Number((await save(1, "learner edit")).rows[0].result), 2);
    assert.equal((await save(1, "stale tutor edit")).rows[0].result, null);
    await db.query(
      "insert into pv_board_turns(board_id,question,reply,example) values($1,'question','reply',true)",
      [board.id],
    );
    const pack = crypto.randomUUID(),
      attempt = crypto.randomUUID();
    const createPack = (ownerTopic: string) =>
      db.query("select pv_create_practice($1,'Study',$2,$3)", [
        pack,
        [ownerTopic],
        '["slope-v1"]',
      ]);
    const submit = (answer: string) =>
      db.query("select pv_submit_practice($1,$2,'slope-v1',$3,false)", [
        attempt,
        pack,
        answer,
      ]);
    await createPack(id);
    await createPack(id);
    await submit("6");
    await submit("6");
    assert.equal((await db.query("select * from pv_attempts")).rows.length, 1);
    await assert.rejects(submit("7"));
    const secondTopic = crypto.randomUUID();
    await db.query("insert into pv_topics(id,name) values($1,'Other')", [
      secondTopic,
    ]);
    await db.query(
      "insert into pv_classifications(topic_id,concept) values($1,'fields')",
      [id],
    );
    await db.query(
      "insert into pv_relations(source,target,kind) values($1,$2,'requires')",
      [id, secondTopic],
    );
    await assert.rejects(
      db.query(
        "insert into pv_relations(source,target,kind) values($1,$2,'requires')",
        [secondTopic, id],
      ),
    );
    await login(b);
    assert.equal(
      (await db.query("select * from pv_classifications")).rows.length,
      0,
    );
    assert.equal((await db.query("select * from pv_relations")).rows.length, 0);
    await assert.rejects(createPack(id));
    await assert.rejects(submit("6"));
    assert.equal((await db.query("select * from pv_packages")).rows.length, 0);
    assert.equal((await db.query("select * from pv_attempts")).rows.length, 0);
    assert.equal(
      (await db.query("select * from pv_board_turns")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into pv_board_turns(board_id,question,reply) values($1,'q','r')",
        [board.id],
      ),
    );

    assert.equal((await save(2, "another user")).rows[0].result, null);
    for (const table of [
      "pv_topics",
      "pv_boards",
      "pv_conversations",
      "pv_events",
    ])
      assert.equal((await db.query("select * from " + table)).rows.length, 0);
    await assert.rejects(
      db.query("insert into pv_boards(topic_id,title) values($1,'intrude')", [
        id,
      ]),
    );
    await login(a);
    assert.deepEqual(
      (
        await db.query(
          "select name,revision from pv_topics where name='Fields'",
        )
      ).rows,
      [{ name: "Fields", revision: 2 }],
    );
    assert.deepEqual(
      (await db.query("select elements from pv_boards where id=$1", [board.id]))
        .rows,
      [{ elements: [{ text: "learner edit" }] }],
    );
    const payload = JSON.stringify({
      cards: [{ topic: "fields", text: "test" }],
      messages: [],
    });
    for (const expected of [true, false])
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            "select pv_import_v4($1::jsonb) as ok",
            [payload],
          )
        ).rows[0].ok,
        expected,
      );
    assert.equal((await db.query("select * from pv_boards")).rows.length, 4);
  } finally {
    await db.close();
  }
});
test("topic events route to Structure and reject an unrelated response", async () => {
  const job = structureJob(
    { id: "e", topic_id: "a", kind: "topic.created" },
    "ja",
  )!;
  assert.equal(job.role, "Structure");
  await assert.rejects(
    executeJob(job, {
      mode: "MOCK",
      generate: async () => ({ role: "Structure", topicId: "b", text: "x" }),
    }),
  );
  assert.equal(
    (
      await executeJob(job, {
        mode: "MOCK",
        generate: async () => ({ ...job, text: "代数" }),
      })
    ).text,
    "代数",
  );
});
