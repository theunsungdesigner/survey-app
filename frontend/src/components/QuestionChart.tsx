import React from 'react';
import { Box, Card, CardContent, Typography, Chip, useTheme, useMediaQuery } from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { QuestionDataV2 } from '../types/survey';

const COLORS = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

interface Props {
  question: QuestionDataV2;
}

export default function QuestionChart({ question }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isMobile ? 250 : 350;

  const renderChart = () => {
    const data = question.data.map((d) => ({
      name: d.label,
      value: d.value,
      fill: d.color || undefined,
    }));

    switch (question.chart_type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? 80 : 120}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 80 : 30} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <Typography color="error">Unknown chart type: {question.chart_type}</Typography>;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.text}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={question.chart_type} size="small" color="primary" variant="outlined" />
              <Chip label={`${question.total_responses} responses`} size="small" variant="outlined" />
              {question.unit && <Chip label={question.unit} size="small" variant="outlined" />}
            </Box>
          </Box>
        </Box>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
