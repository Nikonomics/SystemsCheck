import React from 'react';
import { Map, Building2 } from 'lucide-react';

const CompetitorMap = ({ facility, competitors, onCompetitorClick }) => {
  const hasCoordinates = facility?.latitude && facility?.longitude;

  return (
    <div className="competitor-map-container" style={{
      backgroundColor: '#f3f4f6',
      borderRadius: '0.5rem',
      padding: '3rem 2rem',
      textAlign: 'center',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem'
    }}>
      <Map size={56} strokeWidth={1.5} style={{ color: '#9ca3af' }} />
      <div>
        <h3 style={{ color: '#374151', margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
          Map View Coming Soon
        </h3>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
          Interactive map with competitor locations will be available in a future update.
        </p>
      </div>

      {hasCoordinates && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#fff',
          borderRadius: '0.375rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
            Facility Location
          </div>
          <div style={{ fontSize: '0.875rem', color: '#374151' }}>
            {facility.city}, {facility.state}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {parseFloat(facility.latitude).toFixed(4)}, {parseFloat(facility.longitude).toFixed(4)}
          </div>
        </div>
      )}

      {competitors && competitors.length > 0 && (
        <div style={{
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <Building2 size={16} />
          <span>{competitors.length} competitors within radius</span>
        </div>
      )}
    </div>
  );
};

export default CompetitorMap;
