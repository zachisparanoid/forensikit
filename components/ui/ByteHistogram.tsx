'use client';

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';

/** Heat color from low (teal) -> warning -> danger by normalized value 0..1. */
function heat(t: number): string {
  if (t < 0.5) {
    // teal -> amber
    const k = t / 0.5;
    return lerpColor([25, 102, 99], [227, 179, 65], k);
  }
  const k = (t - 0.5) / 0.5;
  return lerpColor([227, 179, 65], [248, 81, 73], k);
}

function lerpColor(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function ByteHistogram({
  histogram,
  height = 180,
}: {
  histogram: number[];
  height?: number;
}) {
  const max = Math.max(1, ...histogram);
  const data = histogram.map((count, i) => ({ i, count }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="i"
          tick={{ fontSize: 10, fill: 'rgb(107,119,133)' }}
          ticks={[0, 64, 128, 192, 255]}
          stroke="rgb(31,42,55)"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'rgb(107,119,133)' }}
          stroke="rgb(31,42,55)"
          width={36}
        />
        <RTooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: 'rgb(22,29,40)',
            border: '1px solid rgb(31,42,55)',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(l) =>
            `Byte 0x${Number(l).toString(16).padStart(2, '0')} (${l})`
          }
          formatter={(v: number) => [v, 'count']}
        />
        <Bar dataKey="count" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.i} fill={heat(d.count / max)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EntropyChart({
  samples,
  height = 160,
}: {
  samples: number[];
  height?: number;
}) {
  const data = samples.map((v, i) => ({ i, e: Number(v.toFixed(3)) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="i"
          tick={{ fontSize: 10, fill: 'rgb(107,119,133)' }}
          stroke="rgb(31,42,55)"
        />
        <YAxis
          domain={[0, 8]}
          ticks={[0, 2, 4, 6, 8]}
          tick={{ fontSize: 10, fill: 'rgb(107,119,133)' }}
          stroke="rgb(31,42,55)"
          width={28}
        />
        <ReferenceLine y={7.5} stroke="rgb(248,81,73)" strokeDasharray="3 3" />
        <RTooltip
          contentStyle={{
            background: 'rgb(22,29,40)',
            border: '1px solid rgb(31,42,55)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v} bits/byte`, 'entropy']}
          labelFormatter={(l) => `window ${l}`}
        />
        <Line
          type="monotone"
          dataKey="e"
          stroke="rgb(61,212,200)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
