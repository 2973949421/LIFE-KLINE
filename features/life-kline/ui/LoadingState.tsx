interface LoadingStateProps {
  text: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"
        style={{ borderColor: 'var(--lab-border-strong)', borderTopColor: 'transparent' }}
      />
      <p className="lab-body text-lg" style={{ color: 'var(--lab-fg)' }}>
        {text}
      </p>
    </div>
  );
}
