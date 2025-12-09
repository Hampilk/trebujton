import React from 'react';

interface ConfidenceGaugeProps {
    confidence: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence }) => {
    const percentage = Math.min(Math.max(confidence * 100, 0), 100);
    
    // Determine color based on confidence level
    const getColor = (value: number): string => {
        if (value >= 75) return '#10b981'; // green
        if (value >= 50) return '#f59e0b'; // amber
        if (value >= 25) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    const gaugeColor = getColor(percentage);

    return (
        <div className="relative w-16 h-16">
            {/* Background circle */}
            <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                style={{ transform: 'rotate(-90deg)' }}
            >
                {/* Background arc */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    opacity="0.2"
                    className="text-gray-300 dark:text-gray-600"
                />
                
                {/* Progress arc */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="8"
                    strokeDasharray={`${(percentage / 100) * 282.7} 282.7`}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dasharray 0.3s ease',
                    }}
                />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div 
                        className="text-sm font-bold"
                        style={{ color: gaugeColor }}
                    >
                        {percentage.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfidenceGauge;
