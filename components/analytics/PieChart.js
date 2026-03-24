import React, { useState } from 'react';

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export default function PieChart({ 
  data, 
  title, 
  height = 300,
  showLegend = true,
  donut = false,
  animated = true,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
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
  const values = datasets[0]?.data || [];
  const total = values.reduce((sum, val) => sum + val, 0);

  // Calculate pie slices
  const slices = values.map((value, i) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return {
      label: labels[i] || `Item ${i + 1}`,
      value,
      percentage,
      color: datasets[0]?.color 
        ? Array.isArray(datasets[0].color) 
          ? datasets[0].color[i % datasets[0].color.length]
          : defaultColors[i % defaultColors.length]
        : defaultColors[i % defaultColors.length],
    };
  });

  // SVG dimensions
  const size = Math.min(height - 40, 250);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = donut ? size / 2 - 15 : size / 2 - 5;
  const innerRadius = donut ? radius * 0.6 : 0;

  // Generate arc paths
  const getArcPath = (startAngle, endAngle, color, index) => {
    const start = {
      x: centerX + radius * Math.cos(startAngle),
      y: centerY + radius * Math.sin(startAngle),
    };
    const end = {
      x: centerX + radius * Math.cos(endAngle),
      y: centerY + radius * Math.sin(endAngle),
    };
    const innerStart = {
      x: centerX + innerRadius * Math.cos(startAngle),
      y: centerY + innerRadius * Math.sin(startAngle),
    };
    const innerEnd = {
      x: centerX + innerRadius * Math.cos(endAngle),
      y: centerY + innerRadius * Math.sin(endAngle),
    };

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    if (donut) {
      return `
        M ${start.x} ${start.y}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
        L ${innerEnd.x} ${innerEnd.y}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
        Z
      `;
    }

    return `
      M ${centerX} ${centerY}
      L ${start.x} ${start.y}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
      Z
    `;
  };

  // Calculate angles
  let currentAngle = -Math.PI / 2;
  const arcs = slices.map((slice, i) => {
    const angle = (slice.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    return {
      ...slice,
      startAngle,
      endAngle,
      path: getArcPath(startAngle, endAngle, slice.color, i),
    };
  });

  // Format values
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full"
          >
            {arcs.map((arc, i) => (
              <path
                key={i}
                d={arc.path}
                fill={arc.color}
                className={`transition-all duration-300 ${
                  activeIndex === i ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  transform: activeIndex === i ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  animation: animated ? `fade-in 0.5s ease-out forwards ${i * 100}ms` : 'none',
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <title>{`${arc.label}: ${formatValue(arc.value)} (${arc.percentage.toFixed(1)}%)`}</title>
              </path>
            ))}

            {/* Center text for donut */}
            {donut && (
              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                className="text-2xl font-bold fill-gray-900"
              >
                {formatValue(total)}
              </text>
            )}
            {donut && (
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                className="text-sm fill-gray-500"
              >
                Total
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 space-y-2">
            {arcs.map((arc, i) => (
              <div 
                key={i}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                  activeIndex === i ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: arc.color }}
                  />
                  <span className="text-sm text-gray-700">{arc.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {formatValue(arc.value)}
                  </span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {arc.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
