-- Forum MCP audit log table
create table if not exists public.forum_mcp_audit (
  id bigserial primary key,
  action text not null,
  user_id uuid null,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_mcp_audit_action_created_at
  on public.forum_mcp_audit(action, created_at desc);

create index if not exists idx_forum_mcp_audit_user_id_created_at
  on public.forum_mcp_audit(user_id, created_at desc);
