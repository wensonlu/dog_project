import React, { useState } from 'react';

const TypewriterText = ({ text, speed = 16 }) => {
  const [displayed, setDisplayed] = React.useState('');

  React.useEffect(() => {
    const fullText = String(text || '');
    if (!fullText) {
      setDisplayed('');
      return;
    }

    let index = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      index += 1;
      setDisplayed(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayed}</>;
};

const Section = ({ title, items, tone = 'slate' }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const toneClasses = {
    slate: 'bg-white/90 border-slate-100 text-slate-700',
    amber: 'bg-amber-50/90 border-amber-100 text-amber-800',
    rose: 'bg-rose-50/90 border-rose-100 text-rose-700',
  };

  return (
    <section className={`rounded-2xl border p-3 ${toneClasses[tone] || toneClasses.slate}`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-xs leading-5">
            {index + 1}. <TypewriterText text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
};

const AISummaryCard = ({ data, loading, error, onRefresh, onFollowUp }) => {
  const [showCitations, setShowCitations] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!loading && !data && !error) return null;

  return (
    <div className="mb-3 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/95 to-cyan-50/95 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] text-teal-600 font-medium">AI 搜索总结</p>
          <p className="text-xs text-slate-500">
            {data ? `置信度 ${data.confidence || 'unknown'} · 来源 ${data.meta?.sourceCount || 0} 条` : '正在生成中...'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-2.5 py-1 text-xs rounded-lg bg-white/90 text-teal-700 border border-teal-200"
        >
          重新总结
        </button>
      </div>

      {loading && <p className="text-xs text-slate-600">正在检索相关帖子并生成总结...</p>}
      {error && <p className="text-xs text-rose-600">AI 总结暂时不可用，请稍后重试。</p>}

      {data && (
        <div className="space-y-2">
          <div className={`relative ${expanded ? '' : 'max-h-72 overflow-hidden'}`}>
            <div className="space-y-2">
          <Section title="核心结论" items={data.summary?.keyFindings} />
          <Section title="常见原因" items={data.summary?.commonCauses} tone="amber" />
          <Section title="可先尝试" items={data.summary?.suggestionsTryFirst} />
          <Section title="何时就医" items={data.summary?.seeVetSignals} tone="rose" />

          <p className="text-[11px] text-slate-500 leading-4">{data.summary?.disclaimer}</p>
            </div>
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-50/95 to-transparent pointer-events-none" />
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 text-slate-700 border border-slate-200"
          >
            {expanded ? '收起内容' : '查看更多'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCitations((prev) => !prev)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/90 text-slate-700 border border-slate-200"
            >
              {showCitations ? '收起来源' : '展开来源'}
            </button>
            <button
              type="button"
              onClick={onFollowUp}
              className="px-2.5 py-1 text-xs rounded-lg bg-teal-500 text-white"
            >
              继续追问AI
            </button>
          </div>

          {showCitations && (
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-2.5 space-y-2">
              {(data.citations || []).map((item) => (
                <a
                  key={item.postId}
                  href={item.url}
                  className="block rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <p className="text-xs font-medium text-slate-800 line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{item.snippet}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISummaryCard;
