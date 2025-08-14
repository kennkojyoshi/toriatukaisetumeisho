import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const clamp = (n: number, min = 0, max = 5) => Math.max(min, Math.min(max, n));
const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_AXES = [
  { id: uid(), label: 'スピード', value: 3 },
  { id: uid(), label: '正確さ', value: 4 },
  { id: uid(), label: '創造性', value: 3 },
  { id: uid(), label: '継続力', value: 4 },
  { id: uid(), label: '協調性', value: 3 },
];

function phraseForValue(v: number) {
  if (v >= 5) return '非常に優秀';
  if (v >= 4) return '良好';
  if (v >= 3) return '平均的';
  if (v >= 2) return '改善の余地';
  return '要強化';
}

function generateComment(axes: { label: string; value: number }[]) {
  if (!axes.length) return '';
  const avg = (axes.reduce((acc, a) => acc + clamp(a.value), 0) / axes.length).toFixed(1);
  const highest = axes.reduce((p, c) => (c.value > p.value ? c : p));
  const lowest = axes.reduce((p, c) => (c.value < p.value ? c : p));
  const bullets = axes.map((a) => `・${a.label}: ${a.value}（${phraseForValue(a.value)}）`).join('\n');
  const suggestions = axes.filter((a) => a.value < 4).slice(0, 3).map((a) => `- 「${a.label}」向上のために、週1回の練習や確認を取り入れる。`).join('\n');

  return (
    `【サマリー】\n` +
    `平均スコアは${avg}。特に「${highest.label}」が強み（${highest.value}）。` +
    ` 一方で「${lowest.label}」は相対的な弱点（${lowest.value}）。\n\n` +
    `【各項目】\n${bullets}\n\n` +
    (suggestions ? `【次の一歩】\n${suggestions}\n` : `【次の一歩】\n現状維持でOK。強みをさらに伸ばしましょう。`)
  );
}

export default function App() {
  const [title, setTitle] = useState('マイスキル評価');
  const [axes, setAxes] = useState(DEFAULT_AXES);
  const [showRadiusTicks, setShowRadiusTicks] = useState(false);
  const [comment, setComment] = useState('');

  const data = useMemo(() => axes.map((a) => ({ subject: a.label || '無題', score: clamp(Number(a.value) || 0), fullMark: 5 })), [axes]);
  const avg = useMemo(() => (axes.reduce((acc, a) => acc + clamp(Number(a.value) || 0), 0) / axes.length), [axes]);

  const addAxis = () => setAxes((prev) => [...prev, { id: uid(), label: '新規項目', value: 3 }]);
  const removeAxis = (id: string) => setAxes((prev) => prev.filter((a) => a.id !== id));
  const updateLabel = (id: string, label: string) => setAxes((prev) => prev.map((a) => (a.id === id ? { ...a, label } : a)));
  const updateValue = (id: string, value: number) => setAxes((prev) => prev.map((a) => (a.id === id ? { ...a, value: clamp(value) } : a)));
  const handleGenerate = () => setComment(generateComment(axes));

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#f7f7f7' }}>
      <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
        レーダーチャート作成＆コメントジェネレーター
      </motion.h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* 左：チャート */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: 20, fontWeight: 600, border: 'none', outline: 'none', flex: 1 }} />
              <label style={{ fontSize: 12 }}>
                <input type='checkbox' checked={showRadiusTicks} onChange={(e) => setShowRadiusTicks(e.target.checked)} style={{ marginRight: 6 }} />
                目盛
              </label>
            </div>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart data={data} outerRadius={120}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey='subject' />
                  {showRadiusTicks && <PolarRadiusAxis angle={90} domain={[0, 5]} />}
                  <Tooltip />
                  <Radar name='score' dataKey='score' stroke='#2563eb' fill='#2563eb' fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8 }}>
              {axes.map((axis) => (
                <div key={axis.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input value={axis.label} onChange={(e) => updateLabel(axis.id, e.target.value)} placeholder='項目名（例: スピード）' />
                  <input type='number' min={0} max={5} value={axis.value} onChange={(e) => updateValue(axis.id, Number(e.target.value))} />
                  <button onClick={() => removeAxis(axis.id)}>削除</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#666' }}>
                <div>平均: {avg.toFixed(1)}</div>
                <button onClick={addAxis}>項目を追加</button>
              </div>
            </div>
          </div>

          {/* 右：コメント */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>コメント</div>
              <button onClick={handleGenerate}>自動生成</button>
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`「自動生成」を押すと、レーダーチャートの値からコメント案を作ります。\nそのまま編集してお使いください。`} style={{ width: '100%', minHeight: 360 }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>入力値は0–5のスケール想定。</div>
      </div>
    </div>
  );
}
