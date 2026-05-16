"use client";

import { useTheme } from "next-themes";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

// Sample data - in a real implementation, this would come from the API
const data = [
  {
    name: "Mon",
    codeLines: 120,
    aiSuggestions: 24,
    productivity: 85,
  },
  {
    name: "Tue",
    codeLines: 150,
    aiSuggestions: 28,
    productivity: 90,
  },
  {
    name: "Wed",
    codeLines: 200,
    aiSuggestions: 35,
    productivity: 95,
  },
  {
    name: "Thu",
    codeLines: 180,
    aiSuggestions: 30,
    productivity: 88,
  },
  {
    name: "Fri",
    codeLines: 250,
    aiSuggestions: 40,
    productivity: 92,
  },
  {
    name: "Sat",
    codeLines: 100,
    aiSuggestions: 15,
    productivity: 70,
  },
  {
    name: "Sun",
    codeLines: 80,
    aiSuggestions: 10,
    productivity: 65,
  },
];

export function AnalyticsChart() {
  const { theme } = useTheme();
  
  // Determine colors based on theme
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke={textColor} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke={textColor} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
            color: textColor,
            border: `1px solid ${gridColor}`,
            borderRadius: "6px",
          }} 
        />
        <Legend />
        <Bar 
          dataKey="codeLines" 
          name="Lines of Code" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          dataKey="aiSuggestions" 
          name="AI Suggestions" 
          fill="#10b981" 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          dataKey="productivity" 
          name="Productivity Score" 
          fill="#f59e0b" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}