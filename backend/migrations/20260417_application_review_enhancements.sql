ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reject_reason_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reject_note TEXT;

COMMENT ON COLUMN public.applications.reviewed_at IS '申请最终审核时间';
COMMENT ON COLUMN public.applications.reject_reason_codes IS '申请拒绝原因代码列表';
COMMENT ON COLUMN public.applications.reject_note IS '申请拒绝补充说明';
