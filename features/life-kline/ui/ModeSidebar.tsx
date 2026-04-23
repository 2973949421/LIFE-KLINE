import type { KlineMode } from '@/features/life-kline/types';

interface ModeSidebarProps {
  mode: KlineMode;
  setMode: (mode: KlineMode) => void;
}

export function ModeSidebar({ mode, setMode }: ModeSidebarProps) {
  return (
    <aside className="flex w-20 shrink-0 flex-col gap-2 py-4">
      <button
        onClick={() => setMode('single')}
        className="rounded-lg p-3 text-center transition-all"
        style={{
          border: mode === 'single' ? '1px solid var(--lab-border-strong)' : '1px solid transparent',
          background: mode === 'single' ? 'var(--lab-surface-soft)' : 'transparent',
        }}
      >
        <div className="lab-body text-sm font-medium" style={{ color: 'var(--lab-fg)' }}>
          单人 K 线
        </div>
        {mode === 'single' && <div className="mt-1 text-xs" style={{ color: 'var(--lab-fg)' }}>●</div>}
      </button>

      <button
        onClick={() => setMode('hepan')}
        className="rounded-lg p-3 text-center transition-all"
        style={{
          border: mode === 'hepan' ? '1px solid var(--lab-border-strong)' : '1px solid transparent',
          background: mode === 'hepan' ? 'var(--lab-surface-soft)' : 'transparent',
        }}
      >
        <div className="lab-body text-sm font-medium" style={{ color: 'var(--lab-fg)' }}>
          合盘 K 线
        </div>
        <div className="text-xs" style={{ color: 'var(--lab-muted)' }}>(测试中)</div>
        {mode === 'hepan' && <div className="mt-1 text-xs" style={{ color: 'var(--lab-fg)' }}>●</div>}
      </button>
    </aside>
  );
}
