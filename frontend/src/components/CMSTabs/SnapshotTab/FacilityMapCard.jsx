import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Navigation, Map } from 'lucide-react';
import { getFacilityCompetitors } from '../../../api/cms';

const FacilityMapCard = ({ facility }) => {
  const [competitors, setCompetitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load competitors when facility changes
  useEffect(() => {
    if (!facility?.ccn) return;

    setIsLoading(true);
    getFacilityCompetitors(facility.ccn, 15, 15)
      .then(response => {
        if (response.success) {
          setCompetitors(response.competitors || []);
        }
      })
      .catch(error => {
        console.error('Error fetching competitors:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [facility?.ccn]);

  if (!facility) return null;

  const hasCoordinates = facility.latitude && facility.longitude;

  return (
    <div className="metrics-card facility-map-card">
      <div className="metrics-card-header">
        <MapPin size={18} className="status-neutral" />
        <h4>Location & Competitors</h4>
        {competitors.length > 0 && (
          <span className="competitor-count">{competitors.length} nearby</span>
        )}
      </div>

      {/* Map Placeholder */}
      <div className="map-placeholder" style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '0.375rem',
        padding: '2rem',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem'
      }}>
        <Map size={40} strokeWidth={1.5} style={{ color: '#9ca3af' }} />
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
          Map functionality coming soon
        </p>
        {hasCoordinates && (
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.75rem' }}>
            {facility.city}, {facility.state}
          </p>
        )}
      </div>

      {/* Competitor Summary */}
      {!isLoading && competitors.length > 0 && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Nearby Competitors (within 15 miles)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {competitors.slice(0, 5).map((comp) => (
              <div
                key={comp.ccn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <Building2 size={12} style={{ color: '#9ca3af' }} />
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {comp.facility_name}
                </span>
                {comp.distance_miles && (
                  <span style={{ color: '#9ca3af', marginLeft: '0.25rem' }}>
                    {parseFloat(comp.distance_miles).toFixed(1)}mi
                  </span>
                )}
              </div>
            ))}
            {competitors.length > 5 && (
              <span style={{ fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center' }}>
                +{competitors.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ marginTop: '0.75rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          Loading competitors...
        </div>
      )}
    </div>
  );
};

export default FacilityMapCard;
