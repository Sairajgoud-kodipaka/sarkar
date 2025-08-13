"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService, Client, TeamMember } from "@/lib/api-service";
import { Category } from "@/types";

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Client | null;
  onCustomerUpdated: () => void;
}

export function EditCustomerModal({ open, onClose, customer, onCustomerUpdated }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    // Basic
    first_name: "",
    last_name: "",
    name: "",
    phone: "",
    email: "",
    interest: "",
    floor: 1,
    visited_date: "",
    status: "lead" as "active" | "inactive" | "lead" | "prospect" | "customer" | "vip",
    assigned_to: undefined as string | undefined,
    // Address
    address: "",
    city: "",
    state: "",
    country: "India",
    catchment_area: "",
    // Personal
    date_of_birth: "",
    anniversary_date: "",
    community: "",
    mother_tongue: "",
    // Visit & demographics
    reason_for_visit: "",
    lead_source: "",
    age_of_end_user: "",
    saving_scheme: "",
    // Preferences
    preferred_metal: "",
    preferred_style: "",
    preferred_occasion: "",
    budget: "",
    // Follow-up & summary
    next_follow_up: "",
    summary_notes: "",
    // Notes
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dropdown data states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  useEffect(() => {
    if (customer && open) {
      // Parse full name into first and last name if not already set
      let firstName = customer.first_name || "";
      let lastName = customer.last_name || "";
      
      // If first_name and last_name are empty but name exists, try to parse it
      if ((!firstName || !lastName) && customer.name) {
        const nameParts = customer.name.trim().split(' ');
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' '); // Handle multiple last names
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = "";
        }
      }
      
      setFormData({
        // Basic
        first_name: firstName,
        last_name: lastName,
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        interest: customer.interest || "",
        floor: customer.floor || 1,
        visited_date: customer.visited_date || "",
        status: customer.status || "lead",
        assigned_to: customer.assigned_to,
        // Address
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "India",
        catchment_area: customer.catchment_area || "",
        // Personal
        date_of_birth: customer.date_of_birth || "",
        anniversary_date: customer.anniversary_date || "",
        community: customer.community || "",
        mother_tongue: customer.mother_tongue || "",
        // Visit & demographics
        reason_for_visit: customer.reason_for_visit || "",
        lead_source: customer.lead_source || "",
        age_of_end_user: customer.age_of_end_user || "",
        saving_scheme: customer.saving_scheme || "",
        // Preferences
        preferred_metal: customer.preferred_metal || "",
        preferred_style: customer.preferred_style || "",
        preferred_occasion: customer.preferred_occasion || "",
        budget: customer.budget || "",
        // Follow-up & summary
        next_follow_up: customer.next_follow_up || "",
        summary_notes: customer.summary_notes || "",
        // Notes
        notes: customer.notes || "",
      });
      
      // Load dropdown data
      loadDropdownData();
    }
  }, [customer, open]);

  const loadDropdownData = async () => {
    setDropdownLoading(true);
    try {
      // Load team members
      const teamResponse = await apiService.getTeamMembers();
      if (Array.isArray(teamResponse)) {
        setTeamMembers(teamResponse);
      }

      // Load categories
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      }

      // Load cities and states from existing customer data (you can enhance this with a dedicated API)
      const customersResponse = await apiService.getAllCustomers();
      if (customersResponse.success && customersResponse.data) {
        const customers = Array.isArray(customersResponse.data) ? customersResponse.data : [];
        const uniqueCities = [...new Set(customers.filter(c => c.city && c.city.trim() !== '').map(c => c.city))];
        const uniqueStates = [...new Set(customers.filter(c => c.state && c.state.trim() !== '').map(c => c.state))];
        setCities(uniqueCities.sort());
        setStates(uniqueStates.sort());
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-update the full name when first_name or last_name changes
      if (field === 'first_name' || field === 'last_name') {
        const firstName = field === 'first_name' ? value : prev.first_name;
        const lastName = field === 'last_name' ? value : prev.last_name;
        newData.name = `${firstName || ''} ${lastName || ''}`.trim();
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!customer) return;

    try {
      setSaving(true);
      
      const response = await apiService.updateClient(String(customer.id), formData);
      
      if (response.success) {
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
      <DialogContent className="sm:max-w-4xl w-full sm:rounded-lg rounded-t-2xl sm:mx-4 mx-0 sm:max-h-[90vh] h-[92dvh] sm:h-auto overflow-y-auto">
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
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input 
                  placeholder="Full name (auto-generated)" 
                  value={formData.name}
                  disabled
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
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interest</label>
                <Input 
                  placeholder="e.g., Gold rings, Diamond necklaces" 
                  value={formData.interest}
                  onChange={(e) => handleInputChange('interest', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Floor</label>
                <Select value={String(formData.floor)} onValueChange={(value) => handleInputChange('floor', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ground Floor</SelectItem>
                    <SelectItem value="2">First Floor</SelectItem>
                    <SelectItem value="3">Second Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visited Date</label>
                <Input 
                  type="date" 
                  value={formData.visited_date}
                  onChange={(e) => handleInputChange('visited_date', e.target.value)}
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
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                            <div>
                <label className="block text-sm font-medium mb-1">Assigned To</label>
                <Select value={formData.assigned_to || "unassigned"} onValueChange={(value) => handleInputChange('assigned_to', value === "unassigned" ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
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
                <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))
                    )}
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

          {/* Preferences */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Preferences</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Metal</label>
                <Select value={formData.preferred_metal} onValueChange={(value) => handleInputChange('preferred_metal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Metal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                    <SelectItem value="gemstone">Gemstone</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Style</label>
                <Select value={formData.preferred_style} onValueChange={(value) => handleInputChange('preferred_style', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="fusion">Fusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Occasion</label>
                <Select value={formData.preferred_occasion} onValueChange={(value) => handleInputChange('preferred_occasion', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="daily_wear">Daily Wear</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Range</label>
                <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_50k">Under ₹50,000</SelectItem>
                    <SelectItem value="50k_1l">₹50,000 - ₹1,00,000</SelectItem>
                    <SelectItem value="1l_2l">₹1,00,000 - ₹2,00,000</SelectItem>
                    <SelectItem value="2l_5l">₹2,00,000 - ₹5,00,000</SelectItem>
                    <SelectItem value="5l_10l">₹5,00,000 - ₹10,00,000</SelectItem>
                    <SelectItem value="above_10l">Above ₹10,00,000</SelectItem>
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

          {/* Additional Notes */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Additional Notes</div>
            <div>
              <label className="block text-sm font-medium mb-1">Internal Notes</label>
              <Textarea 
                placeholder="Additional internal notes, observations, or reminders..." 
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
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