import React, { useState } from 'react';

const periods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom Range' },
];

export default function DateRangePicker({ 
  value = '30d', 
  onChange, 
  showCustom = true 
}) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onChange?.(newPeriod);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange?.({
        period: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setShowCustomPicker(false);
    }
  };

  const currentPeriod = periods.find(p => p.value === value) || periods[1];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Period Buttons */}
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        {periods.filter(p => p.value !== 'custom' || showCustom).map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              (value === period.value || (!value && period.value === '30d'))
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setShowCustomPicker(false)}
            className="px-4 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Current Selection Display */}
      {!showCustomPicker && value === 'custom' && (
        <span className="text-sm text-gray-600">
          {new Date().toLocaleDateString()} - {new Date().toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
