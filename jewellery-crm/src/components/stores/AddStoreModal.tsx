'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api-service';
import { Loader2, X, UserPlus } from 'lucide-react';
import AddTeamMemberModal from '@/components/team/AddTeamMemberModal';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StoreFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  manager?: string; // UUID from team_members
  is_active: boolean;
}

interface UserOption {
  id: string; // UUID
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function AddStoreModal({ isOpen, onClose, onSuccess }: AddStoreModalProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    manager: undefined,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await apiService.getTeamMembers();
      const data = Array.isArray(response) ? response : [];
      // Map to the fields we need
      const options: UserOption[] = data.map((m: any) => ({
        id: m.id,
        first_name: m.name?.split(' ')[0] || m.first_name || '',
        last_name: m.name?.split(' ').slice(1).join(' ') || m.last_name || '',
        email: m.email,
        role: m.role,
      }));
      setTeamMembers(options);
      return options;
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setTeamMembers([]);
      return [] as UserOption[];
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createStore({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        manager: formData.manager,
        is_active: formData.is_active,
      });
      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: '',
          address: '',
          city: '',
          state: '',
          manager: undefined,
          is_active: true,
        });
      } else {
        setError(response.message || 'Failed to create store');
      }
    } catch (error) {
      console.error('Failed to create store:', error);
      setError('Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Add New Store</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter store name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter store address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={formData.manager || 'none'}
              onValueChange={async (value) => {
                if (value === '__add_new__') {
                  setShowAddManager(true);
                  return;
                }
                handleInputChange('manager', value && value !== 'none' ? value : undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <SelectItem value="loading" disabled>
                    Loading managers...
                  </SelectItem>
                ) : !Array.isArray(teamMembers) || teamMembers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No managers available
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">No Manager</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.role})
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__">
                      + Add New Manager
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Store</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Store'
              )}
            </Button>
          </div>
        </form>
      </div>
      {/* Inline Add Manager Modal */}
      <AddTeamMemberModal
        hideTrigger
        open={showAddManager}
        onOpenChange={(o) => setShowAddManager(o)}
        onSuccess={async (created) => {
          setShowAddManager(false);
          const options = await fetchTeamMembers();
          if (created?.email) {
            const match = options.find(o => o.email === created.email);
            if (match?.id) {
              handleInputChange('manager', match.id);
            }
          }
        }}
      />
    </div>
  );
} 