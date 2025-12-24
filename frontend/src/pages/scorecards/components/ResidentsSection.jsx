import { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

/**
 * ResidentsSection - Manage residents reviewed for a system
 */
export function ResidentsSection({
  residents = [],
  onAdd,
  onRemove,
  disabled = false,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [initials, setInitials] = useState('');
  const [patientRecordNumber, setPatientRecordNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!initials.trim()) {
      setError('Initials are required');
      return;
    }
    if (initials.length > 3) {
      setError('Initials must be 3 characters or less');
      return;
    }

    // Add resident
    onAdd({
      initials: initials.trim().toUpperCase(),
      patientRecordNumber: patientRecordNumber.trim() || null,
    });

    // Reset form
    setInitials('');
    setPatientRecordNumber('');
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setInitials('');
    setPatientRecordNumber('');
    setError('');
    setShowAddForm(false);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            Residents Reviewed
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({residents.length})
            </span>
          </CardTitle>
          {!disabled && !showAddForm && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Resident
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-3">
        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Initials *"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.slice(0, 3))}
                  placeholder="ABC"
                  maxLength={3}
                  error={error && !initials.trim() ? error : undefined}
                  autoFocus
                />
              </div>
              <div>
                <Input
                  label="Patient Record #"
                  value={patientRecordNumber}
                  onChange={(e) => setPatientRecordNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm">
                  Add
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
            {error && initials.trim() && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>
        )}

        {/* Residents table */}
        {residents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No residents added yet. Click "Add Resident" to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initials
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Record #
                  </th>
                  {!disabled && (
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Remove
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {residents.map((resident, idx) => (
                  <tr key={resident.id || idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                      {resident.initials}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {resident.patientRecordNumber || '—'}
                    </td>
                    {!disabled && (
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onRemove(resident.id || idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove resident"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
