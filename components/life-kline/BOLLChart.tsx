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
  c: number;
}

interface Props {
  data: Array<{ upper: number | null; middle: number | null; lower: number | null }>;
  timeline: TimelineEntry[];
  indicators: {
    ma20: (number | null)[];
  };
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function BOLLChart({ data, timeline, onSelect }: Props) {
  const xLabels = useMemo(() => timeline.map(formatTimelineLabel), [timeline]);
  const xLabelInterval = useMemo(() => getTimelineLabelInterval(timeline), [timeline]);
  const closes = useMemo(() => timeline.map((d) => d.c), [timeline]);

  const option = useMemo(
    () => ({
      title: {
        text: 'BOLL · 布林带通道',
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
          const point = data[index];

          return `
            <div style="font-family: STKaiti, KaiTi, serif;">
              <div style="font-weight: bold;">${xLabels[index]}</div>
              <div>收盘: ${closes[index]}</div>
              <div>上轨: ${point.upper?.toFixed(2) || '-'}</div>
              <div>中轨: ${point.middle?.toFixed(2) || '-'}</div>
              <div>下轨: ${point.lower?.toFixed(2) || '-'}</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['收盘价', '上轨', '中轨', '下轨'],
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
          name: '上轨',
          type: 'line',
          data: data.map((d) => d.upper),
          lineStyle: { width: 1, color: 'rgba(26, 35, 126, 0.5)' },
          symbol: 'none',
        },
        {
          name: '中轨',
          type: 'line',
          data: data.map((d) => d.middle),
          lineStyle: { width: 1, color: 'rgb(26, 35, 126)' },
          symbol: 'none',
        },
        {
          name: '下轨',
          type: 'line',
          data: data.map((d) => d.lower),
          lineStyle: { width: 1, color: 'rgba(26, 35, 126, 0.5)' },
          symbol: 'none',
          areaStyle: {
            origin: 'start',
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(26, 35, 126, 0.1)' },
                { offset: 1, color: 'rgba(26, 35, 126, 0.02)' },
              ],
            },
          },
        },
        {
          name: '收盘价',
          type: 'line',
          data: closes,
          lineStyle: { width: 1.5, color: '#ef4444' },
          symbol: 'circle',
          symbolSize: 3,
        },
      ],
    }),
    [closes, data, xLabelInterval, xLabels],
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
