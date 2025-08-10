'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, AlertCircle, Plus } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { cn } from '@/lib/utils';

interface AddCustomerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Category {
  id: string;
  name: string;
  type?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [open, setOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const handleClose = onClose || (() => setOpen(false));
  const handleOpen = () => setOpen(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  
  // Dropdown data states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  
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

  // Predefined options for common fields
  const predefinedOptions = {
    metals: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Emerald', 'Sapphire', 'Mixed'],
    styles: ['Traditional', 'Modern', 'Contemporary', 'Vintage', 'Art Deco', 'Minimalist', 'Bridal', 'Casual', 'Luxury'],
    occasions: ['Wedding', 'Engagement', 'Birthday', 'Anniversary', 'Festival', 'Graduation', 'Corporate', 'Gift', 'Self-Purchase'],
    communities: ['Gujarati', 'Marwari', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayali', 'Maharashtrian', 'Rajasthani'],
    leadSources: ['Walk-in', 'Referral', 'Social Media', 'Website', 'Advertisement', 'Exhibition', 'Cold Call', 'Return Customer'],
    reasonsForVisit: ['Browsing', 'Purchase Intent', 'Repair', 'Exchange', 'Consultation', 'Price Inquiry', 'Product Viewing'],
    ageGroups: ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'],
    savingSchemes: ['Monthly', 'Quarterly', 'Yearly', 'Festival', 'Wedding', 'None'],
    budgetRanges: ['Under ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000', '₹1,00,000 - ₹2,50,000', 'Above ₹2,50,000']
  };

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isModalOpen) {
      loadDropdownData();
    }
  }, [isModalOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isModalOpen, handleClose]);

  const loadDropdownData = async () => {
    setDropdownLoading(true);
    try {
      // Load team members for assignment
      const teamResponse = await apiService.getTeamMembers();
      if (Array.isArray(teamResponse)) {
        setTeamMembers(teamResponse);
      }

      // Load product categories for preferences
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

  // Validation rules
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'first_name':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        break;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Enhanced Indian phone number validation
        const phoneRegex = /^(\+91[\-\s]?)?[789]\d{9}$/;
        if (!phoneRegex.test(value.trim().replace(/\s/g, ''))) {
          return 'Please enter a valid Indian phone number (10 digits starting with 7, 8, or 9)';
        }
        break;
      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        break;
      case 'interest':
        if (!value.trim()) return 'Interest is required';
        if (value.trim().length < 3) return 'Interest must be at least 3 characters';
        break;
      case 'visited_date':
        if (!value) return 'Visited date is required';
        break;
      case 'floor':
        if (value < 1 || value > 3) return 'Floor must be 1, 2, or 3';
        break;
      case 'city':
        if (value.trim() && value.trim().length < 2) return 'City must be at least 2 characters';
        break;
      case 'state':
        if (value.trim() && value.trim().length < 2) return 'State must be at least 2 characters';
        break;
    }
    return '';
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validate required fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change with validation
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // Handle field blur with validation
  const handleFieldBlur = (name: string) => {
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched: { [key: string]: boolean } = {};
      Object.keys(formData).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      return;
    }
    
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
      
      // Reset validation state
      setErrors({});
      setTouched({});
      
      if (isOpen !== undefined) {
        handleClose();
      } else {
        setOpen(false);
      }
      onSuccess?.();
      // Show success message in a more elegant way
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Customer created successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Error creating customer:', error);
      // Show error message in a more elegant way
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.textContent = 'Failed to create customer. Please try again.';
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Simple dropdown component using Select
  const SimpleDropdown = ({ 
    value, 
    onValueChange, 
    options, 
    placeholder, 
    label,
    loading = false,
    required = false,
    error = ''
  }: {
    value: string;
    onValueChange: (value: string) => void;
    options: string[];
    placeholder: string;
    label: string;
    loading?: boolean;
    required?: boolean;
    error?: string;
  }) => {
    // Filter out empty strings and undefined values
    const validOptions = options.filter(option => option && option.trim() !== '');
    
    return (
      <div className="space-y-2">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
        <Select value={value || undefined} onValueChange={onValueChange} disabled={loading}>
          <SelectTrigger className={cn(error && "border-red-500 focus:ring-red-500")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {validOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    );
  };

  // Input field component with validation
  const FormInput = ({ 
    name, 
    label, 
    type = 'text', 
    placeholder = '', 
    required = false,
    ...props 
  }: {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    [key: string]: any;
  }) => {
    const error = errors[name];
    const isTouched = touched[name];
    
    return (
      <div className="space-y-2">
        <Label 
          htmlFor={name} 
          className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
        >
          {label}
        </Label>
        <Input
          id={name}
          type={type}
          value={formData[name as keyof typeof formData] || ''}
          onChange={(e) => handleFieldChange(name, e.target.value)}
          onBlur={() => handleFieldBlur(name)}
          placeholder={placeholder}
          className={cn(
            error && isTouched && "border-red-500 focus:ring-red-500",
            "transition-colors"
          )}
          {...props}
        />
        {error && isTouched && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Trigger Button - only show when not controlled externally */}
      {isOpen === undefined && (
        <Button onClick={handleOpen} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      )}
      
      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
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
                  <FormInput
                    name="first_name"
                    label="First Name"
                    placeholder="e.g., Priya"
                    required
                  />
                  <FormInput
                    name="last_name"
                    label="Last Name"
                    placeholder="e.g., Sharma"
                  />
                  <FormInput
                    name="phone"
                    label="Phone"
                    placeholder="+91 98XXXXXX00"
                    required
                  />
                  <FormInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="priya@example.com"
                  />
                  <FormInput
                    name="interest"
                    label="Interest"
                    placeholder="e.g., Gold Necklace"
                    required
                  />
                  <FormInput
                    name="visited_date"
                    label="Visited Date"
                    type="date"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Floor</Label>
                    <Select 
                      value={formData.floor.toString()} 
                      onValueChange={(v) => handleFieldChange('floor', parseInt(v))}
                    >
                      <SelectTrigger className={cn(
                        errors.floor && touched.floor && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Floor 1</SelectItem>
                        <SelectItem value="2">Floor 2</SelectItem>
                        <SelectItem value="3">Floor 3</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.floor && touched.floor && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.floor}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleFieldChange('status', value)}
                    >
                      <SelectTrigger className={cn(
                        errors.status && touched.status && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && touched.status && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.status}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select 
                      value={formData.assigned_to || 'unassigned'} 
                      onValueChange={(value) => handleFieldChange('assigned_to', value === 'unassigned' ? undefined : value)}
                    >
                      <SelectTrigger disabled={dropdownLoading}>
                        <SelectValue placeholder={dropdownLoading ? "Loading..." : "Select team member"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dropdownLoading && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading team members...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Address</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="address"
                    label="Street Address"
                    placeholder="123, Diamond Lane"
                  />
                  <SimpleDropdown
                    value={formData.city}
                    onValueChange={(value) => handleFieldChange('city', value)}
                    options={cities}
                    placeholder="Enter or select city"
                    label="City"
                    loading={dropdownLoading}
                    error={errors.city && touched.city ? errors.city : ''}
                  />
                  <SimpleDropdown
                    value={formData.state}
                    onValueChange={(value) => handleFieldChange('state', value)}
                    options={states}
                    placeholder="Enter or select state"
                    label="State"
                    loading={dropdownLoading}
                    error={errors.state && touched.state ? errors.state : ''}
                  />
                  <FormInput
                    name="country"
                    label="Country"
                    placeholder="India"
                    readOnly
                  />
                  <FormInput
                    name="catchment_area"
                    label="Catchment Area"
                    placeholder="South Mumbai, Bandra West"
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Personal</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="date_of_birth"
                    label="Date of Birth"
                    type="date"
                  />
                  <FormInput
                    name="anniversary_date"
                    label="Anniversary Date"
                    type="date"
                  />
                  <SimpleDropdown
                    value={formData.community}
                    onValueChange={(value) => handleFieldChange('community', value)}
                    options={predefinedOptions.communities}
                    placeholder="Select community"
                    label="Community"
                  />
                  <FormInput
                    name="mother_tongue"
                    label="Mother Tongue / Sub-community"
                  />
                </div>
              </div>

              {/* Demographics & Visit */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Demographics & Visit</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SimpleDropdown
                    value={formData.reason_for_visit}
                    onValueChange={(value) => handleFieldChange('reason_for_visit', value)}
                    options={predefinedOptions.reasonsForVisit}
                    placeholder="Select reason"
                    label="Reason for Visit"
                  />
                  <SimpleDropdown
                    value={formData.lead_source}
                    onValueChange={(value) => handleFieldChange('lead_source', value)}
                    options={predefinedOptions.leadSources}
                    placeholder="Select source"
                    label="Lead Source"
                  />
                  <SimpleDropdown
                    value={formData.age_of_end_user}
                    onValueChange={(value) => handleFieldChange('age_of_end_user', value)}
                    options={predefinedOptions.ageGroups}
                    placeholder="Select age group"
                    label="Age of End-User"
                  />
                  <SimpleDropdown
                    value={formData.saving_scheme}
                    onValueChange={(value) => handleFieldChange('saving_scheme', value)}
                    options={predefinedOptions.savingSchemes}
                    placeholder="Select scheme"
                    label="Saving Scheme"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Customer Preferences</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SimpleDropdown
                    value={formData.preferred_metal}
                    onValueChange={(value) => handleFieldChange('preferred_metal', value)}
                    options={predefinedOptions.metals}
                    placeholder="Select metal"
                    label="Preferred Metal"
                  />
                  <SimpleDropdown
                    value={formData.preferred_style}
                    onValueChange={(value) => handleFieldChange('preferred_style', value)}
                    options={predefinedOptions.styles}
                    placeholder="Select style"
                    label="Preferred Style"
                  />
                  <SimpleDropdown
                    value={formData.preferred_occasion}
                    onValueChange={(value) => handleFieldChange('preferred_occasion', value)}
                    options={predefinedOptions.occasions}
                    placeholder="Select occasion"
                    label="Occasion"
                  />
                  <SimpleDropdown
                    value={formData.budget}
                    onValueChange={(value) => handleFieldChange('budget', value)}
                    options={predefinedOptions.budgetRanges}
                    placeholder="Select budget range"
                    label="Budget"
                  />
                </div>
              </div>

              {/* Follow-up & Summary */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Follow-up & Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="next_follow_up"
                    label="Next Follow-up Date"
                    type="date"
                  />
                  <div className="space-y-2">
                    <Label>Summary Notes</Label>
                    <Textarea 
                      rows={3} 
                      value={formData.summary_notes} 
                      onChange={(e) => handleFieldChange('summary_notes', e.target.value)} 
                      placeholder="Key discussion points, items shown, next steps..." 
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {formData.summary_notes.length}/500 characters
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea 
                  rows={3} 
                  value={formData.notes} 
                  onChange={(e) => handleFieldChange('notes', e.target.value)} 
                  placeholder="Internal notes" 
                />
                <div className="text-xs text-gray-500 text-right">
                  {formData.notes.length}/500 characters
                </div>
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