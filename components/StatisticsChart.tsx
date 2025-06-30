import React from 'react';

interface StatisticsChartProps {
  verified: number;
  unverified: number;
  misleading: number;
  total: number;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ verified, unverified, misleading, total }) => {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  const data = [
    { value: verified, color: '#10B981', label: 'Verified', bgColor: '#D1FAE5' },
    { value: misleading, color: '#F59E0B', label: 'Misleading', bgColor: '#FEF3C7' },
    { value: unverified, color: '#EF4444', label: 'Unverified', bgColor: '#FEE2E2' },
  ].filter(d => d.value > 0);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const chartSize = 200;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        📊 Verification Results Overview
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative">
          <svg width={chartSize} height={chartSize} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="20"
            />
            
            {/* Data segments */}
            {data.map((item, index) => {
              const percent = (item.value / total) * 100;
              const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              
              accumulatedPercent += percent;
              
              return (
                <circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-in-out"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-800">{total}</div>
            <div className="text-sm text-gray-600 font-medium">Total Claims</div>
          </div>
        </div>

        {/* Legend and Statistics */}
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = Math.round((item.value / total) * 100);
            return (
              <div key={index} className="flex items-center justify-between min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{item.value}</span>
                  <span className="text-sm text-gray-500">({percentage}%)</span>
                </div>
              </div>
            );
          })}
          
          {/* Summary bars */}
          <div className="mt-6 space-y-2">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{item.label}</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
            <div className="text-sm font-medium text-green-800">Accuracy Rate</div>
            <div className="text-xl font-bold text-green-600">
              {Math.round((verified / total) * 100)}%
            </div>
          </div>
          
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
            <div className="text-sm font-medium text-amber-800">Questionable</div>
            <div className="text-xl font-bold text-amber-600">
              {Math.round(((misleading + unverified) / total) * 100)}%
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Total Processed</div>
            <div className="text-xl font-bold text-blue-600">{total}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;
