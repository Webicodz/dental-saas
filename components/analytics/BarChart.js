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

export default function BarChart({ 
  data, 
  title, 
  height = 300,
  showLegend = true,
  horizontal = false,
  stacked = false,
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

  // Calculate totals for stacked charts
  const getBarValues = (datasetIndex) => {
    const values = datasets[datasetIndex]?.data || [];
    if (stacked) {
      return labels.map((_, i) => {
        return datasets.reduce((sum, ds) => sum + (ds.data?.[i] || 0), 0);
      });
    }
    return values;
  };

  const maxValue = Math.max(
    ...labels.map((_, i) => 
      stacked 
        ? datasets.reduce((sum, ds) => sum + (ds.data?.[i] || 0), 0)
        : Math.max(...datasets.map(ds => ds.data?.[i] || 0))
    ),
    1
  );

  // Chart dimensions
  const chartHeight = height - 60;
  const chartWidth = 100;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  // Generate Y-axis labels
  const yLabels = 5;
  const yAxisLabels = Array.from({ length: yLabels + 1 }, (_, i) => {
    return Math.round((maxValue * i) / yLabels);
  });

  // Format large numbers
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Calculate bar dimensions
  const getBars = () => {
    const bars = [];
    const groupWidth = (chartWidth - padding.left - padding.right) / labels.length;
    const barPadding = groupWidth * 0.2;
    const barWidth = stacked 
      ? groupWidth - barPadding 
      : (groupWidth - barPadding) / datasets.length;

    labels.forEach((label, labelIndex) => {
      const groupX = padding.left + labelIndex * groupWidth;
      
      let cumulativeHeight = 0;
      
      datasets.forEach((dataset, datasetIndex) => {
        const value = dataset.data?.[labelIndex] || 0;
        const color = dataset.color || defaultColors[datasetIndex % defaultColors.length];
        
        if (stacked) {
          const barHeight = (value / maxValue) * (chartHeight - padding.top - padding.bottom);
          const y = chartHeight - padding.bottom - barHeight - cumulativeHeight;
          
          bars.push({
            x: groupX + barPadding / 2,
            y,
            width: barWidth,
            height: barHeight,
            color,
            value,
            label,
            datasetLabel: dataset.label,
          });
          
          cumulativeHeight += barHeight;
        } else {
          const barHeight = (value / maxValue) * (chartHeight - padding.top - padding.bottom);
          const x = groupX + barPadding / 2 + datasetIndex * barWidth;
          const y = chartHeight - padding.bottom - barHeight;
          
          bars.push({
            x,
            y,
            width: barWidth - 2,
            height: barHeight,
            color,
            value,
            label,
            datasetLabel: dataset.label,
          });
        }
      });
    });

    return bars;
  };

  const bars = getBars();

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
                className="w-3 h-3 rounded mr-2"
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
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {yAxisLabels.map((label, i) => {
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
            const groupWidth = (chartWidth - padding.left - padding.right) / labels.length;
            const x = padding.left + i * groupWidth + groupWidth / 2;
            
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {label.length > 10 ? `${label.substring(0, 10)}...` : label}
              </text>
            );
          })}

          {/* Bars */}
          {bars.map((bar, i) => (
            <g key={`bar-${i}`}>
              <rect
                x={bar.x}
                y={animated ? chartHeight - padding.bottom : bar.y}
                width={bar.width}
                height={animated ? 0 : bar.height}
                fill={bar.color}
                rx="4"
                className="transition-all duration-500 ease-out hover:opacity-80 cursor-pointer"
                style={{
                  transform: animated ? `translateY(${bar.y - (chartHeight - padding.bottom)}px)` : 'none',
                  transformOrigin: 'bottom',
                  animation: animated ? `grow-bar 0.8s ease-out forwards ${i * 30}ms` : 'none',
                }}
              >
                <title>{`${bar.datasetLabel}: ${formatValue(bar.value)}`}</title>
              </rect>
            </g>
          ))}
        </svg>
      </div>

      <style jsx>{`
        @keyframes grow-bar {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        .animate-grow {
          animation: grow-bar 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
