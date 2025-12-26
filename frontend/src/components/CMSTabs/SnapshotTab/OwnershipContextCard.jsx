import React from 'react';
import { Building2, Users, MapPin } from 'lucide-react';

const MarketTeamCompanyCard = ({ facility }) => {
  if (!facility) return null;

  // Get market from county + state (CBSA not currently available)
  const market = facility.county && facility.state
    ? `${facility.county} County, ${facility.state}`
    : facility.county || facility.state || 'N/A';

  // Team and Company come from SystemsCheck facility data
  const teamName = facility.team?.name || 'Unassigned';
  const companyName = facility.company?.name || 'Unassigned';

  return (
    <div className="metrics-card ownership-context-card">
      <div className="metrics-card-header">
        <Building2 size={18} style={{ color: '#6b7280' }} />
        <h4>Market, Team & Company</h4>
      </div>

      <div className="ownership-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Market */}
        <div className="ownership-info-block">
          <span className="info-label">
            <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Market
          </span>
          <span className="info-value">{market}</span>
        </div>

        {/* Team */}
        <div className="ownership-info-block">
          <span className="info-label">
            <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Team
          </span>
          <span className="info-value" style={{ color: '#3b82f6' }}>{teamName}</span>
        </div>

        {/* Company */}
        <div className="ownership-info-block">
          <span className="info-label">
            <Building2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Company
          </span>
          <span className="info-value" style={{ color: '#22c55e' }}>{companyName}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketTeamCompanyCard;
