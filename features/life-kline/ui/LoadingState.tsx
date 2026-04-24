import { useEffect, useMemo, useState } from 'react';

interface LoadingStateProps {
  text: string;
  modeLabel: string;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function LoadingState({ text, modeLabel }: LoadingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const phase = useMemo(() => {
    if (elapsed < 8) {
      return '排盘校验';
    }
    if (elapsed < 45) {
      return '模型推理';
    }
    if (elapsed < 120) {
      return '结构化 K 线';
    }
    return '收敛与校验';
  }, [elapsed]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="lab-panel mb-6 flex flex-col items-center justify-center rounded-lg px-5 py-14">
      <div
        className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"
        style={{ borderColor: 'var(--lab-border-strong)', borderTopColor: 'transparent' }}
      />
      <p className="lab-body text-lg" style={{ color: 'var(--lab-fg)' }}>
        {text}
      </p>
      <p className="lab-body mt-2 text-sm" style={{ color: 'var(--lab-muted)' }}>
        分析预计耗时 1-3 分钟，完成后监控面板会自动关闭
      </p>

      <div className="mt-6 w-full max-w-xl rounded-lg border p-4" style={{ borderColor: 'var(--lab-border)' }}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="lab-body text-sm" style={{ color: 'var(--lab-fg)' }}>
            性能监控
          </span>
          <span className="lab-mono text-xs" style={{ color: 'var(--lab-muted)' }}>
            {modeLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="lab-card-soft rounded-md p-3">
            <div className="lab-mono text-lg" style={{ color: 'var(--lab-fg)' }}>{formatElapsed(elapsed)}</div>
            <div className="lab-body text-xs" style={{ color: 'var(--lab-muted)' }}>已用时间</div>
          </div>
          <div className="lab-card-soft rounded-md p-3">
            <div className="lab-mono text-lg" style={{ color: 'var(--lab-fg)' }}>{phase}</div>
            <div className="lab-body text-xs" style={{ color: 'var(--lab-muted)' }}>当前阶段</div>
          </div>
          <div className="lab-card-soft rounded-md p-3">
            <div className="lab-mono text-lg" style={{ color: 'var(--lab-fg)' }}>1-3m</div>
            <div className="lab-body text-xs" style={{ color: 'var(--lab-muted)' }}>预计耗时</div>
          </div>
        </div>
      </div>
    </div>
  );
}
