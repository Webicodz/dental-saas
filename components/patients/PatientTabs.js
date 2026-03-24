'use client'

import Link from 'next/link'

export default function PatientTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200 mt-4">
      <nav className="-mb-px flex space-x-8 px-4 sm:px-6 lg:px-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                Active
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
