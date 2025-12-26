/**
 * SurveyTimelineVisual Component
 *
 * Horizontal visual timeline showing surveys over the last 3 years.
 * Each survey is a dot positioned by date and colored by type.
 */

import { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  MessageSquareWarning,
  Flame,
  Bug
} from 'lucide-react';

/**
 * Survey type configuration
 */
const SURVEY_TYPE_CONFIG = {
  standard: {
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    ringColor: 'ring-blue-300',
    label: 'Standard Health',
    icon: ClipboardCheck
  },
  complaint: {
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    ringColor: 'ring-orange-300',
    label: 'Complaint',
    icon: MessageSquareWarning
  },
  fireSafety: {
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    ringColor: 'ring-red-300',
    label: 'Fire Safety',
    icon: Flame
  },
  infectionControl: {
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    ringColor: 'ring-purple-300',
    label: 'Infection Control',
    icon: Bug
  }
};

/**
 * Tooltip component for survey dot
 */
const SurveyTooltip = ({ survey, config }) => {
  const Icon = config.icon;

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3 w-3" />
          <span className="font-medium">{config.label}</span>
        </div>
        <div className="text-gray-300">
          {new Date(survey.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <div className="text-gray-300">
          {survey.deficiencyCount} deficienc{survey.deficiencyCount !== 1 ? 'ies' : 'y'}
        </div>
        {survey.hasIJ && (
          <div className="text-red-300 font-medium mt-1">Immediate Jeopardy</div>
        )}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  );
};

/**
 * Survey dot on timeline
 */
const SurveyDot = ({ survey, position, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine survey type from the survey data
  const surveyType = survey.type ||
    (survey.surveyType === 'Complaint' ? 'complaint' :
     survey.surveyType === 'Fire Safety' || survey.category === 'fireSafety' ? 'fireSafety' :
     survey.surveyType === 'Infection Control' || survey.isInfectionControl ? 'infectionControl' :
     'standard');

  const config = SURVEY_TYPE_CONFIG[surveyType] || SURVEY_TYPE_CONFIG.standard;

  // Size based on deficiency count
  const size = survey.deficiencyCount > 10 ? 'w-4 h-4' :
               survey.deficiencyCount > 5 ? 'w-3.5 h-3.5' :
               'w-3 h-3';

  return (
    <div
      className="absolute transform -translate-x-1/2"
      style={{ left: `${position}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onSelect?.(survey)}
        className={`${size} ${config.color} ${config.hoverColor} rounded-full transition-all cursor-pointer
          ${isSelected ? `ring-2 ${config.ringColor} ring-offset-2` : ''}
          ${survey.hasIJ ? 'ring-2 ring-red-400 ring-offset-1' : ''}
        `}
        title={`${config.label}: ${new Date(survey.date).toLocaleDateString()}`}
      />
      {isHovered && <SurveyTooltip survey={survey} config={config} />}
    </div>
  );
};

/**
 * Year label on timeline
 */
const YearLabel = ({ year, position }) => (
  <div
    className="absolute transform -translate-x-1/2 text-xs text-gray-500 font-medium"
    style={{ left: `${position}%`, bottom: '-24px' }}
  >
    {year}
  </div>
);

/**
 * Year tick mark on timeline
 */
const YearTick = ({ position }) => (
  <div
    className="absolute w-px h-3 bg-gray-300 transform -translate-x-1/2"
    style={{ left: `${position}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
  />
);

/**
 * Legend item
 */
const LegendItem = ({ config, label }) => {
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
      <Icon className="h-3 w-3 text-gray-500" />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
};

export function SurveyTimelineVisual({ surveys, onSurveySelect }) {
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  // Calculate date range (last 3 years)
  const { minDate, maxDate, yearMarkers, surveyPositions } = useMemo(() => {
    if (!surveys || surveys.length === 0) {
      return { minDate: null, maxDate: null, yearMarkers: [], surveyPositions: [] };
    }

    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31);

    // Calculate year markers
    const years = [];
    for (let year = threeYearsAgo.getFullYear(); year <= endDate.getFullYear(); year++) {
      const yearStart = new Date(year, 0, 1);
      const position = ((yearStart - threeYearsAgo) / (endDate - threeYearsAgo)) * 100;
      years.push({ year, position: Math.max(0, Math.min(100, position)) });
    }

    // Calculate survey positions
    const positions = surveys
      .filter(s => new Date(s.date) >= threeYearsAgo)
      .map(survey => {
        const surveyDate = new Date(survey.date);
        const position = ((surveyDate - threeYearsAgo) / (endDate - threeYearsAgo)) * 100;
        return {
          ...survey,
          position: Math.max(0, Math.min(100, position))
        };
      });

    return {
      minDate: threeYearsAgo,
      maxDate: endDate,
      yearMarkers: years,
      surveyPositions: positions
    };
  }, [surveys]);

  const handleSelect = (survey) => {
    setSelectedSurvey(survey);
    onSurveySelect?.(survey);
  };

  if (!surveys || surveys.length === 0 || surveyPositions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      {/* Timeline */}
      <div className="relative h-16 mb-8">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 rounded-full transform -translate-y-1/2" />

        {/* Year ticks */}
        {yearMarkers.map(({ year, position }) => (
          <YearTick key={year} position={position} />
        ))}

        {/* Survey dots */}
        {surveyPositions.map((survey, idx) => (
          <SurveyDot
            key={`${survey.date}-${idx}`}
            survey={survey}
            position={survey.position}
            onSelect={handleSelect}
            isSelected={selectedSurvey?.date === survey.date}
          />
        ))}

        {/* Year labels */}
        {yearMarkers.map(({ year, position }) => (
          <YearLabel key={`label-${year}`} year={year} position={position} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-gray-200">
        <LegendItem config={SURVEY_TYPE_CONFIG.standard} label="Standard" />
        <LegendItem config={SURVEY_TYPE_CONFIG.complaint} label="Complaint" />
        <LegendItem config={SURVEY_TYPE_CONFIG.fireSafety} label="Fire Safety" />
        <LegendItem config={SURVEY_TYPE_CONFIG.infectionControl} label="Infection Control" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-400 ring-2 ring-red-400 ring-offset-1"></div>
          <span className="text-xs text-gray-600">IJ Finding</span>
        </div>
      </div>
    </div>
  );
}

export default SurveyTimelineVisual;
