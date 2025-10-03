import React from 'react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { ChartData } from '../types';

interface ChartRendererProps {
  chartData: ChartData;
}

const COLORS = ['#1d4ed8', '#be123c', '#059669', '#d97706', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1'];

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData }) => {
  const { chartType, data, dataKeys, xAxisKey, explanation, nameKey, dataKey, yAxisKey, zAxisKey } = chartData;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        if (!xAxisKey || !dataKeys) return <div className="text-red-500">Chart data is incomplete.</div>;
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        );
      case 'bar':
         if (!xAxisKey || !dataKeys) return <div className="text-red-500">Chart data is incomplete.</div>;
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        );
      case 'pie':
        if (!nameKey || !dataKey) return <div className="text-red-500">Chart data is incomplete.</div>;
        return (
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dataKey}
                    nameKey={nameKey}
                    // FIX: Use 'any' type for the Pie label formatter props to avoid a TypeScript error.
                    // The `percent` property is available at runtime but seems to be missing from recharts' type definitions.
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        );
      case 'scatter':
        if (!xAxisKey || !yAxisKey) return <div className="text-red-500">Scatter chart data is incomplete.</div>;
        return (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} unit={xAxisKey.includes('_mm') ? 'mm' : ''} />
                <YAxis type="number" dataKey={yAxisKey} name={yAxisKey} unit={yAxisKey.includes('_m') ? 'm' : ''} />
                {zAxisKey && <ZAxis type="number" dataKey={zAxisKey} range={[60, 400]} name={zAxisKey} />}
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Data points" data={data} fill={COLORS[0]} shape="circle" />
            </ScatterChart>
        );
      case 'heatmap':
        if (!xAxisKey || !yAxisKey || !dataKey) return <div className="text-red-500">Heatmap data is incomplete.</div>;

        const numericData = data.filter(p => typeof p[dataKey] === 'number' && isFinite(p[dataKey]));
        if (numericData.length === 0) return <div className="text-gray-500">No numeric data available for heatmap.</div>;

        const valueDomain = numericData.reduce((acc, p) => {
            const value = p[dataKey];
            return [Math.min(acc[0], value), Math.max(acc[1], value)];
        }, [Infinity, -Infinity]);

        const getColor = (value: number) => {
            const [min, max] = valueDomain;
            if (max === min || typeof value !== 'number' || !isFinite(value)) {
                return '#808080'; // Return a neutral gray for invalid or single-value data
            }

            const ratio = (value - min) / (max - min);

            // Color scale: Blue (low) -> Yellow (mid) -> Red (high)
            const lowColor = { r: 60, g: 100, b: 255 }; // Blue
            const midColor = { r: 255, g: 255, b: 0 }; // Yellow
            const highColor = { r: 255, g: 0, b: 0 };  // Red

            let r, g, b;

            if (ratio < 0.5) {
                // Interpolate between low (blue) and mid (yellow)
                const localRatio = ratio * 2;
                r = Math.round(lowColor.r * (1 - localRatio) + midColor.r * localRatio);
                g = Math.round(lowColor.g * (1 - localRatio) + midColor.g * localRatio);
                b = Math.round(lowColor.b * (1 - localRatio) + midColor.b * localRatio);
            } else {
                // Interpolate between mid (yellow) and high (red)
                const localRatio = (ratio - 0.5) * 2;
                r = Math.round(midColor.r * (1 - localRatio) + highColor.r * localRatio);
                g = Math.round(midColor.g * (1 - localRatio) + highColor.g * localRatio);
                b = Math.round(midColor.b * (1 - localRatio) + highColor.b * localRatio);
            }

            return `rgb(${r}, ${g}, ${b})`;
        };

        return (
            <ScatterChart margin={{ top: 20, right: 30, bottom: 80, left: 80 }}>
                <CartesianGrid />
                <XAxis dataKey={xAxisKey} type="category" name={xAxisKey} angle={-45} textAnchor="end" height={100} interval={0} />
                <YAxis dataKey={yAxisKey} type="category" name={yAxisKey} width={100} interval={0} />
                {/* FIX: Add a ZAxis to control the size of the squares, making them large enough to be visible. */}
                <ZAxis type="number" range={[400, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data} shape="square" isAnimationActive={false}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry[dataKey])} />
                    ))}
                </Scatter>
            </ScatterChart>
        );
      default:
        return <div className="text-red-500">Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div className="w-full text-gray-800">
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {explanation && <p className="text-sm text-gray-600 mt-4 text-center">{explanation}</p>}
    </div>
  );
};

export default ChartRenderer;