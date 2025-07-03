import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Define an array of STEAM-themed colors for the bars
const STEAM_COLORS = [
  '#007bff', // tech-blue
  '#6f42c1', // creative-purple
  '#ffc107', // learning-yellow
  '#17a2b8', // Info blue (complementary)
  '#28a745', // Success green (complementary)
  '#fd7e14', // Orange (complementary)
];

const TopicPerformanceChart = ({ data }) => {
  // data is expected to be an array of objects: e.g., [{ name: 'Math', progress: 80 }, ...]

  if (!data || data.length === 0) {
    return <p className="text-center text-steam-gray">No performance data available for chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 0, // Adjusted for better label visibility if YAxis labels are short
          bottom: 5,
        }}
        barGap={10} // Space between bars of different categories
        barCategoryGap="20%" // Space between bars within the same category (if grouped)
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} interval={0} stroke="#4A5568" />
        <YAxis allowDecimals={false} domain={[0, 100]} stroke="#4A5568" />
        <Tooltip
          cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #ccc' }}
        />
        {/* <Legend wrapperStyle={{ paddingTop: '20px' }} /> */}
        <Bar dataKey="progress" name="Performance" unit="%">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STEAM_COLORS[index % STEAM_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopicPerformanceChart;
