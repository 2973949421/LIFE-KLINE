'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import {
  formatTimelineLabel,
  getTimelineLabelInterval,
  type ChartClickEvent,
  type TimelineAxisEntry,
  type TooltipAxisParam,
} from '@/components/life-kline/chart-utils';

interface TimelineEntry extends TimelineAxisEntry {
  age?: number;
}

interface Props {
  data: Array<{ k: number | null; d: number | null; j: number | null }>;
  timeline: TimelineEntry[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function KDJChart({ data, timeline, onSelect }: Props) {
  const xLabels = useMemo(() => timeline.map(formatTimelineLabel), [timeline]);
  const xLabelInterval = useMemo(() => getTimelineLabelInterval(timeline), [timeline]);

  const option = useMemo(
    () => ({
      title: {
        text: 'KDJ · 节奏指标',
        left: 'center',
        textStyle: {
          color: 'rgb(26, 35, 126)',
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 251, 240, 0.95)',
        borderColor: 'rgb(26, 35, 126)',
        formatter: (params: TooltipAxisParam[]) => {
          const point = data[params[0]?.dataIndex ?? 0];
          return `
            <div style="font-family: STKaiti, KaiTi, serif;">
              <div style="font-weight: bold;">${xLabels[params[0]?.dataIndex ?? 0]}</div>
              <div>K: ${point.k?.toFixed(2) || '-'}</div>
              <div>D: ${point.d?.toFixed(2) || '-'}</div>
              <div>J: ${point.j?.toFixed(2) || '-'}</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['K', 'D', 'J'],
        top: 40,
        textStyle: { fontFamily: 'STKaiti, KaiTi, serif', fontSize: 12 },
      },
      grid: { left: '12%', right: '8%', top: 85, bottom: 50 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        axisLabel: { fontSize: 12, rotate: 45, fontFamily: 'STKaiti, KaiTi, serif', interval: xLabelInterval },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        splitLine: { lineStyle: { color: 'rgba(26, 35, 126, 0.1)', type: 'dashed' } },
        axisLabel: { fontSize: 12 },
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }],
      series: [
        {
          name: 'K',
          type: 'line',
          data: data.map((d) => d.k),
          lineStyle: { width: 1, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'D',
          type: 'line',
          data: data.map((d) => d.d),
          lineStyle: { width: 1, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'J',
          type: 'line',
          data: data.map((d) => d.j),
          lineStyle: { width: 1, color: '#8b5cf6' },
          symbol: 'none',
        },
      ],
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          { yAxis: 80, lineStyle: { color: '#ef4444', type: 'dashed', width: 1 }, label: { show: false } },
          { yAxis: 20, lineStyle: { color: '#22c55e', type: 'dashed', width: 1 }, label: { show: false } },
        ],
      },
    }),
    [data, xLabelInterval, xLabels],
  );

  const onEvents = {
    click: (params: ChartClickEvent) => {
      if (params.dataIndex !== undefined) {
        onSelect(params.dataIndex);
      }
    },
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '0.5px solid rgb(26, 35, 126)', boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)' }}
    >
      <ReactECharts option={option} style={{ height: '200px' }} onEvents={onEvents} />
    </div>
  );
}
