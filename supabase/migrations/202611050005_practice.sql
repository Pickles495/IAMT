begin;
alter table public.pv_attempts add column solution_seen boolean not null default false;
create function public.pv_create_practice(pack uuid, name text, topic_ids uuid[], versions jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); inserted uuid;
begin
 if u is null or pack is null or length(trim(name)) not between 1 and 200
 or coalesce(cardinality(topic_ids),0) not between 1 and 20
 or jsonb_typeof(versions) is distinct from 'array' then raise exception 'Invalid package'; end if;
 if jsonb_array_length(versions) not between 1 and 20 or length(versions::text)>4000 then raise exception 'Invalid questions'; end if;
 if (select count(*) from public.pv_topics where owner_id=u and id=any(topic_ids))<>cardinality(topic_ids)
 then raise exception 'Invalid topic selection'; end if;
 insert into public.pv_packages(id,owner_id,title,questions) values(pack,u,trim(name),versions) on conflict(id) do nothing returning id into inserted;
 if inserted is null then
   if not exists(select 1 from public.pv_packages p where p.id=pack and p.owner_id=u and p.questions=versions and p.title=trim(name))
   or (select array_agg(topic_id order by topic_id) from public.pv_package_topics where package_id=pack and owner_id=u)
      is distinct from (select array_agg(x order by x) from unnest(topic_ids) x) then raise exception 'Conflicting package'; end if;
 else
   insert into public.pv_package_topics(owner_id,package_id,topic_id) select u,pack,x from unnest(topic_ids) x;
 end if;
 return pack;
end $$;
create function public.pv_submit_practice(attempt uuid, pack uuid, version text, response text, seen boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or length(trim(response)) not between 1 and 10000 or not exists(
 select 1 from public.pv_packages p where p.owner_id=u and p.id=pack and p.questions ? version
 ) then raise exception 'Invalid attempt'; end if;
 insert into public.pv_attempts(id,owner_id,package_id,question_version,answer,solution_seen) values(attempt,u,pack,version,response,seen) on conflict(id) do nothing;
 if not exists(select 1 from public.pv_attempts a where a.id=attempt and a.owner_id=u and a.package_id=pack and a.question_version=version and a.answer=response and a.solution_seen=seen)
 then raise exception 'Conflicting attempt'; end if;
 return attempt;
end $$;
revoke all on function public.pv_create_practice(uuid,text,uuid[],jsonb), public.pv_submit_practice(uuid,uuid,text,text,boolean) from public,anon;
grant execute on function public.pv_create_practice(uuid,text,uuid[],jsonb), public.pv_submit_practice(uuid,uuid,text,text,boolean) to authenticated;
-- Personal annotations use the ownership policies and composite keys installed in M1.
create table public.pv_classifications(
 owner_id uuid not null default auth.uid(), topic_id uuid primary key,
 concept text not null check(concept in ('galois','fields','linear','conics','calculus','symmetry')),
 foreign key(owner_id,topic_id) references public.pv_topics(owner_id,id) on delete cascade);
alter table public.pv_classifications enable row level security;
revoke all on public.pv_classifications from public,anon,authenticated;
create policy owned on public.pv_classifications to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
grant select,insert(topic_id,concept),update(topic_id,concept),delete on public.pv_classifications to authenticated;
alter table public.pv_relations add column rationale text not null default '' check(length(rationale)<=500);
create function public.pv_check_prerequisite() returns trigger language plpgsql set search_path='' as $$
begin
 if new.kind='requires' then
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,0));
  if exists(with recursive prior(id) as (
    select new.target union select r.target from public.pv_relations r join prior p on r.source=p.id
    where r.owner_id=new.owner_id and r.kind='requires'
  ) select 1 from prior where id=new.source) then raise exception 'Prerequisite cycle'; end if;
 end if;
 return new;
end $$;
create trigger pv_acyclic_prerequisites before insert on public.pv_relations for each row execute function public.pv_check_prerequisite();
grant insert(source,target,kind,rationale),delete on public.pv_relations to authenticated;
commit;
