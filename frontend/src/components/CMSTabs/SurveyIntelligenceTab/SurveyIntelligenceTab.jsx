import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Brain,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Activity
} from 'lucide-react';
import { TabEmpty } from '../shared';
import './SurveyIntelligenceTab.css';

/**
 * SurveyIntelligenceTab - Links to the full Survey Intelligence page
 *
 * Provides a gateway to the Survey Intelligence feature with preview of capabilities.
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

  // Check if facility has CCN
  if (!facility.ccn) {
    return (
      <div className="survey-intelligence-tab">
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '0.75rem',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem auto'
        }}>
          <AlertTriangle size={48} style={{ color: '#d97706', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
            No CMS Data Available
          </h3>
          <p style={{ color: '#a16207', fontSize: '0.875rem' }}>
            This facility does not have a CCN (CMS Certification Number) configured.
            Contact an administrator to link this facility to CMS data.
          </p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: AlertTriangle, label: 'Risk Score', description: 'Composite risk assessment with factor breakdown' },
    { icon: TrendingUp, label: 'Deficiency Trends', description: 'Worsening, persistent, and improving tags' },
    { icon: Activity, label: 'Clinical Systems', description: 'F-tags mapped to 7 audit systems' },
    { icon: BarChart3, label: 'Market Context', description: 'State trends and emerging risks' },
    { icon: Sparkles, label: 'Recommendations', description: 'AI-generated action items' },
  ];

  return (
    <div className="survey-intelligence-tab">
      {/* Main CTA Card */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        maxWidth: '700px',
        margin: '1.5rem auto'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
        }}>
          <Brain size={40} strokeWidth={1.5} style={{ color: '#fff' }} />
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: '0.5rem'
        }}>
          Survey Intelligence
        </h2>

        <p style={{
          color: '#64748b',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          maxWidth: '500px',
          margin: '0 auto 1.5rem'
        }}>
          View risk scores, deficiency trends, AI-powered recommendations, and market context for {facility.name}.
        </p>

        <Link
          to={`/survey-intelligence?facilityId=${facility.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            color: '#fff',
            borderRadius: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)';
          }}
        >
          Open Survey Intelligence
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Feature Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center',
        maxWidth: '700px',
        margin: '0 auto 1.5rem'
      }}>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#475569'
              }}
              title={feature.description}
            >
              <Icon size={16} style={{ color: '#7c3aed' }} />
              <span>{feature.label}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Preview */}
      <div style={{
        backgroundColor: '#faf5ff',
        border: '1px solid #e9d5ff',
        borderRadius: '0.5rem',
        padding: '1rem 1.5rem',
        maxWidth: '500px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Brain size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
        <p style={{ fontSize: '0.875rem', color: '#6b21a8', margin: 0 }}>
          Survey Intelligence analyzes CMS data to identify risk patterns and provide actionable recommendations for survey preparation.
        </p>
      </div>
    </div>
  );
};

export default SurveyIntelligenceTab;
