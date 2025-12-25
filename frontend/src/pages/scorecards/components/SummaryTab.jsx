import { useMemo } from 'react';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { calculateSystemTotal, calculateItemPoints } from './ScoreDisplay';

/**
 * SummaryTab - Overview of scorecard with all systems summary
 */
export function SummaryTab({ systems, onNavigateToSystem }) {
  // Calculate all stats
  const stats = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    let totalScore = 0;
    const systemScores = [];
    const incompleteItems = [];

    systems.forEach((system, systemIndex) => {
      const systemScore = calculateSystemTotal(system.items || []);
      totalScore += systemScore;

      let systemCompleted = true;
      const systemIncomplete = [];

      (system.items || []).forEach((item, itemIndex) => {
        totalItems++;
        const hasData = item.sampleSize && item.sampleSize > 0 &&
                       item.chartsMet !== null && item.chartsMet !== undefined;

        if (hasData) {
          completedItems++;
        } else {
          systemCompleted = false;
          systemIncomplete.push({
            systemIndex,
            itemIndex,
            itemNumber: item.itemNumber,
            criteriaText: item.criteriaText,
            issue: !item.sampleSize ? 'needs sample size' : 'needs charts met',
          });
        }
      });

      systemScores.push({
        systemNumber: system.systemNumber,
        systemName: system.systemName,
        score: systemScore,
        maxScore: 100,
        isComplete: systemCompleted,
        incompleteCount: systemIncomplete.length,
      });

      if (systemIncomplete.length > 0) {
        incompleteItems.push({
          systemNumber: system.systemNumber,
          systemName: system.systemName,
          systemIndex,
          items: systemIncomplete,
        });
      }
    });

    // Sort to find highest/lowest
    const sortedScores = [...systemScores].sort((a, b) => b.score - a.score);
    const highest = sortedScores[0];
    const lowest = sortedScores[sortedScores.length - 1];

    return {
      totalScore,
      maxScore: 700,
      percentage: Math.round((totalScore / 700) * 1000) / 10,
      totalItems,
      completedItems,
      systemScores,
      incompleteItems,
      highest,
      lowest,
      averageScore: Math.round((totalScore / systems.length) * 10) / 10,
    };
  }, [systems]);

  // Get score color class
  const getScoreColor = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 85) return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' };
    if (pct >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' };
    return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' };
  };

  const mainScoreColor = getScoreColor(stats.totalScore, stats.maxScore);

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Score
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${mainScoreColor.text}`}>
                  {stats.totalScore.toFixed(0)}
                </span>
                <span className="text-2xl text-gray-400">/ 700</span>
                <span className={`text-xl font-medium ${mainScoreColor.text}`}>
                  ({stats.percentage}%)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 max-w-md">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${mainScoreColor.bg} transition-all duration-500`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0</span>
                <span>175</span>
                <span>350</span>
                <span>525</span>
                <span>700</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Items Completed</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.completedItems}/{stats.totalItems}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg System Score</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.averageScore}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Highest System</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.highest?.score.toFixed(0)}/100
                </p>
                <p className="text-xs text-gray-500 truncate">
                  System {stats.highest?.systemNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lowest System</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.lowest?.score.toFixed(0)}/100
                </p>
                <p className="text-xs text-gray-500 truncate">
                  System {stats.lowest?.systemNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Systems Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Systems Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.systemScores.map((system, index) => {
              const color = getScoreColor(system.score, system.maxScore);
              return (
                <button
                  key={system.systemNumber}
                  onClick={() => onNavigateToSystem(index)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    hover:shadow-md hover:scale-[1.02]
                    ${system.isComplete ? 'border-green-200' : 'border-gray-200'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      System {system.systemNumber}
                    </span>
                    {system.isComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {system.incompleteCount} incomplete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 font-medium truncate mb-2">
                    {system.systemName}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color.bg}`}
                        style={{ width: `${(system.score / system.maxScore) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${color.text}`}>
                      {system.score.toFixed(0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      {stats.incompleteItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Incomplete Items ({stats.totalItems - stats.completedItems})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.incompleteItems.map((system) => (
                <div key={system.systemNumber} className="border-b border-gray-100 pb-3 last:border-0">
                  <button
                    onClick={() => onNavigateToSystem(system.systemIndex)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-primary-600"
                  >
                    System {system.systemNumber}: {system.systemName}
                    <span className="text-xs text-gray-500">
                      ({system.items.length} items)
                    </span>
                  </button>
                  <ul className="mt-1 ml-4 space-y-1">
                    {system.items.slice(0, 3).map((item) => (
                      <li key={item.itemNumber} className="text-xs text-gray-500">
                        Item {item.itemNumber}: {item.issue}
                      </li>
                    ))}
                    {system.items.length > 3 && (
                      <li className="text-xs text-gray-400">
                        +{system.items.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Complete Message */}
      {stats.incompleteItems.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-green-800">
              All Items Complete!
            </h3>
            <p className="text-sm text-green-600 mt-1">
              This scorecard is ready for review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
