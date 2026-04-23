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
  data: (number | null)[];
  timeline: TimelineEntry[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function RSIChart({ data, timeline, onSelect }: Props) {
  const xLabels = useMemo(() => timeline.map(formatTimelineLabel), [timeline]);
  const xLabelInterval = useMemo(() => getTimelineLabelInterval(timeline), [timeline]);

  const option = useMemo(
    () => ({
      title: {
        text: 'RSI · 相对强弱指数',
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
          const index = params[0]?.dataIndex ?? 0;
          const value = data[index];
          const status =
            value !== null ? (value >= 80 ? '超买' : value <= 20 ? '超卖' : '正常') : '-';

          return `
            <div style="font-family: Times New Roman, serif;">
              <div style="font-weight: bold;">${xLabels[index]}</div>
              <div>RSI: ${value?.toFixed(2) || '-'}</div>
              <div>${status}</div>
            </div>
          `;
        },
      },
      grid: { left: '12%', right: '8%', top: 60, bottom: 50 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        axisLabel: { fontSize: 12, rotate: 45, fontFamily: 'Times New Roman, serif', interval: xLabelInterval },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        splitLine: { lineStyle: { color: 'rgba(26, 35, 126, 0.1)', type: 'dashed' } },
        axisLabel: { fontSize: 12 },
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }],
      series: [
        {
          name: 'RSI',
          type: 'line',
          data,
          lineStyle: { width: 1.5, color: 'rgb(26, 35, 126)' },
          symbol: 'none',
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(26, 35, 126, 0.3)' },
                { offset: 1, color: 'rgba(26, 35, 126, 0.05)' },
              ],
            },
          },
        },
      ],
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          { yAxis: 80, lineStyle: { color: '#ef4444', type: 'dashed', width: 1 }, label: { formatter: '超买', position: 'end' } },
          { yAxis: 50, lineStyle: { color: '#666', type: 'dotted', width: 1 }, label: { show: false } },
          { yAxis: 20, lineStyle: { color: '#22c55e', type: 'dashed', width: 1 }, label: { formatter: '超卖', position: 'end' } },
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
