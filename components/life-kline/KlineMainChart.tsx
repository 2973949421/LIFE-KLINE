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
  o: number;
  h: number;
  l: number;
  c: number;
  summary: string;
}

interface Props {
  data: TimelineEntry[];
  indicators: {
    ma5: (number | null)[];
    ma10: (number | null)[];
    ma20: (number | null)[];
  };
  period?: 'daily' | 'monthly' | 'yearly';
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function KlineMainChart({ data, indicators, onSelect }: Props) {
  const xLabels = useMemo(() => data.map(formatTimelineLabel), [data]);
  const xLabelInterval = useMemo(() => getTimelineLabelInterval(data), [data]);
  const candlestickData = useMemo(() => data.map((d) => [d.o, d.c, d.l, d.h]), [data]);

  const option = useMemo(
    () => ({
      title: {
        text: 'K 线主图 · 均线系统',
        left: 'center',
        textStyle: {
          color: 'rgb(26, 35, 126)',
          fontFamily: 'STKaiti, KaiTi, serif',
          fontSize: 16,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(255, 251, 240, 0.95)',
        borderColor: 'rgb(26, 35, 126)',
        textStyle: { color: '#333' },
        formatter: (params: TooltipAxisParam[]) => {
          const dataIndex = params[0]?.dataIndex ?? 0;
          const point = data[dataIndex];
          const ma5 = indicators.ma5[dataIndex];
          const ma10 = indicators.ma10[dataIndex];
          const ma20 = indicators.ma20[dataIndex];
          const shape = point.c >= point.o ? '红柱阳线' : '绿柱阴线';

          return `
            <div style="font-family: STKaiti, KaiTi, serif;">
              <div style="font-weight: bold; margin-bottom: 4px;">${xLabels[dataIndex]}</div>
              <div>开盘: ${point.o} | 收盘: ${point.c}</div>
              <div>最高: ${point.h} | 最低: ${point.l}</div>
              <div>${shape}</div>
              <div style="margin-top: 4px; color: rgb(26, 35, 126);">
                MA5: ${ma5?.toFixed(1) || '-'} | MA10: ${ma10?.toFixed(1) || '-'} | MA20: ${ma20?.toFixed(1) || '-'}
              </div>
              <div style="margin-top: 4px; color: #666;">${point.summary}</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['K线', 'MA5', 'MA10', 'MA20'],
        top: 35,
        textStyle: { fontFamily: 'STKaiti, KaiTi, serif', fontSize: 12 },
      },
      grid: {
        left: '12%',
        right: '8%',
        top: 100,
        bottom: 80,
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        axisLabel: {
          fontFamily: 'Times New Roman, serif',
          fontSize: 12,
          rotate: 45,
          interval: xLabelInterval,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: 'rgb(26, 35, 126)' } },
        splitLine: {
          lineStyle: { color: 'rgba(26, 35, 126, 0.1)', type: 'dashed' },
        },
        axisLabel: { fontFamily: 'Times New Roman, serif', fontSize: 12 },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider',
          show: true,
          start: 0,
          end: 100,
          bottom: 10,
          borderColor: 'rgb(26, 35, 126)',
          fillerColor: 'rgba(26, 35, 126, 0.1)',
          handleStyle: { color: 'rgb(26, 35, 126)' },
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: candlestickData,
          itemStyle: {
            color: '#ef4444',
            color0: '#22c55e',
            borderColor: '#ef4444',
            borderColor0: '#22c55e',
          },
        },
        {
          name: 'MA5',
          type: 'line',
          data: indicators.ma5,
          smooth: true,
          lineStyle: { width: 1, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'MA10',
          type: 'line',
          data: indicators.ma10,
          smooth: true,
          lineStyle: { width: 1, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'MA20',
          type: 'line',
          data: indicators.ma20,
          smooth: true,
          lineStyle: { width: 1, color: '#8b5cf6' },
          symbol: 'none',
        },
      ],
    }),
    [candlestickData, data, indicators, xLabelInterval, xLabels],
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
      style={{
        border: '0.5px solid rgb(26, 35, 126)',
        boxShadow: '2px 2px 8px rgba(26, 35, 126, 0.1)',
      }}
    >
      <ReactECharts option={option} style={{ height: '400px' }} onEvents={onEvents} />
    </div>
  );
}
