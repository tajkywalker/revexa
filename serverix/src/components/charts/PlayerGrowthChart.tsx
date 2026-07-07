'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { subDays, format } from 'date-fns'
import { cs } from 'date-fns/locale'

// Mock data — v reálné app by to byl API call
const data = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i)
  return {
    date: format(date, 'd. M.', { locale: cs }),
    hráči: Math.floor(80 + Math.random() * 80 + i * 2),
    noví:  Math.floor(2 + Math.random() * 15),
  }
})

export function PlayerGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7b52f4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7b52f4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3ecf8e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#555577', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: '#555577', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0f0f20',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#eeeef8',
          }}
          labelStyle={{ color: '#8888aa', marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="hráči"
          stroke="#7b52f4"
          strokeWidth={2}
          fill="url(#colorPlayers)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="noví"
          stroke="#3ecf8e"
          strokeWidth={1.5}
          fill="url(#colorNew)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
