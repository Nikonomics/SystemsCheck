import React from 'react';
import { Calendar, Clock, AlertTriangle, Info } from 'lucide-react';
import { TabEmpty } from '../shared';
import './SurveyIntelligenceTab.css';

/**
 * SurveyIntelligenceTab - Shows survey timing predictions and risk for a facility
 *
 * Note: This is a placeholder version for SystemsCheck.
 * Full survey intelligence features are available in SNFalyze.
 */
const SurveyIntelligenceTab = ({ facility }) => {
  // Show empty state if no facility selected
  if (!facility) {
    return (
      <TabEmpty
        icon={<Calendar size={48} strokeWidth={1.5} />}
        title="Select a Facility"
        message="Use the search above to select a facility and view survey intelligence."
      />
    );
  }

  return (
    <div className="survey-intelligence-tab">
      {/* Feature Coming Soon Card */}
      <div className="survey-coming-soon-card" style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '2rem auto'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#e0f2fe',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Clock size={40} strokeWidth={1.5} style={{ color: '#0284c7' }} />
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: '0.75rem'
        }}>
          Survey Intelligence Coming Soon
        </h2>

        <p style={{
          color: '#64748b',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          AI-powered survey timing predictions and risk analysis will be available in a future update.
          This feature helps you prepare by analyzing survey patterns in your area.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#475569'
          }}>
            <Calendar size={16} />
            <span>Survey Window Tracking</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#475569'
          }}>
            <AlertTriangle size={16} />
            <span>Risk Assessment</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#475569'
          }}>
            <Info size={16} />
            <span>Nearby Activity Alerts</span>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '0.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <Info size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} />
        <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
          <strong>For now:</strong> Use the Risk Analysis tab to view current deficiency patterns
          and historical survey data for this facility.
        </div>
      </div>
    </div>
  );
};

export default SurveyIntelligenceTab;
