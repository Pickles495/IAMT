begin;
alter table public.pv_boards add column revision bigint not null default 1;

-- Both the canvas and accepted Tutor suggestions save against the revision they read.
create function public.pv_save_board(board_id uuid, expected_revision bigint, new_elements jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare saved_revision bigint;
begin
  if jsonb_typeof(new_elements) is distinct from 'array' then
    raise exception 'Expected an array of board elements' using errcode = '22023';
  end if;
  if jsonb_array_length(new_elements) > 1000 or octet_length(new_elements::text) > 2000000 then
    raise exception 'Board size limit exceeded' using errcode = '22023';
  end if;
  update public.pv_boards
    set elements = new_elements, revision = revision + 1
    where id = board_id and owner_id = auth.uid() and revision = expected_revision
    returning revision into saved_revision;
  return saved_revision;
end $$;
revoke all on function public.pv_save_board(uuid,bigint,jsonb) from public, anon;
grant execute on function public.pv_save_board(uuid,bigint,jsonb) to authenticated;
commit;
