begin;
create table public.pv_imports(owner_id uuid primary key default auth.uid() references auth.users on delete cascade, snapshot jsonb not null, created_at timestamptz not null default now());
alter table public.pv_imports enable row level security;
revoke all on public.pv_imports from public,anon,authenticated;
create function public.pv_import_v4(payload jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t uuid; c uuid; k text; prior jsonb;
begin
 if u is null or jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>2000000 then raise exception 'invalid import'; end if;
 if jsonb_typeof(payload->'cards') is distinct from 'array' or jsonb_typeof(payload->'messages') is distinct from 'array' then raise exception 'invalid collections'; end if;
 insert into public.pv_imports(owner_id,snapshot) values(u,payload) on conflict do nothing;
 if not found then
 select snapshot into prior from public.pv_imports where owner_id=u;
 if prior<>payload then raise exception 'different import already exists'; end if;
 return false;
 end if;
 for k in select x->>'topic' from jsonb_array_elements(payload->'cards') x union select x->>'topicId' from jsonb_array_elements(payload->'messages') x loop
 if k is null or k not in ('conics','linear','galois','fields','calculus','symmetry') then raise exception 'unknown topic'; end if;
 insert into public.pv_topics(owner_id,name) values(u,k) returning id into t;
 update public.pv_boards set elements=coalesce((select jsonb_agg(x order by pos) from jsonb_array_elements(payload->'cards') with ordinality a(x,pos) where x->>'topic'=k),'[]') where topic_id=t;
 select id into c from public.pv_conversations where topic_id=t;
 insert into public.pv_messages(owner_id,conversation_id,body,created_at) select u,c,x->>'text',(x->>'createdAt')::timestamptz from jsonb_array_elements(payload->'messages') x where x->>'topicId'=k;
 end loop;
 return true;
end $$;
revoke all on function public.pv_import_v4(jsonb) from public,anon;
grant execute on function public.pv_import_v4(jsonb) to authenticated;
commit;
