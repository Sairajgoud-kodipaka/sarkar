"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService, Client } from "@/lib/api-service";

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Client | null;
  onCustomerUpdated: () => void;
}

export function EditCustomerModal({ open, onClose, customer, onCustomerUpdated }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    date_of_birth: "",
    anniversary_date: "",
    community: "",
    mother_tongue: "",
    reason_for_visit: "",
    lead_source: "",
    age_of_end_user: "",
    saving_scheme: "",
    catchment_area: "",
    next_follow_up: "",
    summary_notes: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer && open) {
      setFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "India",
        date_of_birth: customer.date_of_birth || "",
        anniversary_date: customer.anniversary_date || "",
        community: customer.community || "",
        mother_tongue: customer.mother_tongue || "",
        reason_for_visit: customer.reason_for_visit || "",
        lead_source: customer.lead_source || "",
        age_of_end_user: customer.age_of_end_user || "",
        saving_scheme: customer.saving_scheme || "",
        catchment_area: customer.catchment_area || "",
        next_follow_up: customer.next_follow_up || "",
        summary_notes: customer.summary_notes || "",
        status: customer.status || "",
      });
    }
  }, [customer, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!customer) return;

    try {
      setSaving(true);
      console.log('Updating customer data:', formData);
      
      const response = await apiService.updateClient(customer.id, formData);
      
      if (response.success) {
        console.log('Customer updated successfully:', response.data);
        alert('Customer updated successfully!');
        onCustomerUpdated();
        onClose();
      } else {
        console.error('Failed to update customer:', response);
        alert('Failed to update customer. Please try again.');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Basic Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <Input 
                  placeholder="First name" 
                  required 
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input 
                  placeholder="Last name" 
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <Input 
                  placeholder="+91 98XXXXXX00" 
                  required 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <Input 
                  placeholder="e.g., 123, Diamond Lane" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input 
                  placeholder="e.g., Mumbai" 
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MH">Maharashtra</SelectItem>
                    <SelectItem value="TG">Telangana</SelectItem>
                    <SelectItem value="KA">Karnataka</SelectItem>
                    <SelectItem value="AP">Andhra Pradesh</SelectItem>
                    <SelectItem value="DL">Delhi</SelectItem>
                    <SelectItem value="GJ">Gujarat</SelectItem>
                    <SelectItem value="RJ">Rajasthan</SelectItem>
                    <SelectItem value="TN">Tamil Nadu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Input value="India" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catchment Area</label>
                <Input 
                  placeholder="e.g., South Mumbai, Bandra West" 
                  value={formData.catchment_area}
                  onChange={(e) => handleInputChange('catchment_area', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Personal Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <Input 
                  type="date" 
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Anniversary Date</label>
                <Input 
                  type="date" 
                  value={formData.anniversary_date}
                  onChange={(e) => handleInputChange('anniversary_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Community</label>
                <Select value={formData.community} onValueChange={(value) => handleInputChange('community', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gujarati">Gujarati</SelectItem>
                    <SelectItem value="marwari">Marwari</SelectItem>
                    <SelectItem value="punjabi">Punjabi</SelectItem>
                    <SelectItem value="sindhi">Sindhi</SelectItem>
                    <SelectItem value="bengali">Bengali</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                    <SelectItem value="telugu">Telugu</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mother Tongue</label>
                <Input 
                  placeholder="e.g., Gujarati, Marwari Jain" 
                  value={formData.mother_tongue}
                  onChange={(e) => handleInputChange('mother_tongue', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Visit Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Visit</label>
                <Select value={formData.reason_for_visit} onValueChange={(value) => handleInputChange('reason_for_visit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Source</label>
                <Select value={formData.lead_source} onValueChange={(value) => handleInputChange('lead_source', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkin">Walk-in</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age of End User</label>
                <Select value={formData.age_of_end_user} onValueChange={(value) => handleInputChange('age_of_end_user', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-50">36-50</SelectItem>
                    <SelectItem value="51-65">51-65</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saving Scheme</label>
                <Select value={formData.saving_scheme} onValueChange={(value) => handleInputChange('saving_scheme', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Follow-up & Summary */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Follow-up & Summary</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
                <Input 
                  type="date" 
                  value={formData.next_follow_up}
                  onChange={(e) => handleInputChange('next_follow_up', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary Notes</label>
                <Textarea 
                  placeholder="Key discussion points, items shown, next steps..." 
                  rows={3}
                  value={formData.summary_notes}
                  onChange={(e) => handleInputChange('summary_notes', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 