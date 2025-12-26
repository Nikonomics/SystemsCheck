import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, FileText, ArrowRight } from 'lucide-react';
import RiskExplainerCard from './RiskExplainerCard';
import CompositeRiskScore from './CompositeRiskScore';
import RegulatoryRiskCard from './RegulatoryRiskCard';
import StaffingRiskCard from './StaffingRiskCard';
import FinancialRiskCard from './FinancialRiskCard';
import RiskTrendCard from './RiskTrendCard';

const RiskAnalysisTab = ({ facility, benchmarks }) => {
  if (!facility) {
    return (
      <div className="placeholder-tab">
        <Shield size={48} strokeWidth={1.5} />
        <h3>Select a Facility</h3>
        <p>Use the search above to select a facility and view risk analysis.</p>
      </div>
    );
  }

  return (
    <div className="risk-analysis-tab">
      {/* Explainer (collapsible) */}
      <RiskExplainerCard />

      {/* Row 1: Composite Risk Score */}
      <CompositeRiskScore facility={facility} />

      {/* Row 2: Three risk breakdown cards */}
      <div className="risk-cards-row">
        <RegulatoryRiskCard facility={facility} benchmarks={benchmarks} />
        <StaffingRiskCard facility={facility} benchmarks={benchmarks} />
        <FinancialRiskCard facility={facility} benchmarks={benchmarks} />
      </div>

      {/* Row 3: Risk Trend */}
      <RiskTrendCard facility={facility} snapshots={facility.snapshots || []} />

      {/* Cross-Navigation Links */}
      {facility.ccn && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <Link
            to={`/survey-intelligence?facilityId=${facility.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#f3e8ff', borderRadius: '0.5rem' }}>
                <Brain size={20} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#1e293b' }}>Survey Intelligence</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Risk scores, trends & recommendations</p>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: '#7c3aed' }} />
          </Link>

          <Link
            to={`/survey-analytics?ccn=${facility.ccn}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
                <FileText size={20} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#1e293b' }}>Survey Analytics</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Full survey history & deficiency data</p>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: '#2563eb' }} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysisTab;
