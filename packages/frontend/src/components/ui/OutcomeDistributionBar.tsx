interface OutcomeDistributionBarProps {
  outcomes: {
    id: string;
    text: string;
    totalStake: number;
    color?: string;
  }[];
}

export function OutcomeDistributionBar({ outcomes }: OutcomeDistributionBarProps) {
  const totalStake = outcomes.reduce((sum, outcome) => sum + outcome.totalStake, 0);
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-yellow-500',
  ];

  return (
    <div className="space-y-3">
      {/* Distribution Bar */}
      <div className="flex h-8 rounded-lg overflow-hidden shadow-sm">
        {outcomes.map((outcome, index) => {
          const percentage = totalStake > 0 ? (outcome.totalStake / totalStake) * 100 : 0;
          const bgColor = outcome.color || colors[index % colors.length];
          
          return (
            <div
              key={outcome.id}
              className={`${bgColor} transition-all duration-300 flex items-center justify-center text-white text-sm font-semibold`}
              style={{ width: `${percentage}%` }}
              title={`${outcome.text}: ${percentage.toFixed(1)}%`}
            >
              {percentage >= 10 && `${percentage.toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {outcomes.map((outcome, index) => {
          const percentage = totalStake > 0 ? (outcome.totalStake / totalStake) * 100 : 0;
          const bgColor = outcome.color || colors[index % colors.length];
          
          return (
            <div key={outcome.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${bgColor}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{outcome.text}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
