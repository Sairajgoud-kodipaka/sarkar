'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface AddCustomerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [open, setOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const handleClose = onClose || (() => setOpen(false));
  const [loading, setLoading] = useState(false);
  
  // Extended form data to match enhanced customer schema
  const [formData, setFormData] = useState({
    // Basic
    first_name: '',
    last_name: '',
    name: '',
    phone: '',
    email: '',
    interest: '',
    floor: 1,
    visited_date: new Date().toISOString().split('T')[0],
    status: 'lead' as 'active' | 'inactive' | 'lead' | 'prospect' | 'customer' | 'vip',
    assigned_to: undefined as string | undefined,
    // Address
    address: '',
    city: '',
    state: '',
    country: 'India',
    catchment_area: '',
    // Personal
    date_of_birth: '',
    anniversary_date: '',
    community: '',
    mother_tongue: '',
    // Visit & demographics
    reason_for_visit: '',
    lead_source: '',
    age_of_end_user: '',
    saving_scheme: '',
    // Preferences
    preferred_metal: '',
    preferred_style: '',
    preferred_occasion: '',
    budget: '',
    // Follow-up & summary
    next_follow_up: '',
    summary_notes: '',
    // Notes
    notes: '',
  });

  const validateForm = () => {
    const fullNameProvided = !!formData.name.trim() || !!formData.first_name.trim();
    if (!fullNameProvided) {
      alert('First name or full name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return false;
    }
    if (!formData.interest.trim()) {
      alert('Interest is required');
      return false;
    }
    if (!formData.visited_date) {
      alert('Visited date is required');
      return false;
    }
    if (formData.floor < 1 || formData.floor > 3) {
      alert('Floor must be 1, 2, or 3');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Prepare extended customer data for Supabase (undefined/empty strings removed by API layer)
      const computedName = formData.name?.trim() || `${formData.first_name} ${formData.last_name}`.trim();
      const customerData = {
        ...formData,
        name: computedName,
      };

      await apiService.createCustomer(customerData);

      // Reset form to initial state
      setFormData({
        first_name: '',
        last_name: '',
        name: '',
        phone: '',
        email: '',
        interest: '',
        floor: 1,
        visited_date: new Date().toISOString().split('T')[0],
        status: 'lead',
        assigned_to: undefined,
        address: '',
        city: '',
        state: '',
        country: 'India',
        catchment_area: '',
        date_of_birth: '',
        anniversary_date: '',
        community: '',
        mother_tongue: '',
        reason_for_visit: '',
        lead_source: '',
        age_of_end_user: '',
        saving_scheme: '',
        preferred_metal: '',
        preferred_style: '',
        preferred_occasion: '',
        budget: '',
        next_follow_up: '',
        summary_notes: '',
        notes: '',
      });
      
      if (isOpen !== undefined) {
        handleClose();
      } else {
        setOpen(false);
      }
      onSuccess?.();
      alert('Customer created successfully!');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Customer / Visit</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Customer Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="e.g., Priya" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="e.g., Sharma" />
                  </div>
              <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98XXXXXX00" />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="priya@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interest *</Label>
                    <Input id="interest" value={formData.interest} onChange={(e) => setFormData({ ...formData, interest: e.target.value })} placeholder="e.g., Gold Necklace" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visited_date">Visited Date *</Label>
                    <Input id="visited_date" type="date" value={formData.visited_date} onChange={(e) => setFormData({ ...formData, visited_date: e.target.value })} />
                  </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="space-y-2">
                    <Label>Floor *</Label>
                    <Select value={formData.floor.toString()} onValueChange={(v) => setFormData({ ...formData, floor: parseInt(v) })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                      <SelectItem value="3">Floor 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Address</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123, Diamond Lane" />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="India" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catchment Area</Label>
                    <Input value={formData.catchment_area} onChange={(e) => setFormData({ ...formData, catchment_area: e.target.value })} placeholder="South Mumbai, Bandra West" />
                  </div>
                </div>
              </div>

              {/* Personal */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Personal</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Anniversary Date</Label>
                    <Input type="date" value={formData.anniversary_date} onChange={(e) => setFormData({ ...formData, anniversary_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Community</Label>
                    <Input value={formData.community} onChange={(e) => setFormData({ ...formData, community: e.target.value })} placeholder="Gujarati, Marwari, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother Tongue / Sub-community</Label>
                    <Input value={formData.mother_tongue} onChange={(e) => setFormData({ ...formData, mother_tongue: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Demographics & Visit */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Demographics & Visit</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reason for Visit</Label>
                    <Input value={formData.reason_for_visit} onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Source</Label>
                    <Input value={formData.lead_source} onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Age of End-User</Label>
                    <Input value={formData.age_of_end_user} onChange={(e) => setFormData({ ...formData, age_of_end_user: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Saving Scheme</Label>
                    <Input value={formData.saving_scheme} onChange={(e) => setFormData({ ...formData, saving_scheme: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Customer Preferences</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Metal</Label>
                    <Input value={formData.preferred_metal} onChange={(e) => setFormData({ ...formData, preferred_metal: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Style</Label>
                    <Input value={formData.preferred_style} onChange={(e) => setFormData({ ...formData, preferred_style: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Occasion</Label>
                    <Input value={formData.preferred_occasion} onChange={(e) => setFormData({ ...formData, preferred_occasion: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget</Label>
                    <Input value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Follow-up & Summary */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Follow-up & Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Next Follow-up Date</Label>
                    <Input type="date" value={formData.next_follow_up} onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })} />
                  </div>
              <div className="space-y-2">
                    <Label>Summary Notes</Label>
                    <Textarea rows={3} value={formData.summary_notes} onChange={(e) => setFormData({ ...formData, summary_notes: e.target.value })} placeholder="Key discussion points, items shown, next steps..." />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Internal notes" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}