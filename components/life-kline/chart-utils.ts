export interface TimelineAxisEntry {
  year: number;
  month?: number;
  day?: number;
}

export interface ChartClickEvent {
  dataIndex?: number;
}

export interface TooltipAxisParam {
  dataIndex: number;
}

export function formatTimelineLabel(entry: TimelineAxisEntry): string {
  if (entry.day !== undefined) {
    return `${entry.month}/${entry.day}`;
  }

  if (entry.month !== undefined) {
    return `${entry.year}/${entry.month}`;
  }

  return `${entry.year}年`;
}

export function getTimelineLabelInterval(entries: TimelineAxisEntry[]): number {
  const first = entries[0];

  if (!first) {
    return 0;
  }

  if (first.day !== undefined) {
    return 4;
  }

  if (first.month !== undefined) {
    return 1;
  }

  return 9;
}
