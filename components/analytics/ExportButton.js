import React, { useState } from 'react';

export default function ExportButton({ 
  data, 
  filename = 'export',
  label = 'Export CSV',
  disabled = false,
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || isExporting) return;

    setIsExporting(true);

    try {
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data) return '';

    // Handle different data structures
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      // Get headers from first object
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      // Add rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }

    // Handle object with nested arrays (like chart data)
    if (typeof data === 'object') {
      const csvRows = [];

      // Process each key in the object
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          csvRows.push(`\n${key.toUpperCase()}`);
          
          if (value.length > 0) {
            if (typeof value[0] === 'object') {
              // Array of objects
              const headers = Object.keys(value[0]);
              csvRows.push(headers.join(','));
              value.forEach(row => {
                const values = headers.map(header => {
                  const v = row[header];
                  if (v === null || v === undefined) return '';
                  const stringValue = String(v);
                  if (stringValue.includes(',') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                  }
                  return stringValue;
                });
                csvRows.push(values.join(','));
              });
            } else {
              // Simple array
              csvRows.push(value.join(','));
            }
          }
        } else if (value !== null && value !== undefined) {
          // Simple key-value pair
          csvRows.push(`${key},${value}`);
        }
      });

      return csvRows.join('\n');
    }

    return String(data);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !data}
      className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium transition-all ${
        disabled || !data
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
      }`}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
