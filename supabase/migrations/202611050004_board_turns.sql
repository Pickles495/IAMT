begin;
create table public.pv_board_turns (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 board_id uuid not null,
 question text not null check(length(question) between 1 and 3000),
 reply text not null check(length(reply) between 1 and 8000),
 example boolean not null default false,
 created_at timestamptz not null default now(),
 foreign key(owner_id,board_id) references public.pv_boards(owner_id,id) on delete cascade
);
create index on public.pv_board_turns(board_id,created_at desc);
alter table public.pv_board_turns enable row level security;
revoke all on public.pv_board_turns from public,anon,authenticated;
create policy owned on public.pv_board_turns to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
grant select,insert(board_id,question,reply,example) on public.pv_board_turns to authenticated;
commit;
