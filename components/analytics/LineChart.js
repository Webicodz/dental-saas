import React from 'react';

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export default function LineChart({ 
  data, 
  title, 
  height = 300,
  showLegend = true,
  showGrid = true,
  animated = true,
}) {
  if (!data || !data.labels || !data.datasets) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const { labels, datasets } = data;

  // Calculate max value for scaling
  const allValues = datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const chartHeight = height - 60; // Account for padding
  const chartWidth = 100; // Percentage based
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  // Generate Y-axis labels
  const yLabels = 5;
  const yAxisLabels = Array.from({ length: yLabels + 1 }, (_, i) => {
    const value = minValue + (range * i) / yLabels;
    return Math.round(value);
  });

  // Format large numbers
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Calculate points for a dataset
  const getPoints = (values, color, index) => {
    const strokeDasharray = animated ? '1000' : '0';
    const animationDelay = animated ? `${index * 150}ms` : '0ms';
    
    return values.map((value, i) => {
      const x = padding.left + (i / (values.length - 1)) * (chartWidth - padding.left - padding.right);
      const y = chartHeight - padding.bottom - ((value - minValue) / range) * (chartHeight - padding.top - padding.bottom);
      return `${x},${y}`;
    }).join(' ');
  };

  // Calculate area path
  const getAreaPath = (values) => {
    const points = values.map((value, i) => {
      const x = padding.left + (i / (values.length - 1)) * (chartWidth - padding.left - padding.right);
      const y = chartHeight - padding.bottom - ((value - minValue) / range) * (chartHeight - padding.top - padding.bottom);
      return `${x},${y}`;
    });

    const bottomLeft = `${padding.left},${chartHeight - padding.bottom}`;
    const bottomRight = `${chartWidth - padding.right},${chartHeight - padding.bottom}`;

    return `M ${bottomLeft} L ${points.join(' L ')} L ${bottomRight} Z`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      {showLegend && datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: dataset.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && yAxisLabels.map((label, i) => {
            const y = chartHeight - padding.bottom - (i / yLabels) * (chartHeight - padding.top - padding.bottom);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatValue(label)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {labels.map((label, i) => {
            // Show only some labels to avoid crowding
            const step = Math.ceil(labels.length / 8);
            if (i % step !== 0 && i !== labels.length - 1) return null;
            
            const x = padding.left + (i / (labels.length - 1)) * (chartWidth - padding.left - padding.right);
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {label}
              </text>
            );
          })}

          {/* Areas and Lines */}
          {datasets.map((dataset, datasetIndex) => {
            const color = dataset.color || defaultColors[datasetIndex % defaultColors.length];
            const values = dataset.data || [];
            
            return (
              <g key={`dataset-${datasetIndex}`}>
                {/* Area fill */}
                <path
                  d={getAreaPath(values)}
                  fill={color}
                  fillOpacity="0.1"
                  className={animated ? 'animate-fade-in' : ''}
                />
                
                {/* Line */}
                <polyline
                  points={getPoints(values, color, datasetIndex)}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={animated ? 'animate-draw-line' : ''}
                  style={{
                    strokeDasharray: animated ? '1000' : 'none',
                    strokeDashoffset: animated ? '1000' : '0',
                    animation: animated ? `draw-line 1.5s ease-out forwards ${datasetIndex * 150}ms` : 'none',
                  }}
                />

                {/* Data points */}
                {values.map((value, i) => {
                  const x = padding.left + (i / (values.length - 1)) * (chartWidth - padding.left - padding.right);
                  const y = chartHeight - padding.bottom - ((value - minValue) / range) * (chartHeight - padding.top - padding.bottom);
                  
                  return (
                    <circle
                      key={`point-${datasetIndex}-${i}`}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                      className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <style jsx>{`
        @keyframes draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-draw-line {
          animation: draw-line 1.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
