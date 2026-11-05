-- Run once in the isolated Supabase development project.
begin;
create table public.pv_topics (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users on delete cascade,
 name text not null check(length(trim(name)) between 1 and 200), locale text not null default 'ja',
 revision integer not null default 1, unique(owner_id,id)
);
create table public.pv_boards (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), topic_id uuid not null,
 title text not null check(length(trim(title)) between 1 and 200), elements jsonb not null default '[]' check(jsonb_typeof(elements)='array'),
 unique(owner_id,id), foreign key(owner_id,topic_id) references public.pv_topics(owner_id,id) on delete cascade
);
create table public.pv_conversations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), topic_id uuid not null,
 title text not null check(length(trim(title)) between 1 and 200), unique(owner_id,id),
 foreign key(owner_id,topic_id) references public.pv_topics(owner_id,id) on delete cascade
);
create table public.pv_messages (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), conversation_id uuid not null,
 body text not null, created_at timestamptz not null default now(),
 foreign key(owner_id,conversation_id) references public.pv_conversations(owner_id,id) on delete cascade
);
create table public.pv_relations (
 owner_id uuid not null default auth.uid(), source uuid not null, target uuid not null, kind text not null,
 primary key(owner_id,source,target,kind), check(source<>target),
 foreign key(owner_id,source) references public.pv_topics(owner_id,id) on delete cascade,
 foreign key(owner_id,target) references public.pv_topics(owner_id,id) on delete cascade
);
create table public.pv_packages (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), title text not null,
 questions jsonb not null default '[]', unique(owner_id,id)
);
create table public.pv_package_topics (
 owner_id uuid not null default auth.uid(), package_id uuid not null, topic_id uuid not null, primary key(package_id,topic_id),
 foreign key(owner_id,topic_id) references public.pv_topics(owner_id,id) on delete cascade,
 foreign key(owner_id,package_id) references public.pv_packages(owner_id,id) on delete cascade
);
create table public.pv_attempts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), package_id uuid not null,
 question_version text not null, answer text not null, created_at timestamptz not null default now(),
 foreign key(owner_id,package_id) references public.pv_packages(owner_id,id) on delete cascade
);
create table public.pv_events (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null, topic_id uuid not null,
 kind text not null, revision integer not null, created_at timestamptz not null default now(),
 unique(topic_id,kind,revision), foreign key(owner_id,topic_id) references public.pv_topics(owner_id,id) on delete cascade
);
do $$ declare n text; begin
 foreach n in array array['topics','boards','conversations','messages','relations','packages','package_topics','attempts','events'] loop
 execute format('alter table public.pv_%I enable row level security',n);
 execute format('revoke all on public.pv_%I from public, anon, authenticated',n);
 execute format('create policy owned on public.pv_%I to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()))',n);
 execute format('grant select on public.pv_%I to authenticated',n);
 end loop;
end $$;
grant insert(id,name,locale), update(name) on public.pv_topics to authenticated;
grant insert(topic_id,title) on public.pv_boards,public.pv_conversations to authenticated;
grant insert(conversation_id,body) on public.pv_messages to authenticated;
create function public.pv_bump() returns trigger language plpgsql set search_path='' as $$ begin new.revision=old.revision+1; return new; end $$;
create trigger revision before update on public.pv_topics for each row execute function public.pv_bump();
create function public.pv_topic_event() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.pv_events(owner_id,topic_id,kind,revision) values(new.owner_id,new.id,case when TG_OP='INSERT' then 'topic.created' else 'topic.updated' end,new.revision);
 if TG_OP='INSERT' then
 insert into public.pv_boards(owner_id,topic_id,title) values(new.owner_id,new.id,'Board');
 insert into public.pv_conversations(owner_id,topic_id,title) values(new.owner_id,new.id,'Tutor');
 end if;
 return new; end $$;
revoke all on function public.pv_topic_event() from public, anon, authenticated;
create trigger topic_event after insert or update on public.pv_topics for each row execute function public.pv_topic_event();
commit;
