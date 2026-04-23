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
  data: Array<{ dif: number; dea: number; macd: number }>;
  timeline: TimelineEntry[];
  crossSignals: {
    macd_golden: Array<{ index: number; year: number }>;
    macd_death: Array<{ index: number; year: number }>;
  };
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function MACDChart({ data, timeline, crossSignals, onSelect }: Props) {
  const xLabels = useMemo(() => timeline.map(formatTimelineLabel), [timeline]);
  const xLabelInterval = useMemo(() => getTimelineLabelInterval(timeline), [timeline]);

  const option = useMemo(
    () => ({
      title: {
        text: 'MACD · 异同移动平均',
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
            <div style="font-family: Times New Roman, serif;">
              <div style="font-weight: bold;">${xLabels[params[0]?.dataIndex ?? 0]}</div>
              <div>DIF: ${point.dif.toFixed(2)}</div>
              <div>DEA: ${point.dea.toFixed(2)}</div>
              <div>MACD: ${point.macd.toFixed(2)}</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['DIF', 'DEA', 'MACD'],
        top: 40,
        textStyle: { fontFamily: 'STKaiti, KaiTi, serif', fontSize: 12 },
      },
      grid: { left: '12%', right: '8%', top: 85, bottom: 50 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        axisLabel: { fontSize: 12, rotate: 45, fontFamily: 'Times New Roman, serif', interval: xLabelInterval },
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
          name: 'DIF',
          type: 'line',
          data: data.map((d) => d.dif),
          lineStyle: { width: 1, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'DEA',
          type: 'line',
          data: data.map((d) => d.dea),
          lineStyle: { width: 1, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'MACD',
          type: 'bar',
          data: data.map((d) => ({
            value: d.macd,
            itemStyle: {
              color: d.macd >= 0 ? '#ef4444' : '#22c55e',
            },
          })),
          barWidth: '60%',
        },
        {
          name: '金叉',
          type: 'scatter',
          data: crossSignals.macd_golden.map((signal) => ({
            value: [signal.index, data[signal.index]?.dif || 0],
            itemStyle: { color: '#fbbf24' },
          })),
          symbol: 'triangle',
          symbolSize: 10,
        },
        {
          name: '死叉',
          type: 'scatter',
          data: crossSignals.macd_death.map((signal) => ({
            value: [signal.index, data[signal.index]?.dif || 0],
            itemStyle: { color: '#6b7280' },
          })),
          symbol: 'triangle',
          symbolRotate: 180,
          symbolSize: 10,
        },
      ],
    }),
    [crossSignals, data, xLabelInterval, xLabels],
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
