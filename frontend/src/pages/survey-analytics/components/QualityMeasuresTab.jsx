import { useState, useEffect } from 'react';
import {
  Star,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Users,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getQualityMeasures } from '../../../api/cms';

// Star rating colors based on CMS 5-star system
const STAR_COLORS = {
  5: '#10B981', // green
  4: '#84CC16', // lime
  3: '#EAB308', // yellow
  2: '#F97316', // orange
  1: '#EF4444', // red
};

const STAR_BG_COLORS = {
  5: 'bg-green-50 border-green-200',
  4: 'bg-lime-50 border-lime-200',
  3: 'bg-yellow-50 border-yellow-200',
  2: 'bg-orange-50 border-orange-200',
  1: 'bg-red-50 border-red-200',
};

export function QualityMeasuresTab({ ccn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ccn) {
      loadQualityMeasures();
    }
  }, [ccn]);

  const loadQualityMeasures = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getQualityMeasures(ccn);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load quality measures');
      }
    } catch (err) {
      console.error('Error loading quality measures:', err);
      setError('Failed to load quality measures data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No quality measure data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { facility, stateAverage, nationalAverage, measures } = data;

  return (
    <div className="space-y-6">
      {/* QM Rating Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Measure Ratings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LargeStarRatingCard
            title="Overall QM Rating"
            rating={facility?.qualityMeasureRating}
            primary
          />
          <LargeStarRatingCard
            title="Long-Stay QM Rating"
            rating={facility?.longStayQmRating}
            subtitle="Residents staying 100+ days"
          />
          <LargeStarRatingCard
            title="Short-Stay QM Rating"
            rating={facility?.shortStayQmRating}
            subtitle="Residents staying <100 days"
          />
        </div>
      </div>

      {/* Comparison Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Benchmark Comparison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ComparisonCard
            title="This Facility"
            rating={facility?.qualityMeasureRating}
            subtitle={facility?.facilityName}
            highlight
          />
          <ComparisonCard
            title="State Average"
            rating={stateAverage?.avgQmRating}
            subtitle={`${facility?.state || 'State'} (${stateAverage?.facilityCount || 0} facilities)`}
            comparison={compareRatings(facility?.qualityMeasureRating, stateAverage?.avgQmRating)}
          />
          <ComparisonCard
            title="National Average"
            rating={nationalAverage?.avgQmRating}
            subtitle={`${nationalAverage?.facilityCount?.toLocaleString() || 0} facilities`}
            comparison={compareRatings(facility?.qualityMeasureRating, nationalAverage?.avgQmRating)}
          />
        </div>
      </div>

      {/* Long-Stay vs Short-Stay Comparison */}
      {(stateAverage?.avgLongStayQm || stateAverage?.avgShortStayQm) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stay Type Comparison</h2>
          <Card>
            <CardContent className="py-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Measure</th>
                      <th className="text-center py-2 px-4 text-sm font-medium text-gray-500">Facility</th>
                      <th className="text-center py-2 px-4 text-sm font-medium text-gray-500">State Avg</th>
                      <th className="text-center py-2 px-4 text-sm font-medium text-gray-500">National Avg</th>
                      <th className="text-center py-2 px-4 text-sm font-medium text-gray-500">vs National</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">Long-Stay QM Rating</td>
                      <td className="py-3 px-4 text-center">
                        <RatingDisplay rating={facility?.longStayQmRating} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">
                          {formatRating(stateAverage?.avgLongStayQm)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">
                          {formatRating(nationalAverage?.avgLongStayQm)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ComparisonIndicator
                          facility={facility?.longStayQmRating}
                          benchmark={nationalAverage?.avgLongStayQm}
                          higherIsBetter={true}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">Short-Stay QM Rating</td>
                      <td className="py-3 px-4 text-center">
                        <RatingDisplay rating={facility?.shortStayQmRating} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">
                          {formatRating(stateAverage?.avgShortStayQm)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">
                          {formatRating(nationalAverage?.avgShortStayQm)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ComparisonIndicator
                          facility={facility?.shortStayQmRating}
                          benchmark={nationalAverage?.avgShortStayQm}
                          higherIsBetter={true}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quality Measures Grid - if individual measures available */}
      {measures && measures.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Individual Quality Measures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {measures.map((measure, index) => (
              <QualityMeasureCard key={index} measure={measure} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Detailed Quality Measures</p>
              <p className="text-sm text-gray-500 mt-1">
                Individual quality measure data (falls, pressure ulcers, etc.) is not available in this view.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Visit CMS Care Compare for detailed quality measure information.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Interpretation */}
      <RatingInterpretationGuide />
    </div>
  );
}

function LargeStarRatingCard({ title, rating, subtitle, primary }) {
  const numRating = parseInt(rating) || 0;
  const color = STAR_COLORS[numRating] || '#9CA3AF';
  const bgClass = primary
    ? STAR_BG_COLORS[numRating] || 'bg-gray-50 border-gray-200'
    : 'bg-white border-gray-200';

  return (
    <Card className={`${bgClass} border`}>
      <CardContent className="py-6 text-center">
        <p className="text-sm text-gray-600 font-medium mb-3">{title}</p>
        <div className="flex justify-center items-center gap-1 mb-2">
          {rating ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-7 w-7"
                  fill={i < numRating ? color : 'none'}
                  stroke={i < numRating ? color : '#D1D5DB'}
                />
              ))}
            </>
          ) : (
            <span className="text-gray-400 text-sm">Not rated</span>
          )}
        </div>
        {rating && (
          <span
            className="text-2xl font-bold"
            style={{ color }}
          >
            {rating} Stars
          </span>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonCard({ title, rating, subtitle, highlight, comparison }) {
  const numRating = parseFloat(rating) || 0;
  const displayRating = Number.isInteger(numRating) ? numRating : numRating.toFixed(1);
  const color = STAR_COLORS[Math.round(numRating)] || '#9CA3AF';

  return (
    <Card className={highlight ? 'border-blue-300 bg-blue-50' : ''}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-3xl font-bold"
                style={{ color }}
              >
                {rating ? displayRating : '--'}
              </span>
              {rating && (
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      fill={i < Math.round(numRating) ? color : 'none'}
                      stroke={i < Math.round(numRating) ? color : '#D1D5DB'}
                    />
                  ))}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1 truncate max-w-[180px]" title={subtitle}>
                {subtitle}
              </p>
            )}
          </div>
          {comparison && (
            <div className={`p-2 rounded-full ${comparison.bgClass}`}>
              {comparison.icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RatingDisplay({ rating }) {
  if (!rating) return <span className="text-gray-400">--</span>;

  const numRating = parseInt(rating);
  const color = STAR_COLORS[numRating] || '#9CA3AF';

  return (
    <div className="inline-flex items-center gap-1">
      <Star className="h-4 w-4" fill={color} stroke={color} />
      <span className="font-semibold" style={{ color }}>{rating}</span>
    </div>
  );
}

function ComparisonIndicator({ facility, benchmark, higherIsBetter = true }) {
  if (!facility || !benchmark) {
    return <span className="text-gray-400">--</span>;
  }

  const diff = parseFloat(facility) - parseFloat(benchmark);
  const isPositive = higherIsBetter ? diff > 0 : diff < 0;
  const isNeutral = Math.abs(diff) < 0.1;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500">
        <Minus className="h-4 w-4" />
        Same
      </span>
    );
  }

  if (isPositive) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        +{Math.abs(diff).toFixed(1)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-red-600">
      <TrendingDown className="h-4 w-4" />
      {diff.toFixed(1)}
    </span>
  );
}

function QualityMeasureCard({ measure }) {
  const { name, facilityScore, stateAverage, nationalAverage, icon: IconComponent } = measure;
  const Icon = IconComponent || Heart;

  const comparison = facilityScore != null && nationalAverage != null
    ? facilityScore <= nationalAverage ? 'better' : 'worse'
    : null;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{name}</span>
          </div>
          {comparison && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              comparison === 'better'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {comparison === 'better' ? 'Better' : 'Worse'}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {facilityScore != null ? `${facilityScore}%` : '--'}
            </p>
            <p className="text-xs text-gray-500">Facility</p>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-600">
              {stateAverage != null ? `${stateAverage}%` : '--'}
            </p>
            <p className="text-xs text-gray-500">State</p>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-600">
              {nationalAverage != null ? `${nationalAverage}%` : '--'}
            </p>
            <p className="text-xs text-gray-500">National</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingInterpretationGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Understanding QM Ratings</span>
        </div>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What are Quality Measures?</h4>
                <p className="text-sm text-gray-600">
                  Quality Measures (QM) are calculated from MDS (Minimum Data Set) assessments
                  and measure health outcomes and care processes for nursing home residents.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Long-Stay vs Short-Stay</h4>
                <p className="text-sm text-gray-600">
                  <strong>Long-Stay:</strong> Residents who have been in the facility for 100+ days.
                  <br />
                  <strong>Short-Stay:</strong> Residents staying less than 100 days, typically for rehabilitation.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Star Rating Scale</h4>
              <div className="flex flex-wrap gap-4">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <Star
                      className="h-5 w-5"
                      fill={STAR_COLORS[rating]}
                      stroke={STAR_COLORS[rating]}
                    />
                    <span className="text-sm text-gray-600">
                      {rating === 5 && 'Much Above Average'}
                      {rating === 4 && 'Above Average'}
                      {rating === 3 && 'Average'}
                      {rating === 2 && 'Below Average'}
                      {rating === 1 && 'Much Below Average'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://www.medicare.gov/care-compare/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Visit CMS Care Compare for more information →
              </a>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function compareRatings(facility, benchmark) {
  if (!facility || !benchmark) return null;

  const diff = parseFloat(facility) - parseFloat(benchmark);
  const isPositive = diff >= 0;

  return {
    bgClass: isPositive ? 'bg-green-100' : 'bg-red-100',
    icon: isPositive
      ? <TrendingUp className="h-5 w-5 text-green-600" />
      : <TrendingDown className="h-5 w-5 text-red-600" />,
  };
}

function formatRating(value) {
  if (value == null) return '--';
  const num = parseFloat(value);
  return num.toFixed(1);
}

export default QualityMeasuresTab;
