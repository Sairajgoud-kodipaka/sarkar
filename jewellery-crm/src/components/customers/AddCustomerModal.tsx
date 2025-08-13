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
import { useAuth } from '@/hooks/useAuth';

// Module-level constants to avoid recreating large arrays/objects on each render
const PREDEFINED_OPTIONS = {
    metals: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Emerald', 'Sapphire', 'Mixed', 'White Gold', 'Rose Gold', 'Yellow Gold'],
    styles: ['Traditional', 'Modern', 'Contemporary', 'Vintage', 'Art Deco', 'Minimalist', 'Bridal', 'Casual', 'Luxury', 'Ethnic', 'Fusion', 'Classic'],
    occasions: ['Wedding', 'Engagement', 'Birthday', 'Anniversary', 'Festival', 'Graduation', 'Corporate', 'Gift', 'Self-Purchase', 'House Warming', 'Baby Shower', 'Karva Chauth', 'Raksha Bandhan', 'Diwali', 'Holi', 'Eid', 'Christmas', 'Gurpurab', 'Paryushan', 'Navratri', 'Dussehra'],
    communities: ['Hindu', 'Muslim', 'Punjabi', 'Sindhi', 'Jain', 'Christian', 'Sikh', 'Buddhist', 'Parsi'],
    leadSources: ['Walk-in', 'Referral', 'Social Media', 'Website', 'Advertisement', 'Exhibition', 'Cold Call', 'Return Customer', 'Online Search', 'Print Media', 'TV/Radio', 'Word of Mouth', 'Employee Referral', 'Partner Referral'],
    reasonsForVisit: ['Browsing', 'Purchase Intent', 'Repair', 'Exchange', 'Consultation', 'Price Inquiry', 'Product Viewing', 'Custom Design', 'Maintenance', 'Insurance Claim', 'Resizing', 'Cleaning', 'Appraisal'],
    ageGroups: ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'],
    savingSchemes: ['Active', 'Inactive', 'Completed', 'Not Interested'],
    budgetRanges: ['Under ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000', '₹1,00,000 - ₹2,50,000', 'Above ₹2,50,000'],
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar'],
    states: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Andhra Pradesh', 'Punjab', 'Bihar', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Haryana', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir', 'Goa', 'Sikkim', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'],
    countries: ['India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Singapore', 'Germany', 'France', 'Japan'],
    motherTongues: ['Hindi', 'English', 'Gujarati', 'Marathi', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Urdu', 'Sanskrit', 'Sindhi', 'Konkani', 'Odia', 'Assamese', 'Manipuri', 'Khasi', 'Mizo', 'Naga'],
    preferredOccasions: ['Wedding', 'Engagement', 'Birthday', 'Anniversary', 'Festival', 'Graduation', 'Corporate', 'Gift', 'Self-Purchase', 'House Warming', 'Baby Shower', 'Karva Chauth', 'Raksha Bandhan', 'Diwali', 'Holi', 'Eid', 'Christmas', 'Gurpurab', 'Paryushan', 'Navratri', 'Dussehra'],
    preferredStyles: ['Traditional', 'Modern', 'Contemporary', 'Vintage', 'Art Deco', 'Minimalist', 'Bridal', 'Casual', 'Luxury', 'Ethnic', 'Fusion', 'Classic', 'Bohemian', 'Gothic', 'Renaissance', 'Baroque', 'Rococo', 'Victorian', 'Edwardian', 'Art Nouveau'],
    preferredMetals: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Emerald', 'Sapphire', 'Mixed', 'White Gold', 'Rose Gold', 'Yellow Gold', 'Palladium', 'Titanium', 'Tungsten', 'Stainless Steel', 'Brass', 'Copper', 'Bronze', 'Aluminum'],
    interests: ['Gold Necklace', 'Gold Ring', 'Gold Earrings', 'Gold Bracelet', 'Gold Chain', 'Gold Pendant', 'Silver Jewelry', 'Platinum Ring', 'Diamond Ring', 'Pearl Necklace', 'Ruby Ring', 'Emerald Ring', 'Sapphire Ring', 'Wedding Set', 'Engagement Ring', 'Bridal Jewelry', 'Traditional Jewelry', 'Modern Jewelry', 'Antique Jewelry', 'Custom Design', 'Jewelry Repair', 'Jewelry Exchange', 'Jewelry Consultation', 'Price Inquiry', 'Product Viewing', 'Maintenance Service'],
    customerTypes: ['Individual', 'Family', 'Corporate', 'Bulk Purchase', 'Wedding Party', 'Event Organizer', 'Jewelry Designer', 'Wholesaler', 'Retailer', 'Investor'],
    followUpPriorities: ['Low', 'Medium', 'High', 'Urgent', 'Critical']
} as const;

const CATCHMENT_AREAS_MAP: { [key: string]: string[] } = {
      'Maharashtra': [
        'South Mumbai', 'Bandra West', 'Andheri West', 'Juhu', 'Powai', 'Worli', 'Colaba', 'Nariman Point', 'BKC', 
        'Lower Parel', 'Mahalaxmi', 'Tardeo', 'Breach Candy', 'Altamount Road', 'Pedder Road', 'Malabar Hill', 
        'Cuffe Parade', 'Marine Drive', 'Girgaon', 'Bandra East', 'Santacruz', 'Vile Parle', 'Andheri East', 
        'Goregaon', 'Malad', 'Kandivali', 'Borivali', 'Dahisar', 'Thane', 'Navi Mumbai', 'Pune', 'Nashik'
      ],
      'Delhi': [
        'Connaught Place', 'Khan Market', 'South Extension', 'Greater Kailash', 'Hauz Khas', 'Vasant Vihar', 
        'Vasant Kunj', 'Dwarka', 'Rohini', 'Pitampura', 'Rajouri Garden', 'Janakpuri', 'Uttam Nagar', 
        'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Meerut', 'Sonipat', 'Panipat'
      ],
      'Karnataka': [
        'MG Road', 'Commercial Street', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Electronic City', 
        'Marathahalli', 'Bellandur', 'Sarjapur Road', 'Bannerghatta Road', 'JP Nagar', 'Jayanagar', 'Basavanagudi', 
        'Malleshwaram', 'Rajajinagar', 'Vijayanagar', 'Hebbal', 'Yelahanka', 'Yeshwanthpur'
      ],
      'Telangana': [
        'Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 
        'Miyapur', 'Dilsukhnagar', 'Secunderabad', 'Begumpet', 'Ameerpet', 'KPHB', 'Kukatpally', 'Manikonda', 
        'Gachibowli', 'Nanakramguda', 'Financial District', 'HITEC City', 'Cyberabad'
      ],
      'Tamil Nadu': [
        'T Nagar', 'Anna Nagar', 'Adyar', 'Mylapore', 'Besant Nagar', 'Alwarpet', 'Purasaiwalkam', 'Kilpauk', 
        'Aminjikarai', 'Vadapalani', 'Ashok Nagar', 'KK Nagar', 'Vadapalani', 'Porur', 'OMR', 'ECR', 
        'Tambaram', 'Chromepet', 'Pallavaram', 'St. Thomas Mount'
      ],
      'West Bengal': [
        'Park Street', 'Camac Street', 'Elgin Road', 'Ballygunge', 'Gariahat', 'Lake Gardens', 'Jodhpur Park', 
        'Bhowanipore', 'Alipore', 'New Alipore', 'Tollygunge', 'Behala', 'Dhakuria', 'Bansdroni', 'Garia', 
        'Sonarpur', 'Baruipur', 'Diamond Harbour', 'Kolkata Port', 'Howrah'
      ],
      'Gujarat': [
        'Navrangpura', 'Satellite', 'Vastrapur', 'Bodakdev', 'Thaltej', 'Jodhpur', 'Vejalpur', 'Gota', 
        'Chandkheda', 'Motera', 'Sarkhej', 'Juhapura', 'Vatva', 'Naroda', 'Odhav', 'Vastral', 'Bapunagar', 
        'Maninagar', 'Gomtipur', 'Kalupur'
      ],
      'Rajasthan': [
        'C Scheme', 'Malviya Nagar', 'C-Scheme', 'Bani Park', 'Sindhi Camp', 'Station Road', 'Mansarovar', 
        'Pratap Nagar', 'Sanganer', 'Vaishali Nagar', 'Raja Park', 'Adarsh Nagar', 'Shyam Nagar', 'Vidhyadhar Nagar', 
        'Jhotwara', 'Amber', 'Amer', 'Nahargarh', 'Jaigarh', 'Galtaji'
      ],
      'Uttar Pradesh': [
        'Gomti Nagar', 'Indira Nagar', 'Aliganj', 'Mahanagar', 'Rajajipuram', 'Vikas Nagar', 'Gomti Nagar Extension', 
        'Jankipuram', 'Sitapur Road', 'Hardoi Road', 'Rae Bareli Road', 'Sultanpur Road', 'Pratapgarh Road', 
        'Prayagraj Road', 'Varanasi Road', 'Gorakhpur Road', 'Bareilly Road', 'Moradabad Road', 'Aligarh Road'
      ],
      'Madhya Pradesh': [
        'Vijay Nagar', 'Palasia', 'Rajendra Nagar', 'Saket', 'Arera Colony', 'Shahpura', 'Bairagarh', 
        'Kolar Road', 'Hoshangabad Road', 'Bhopal-Indore Road', 'Raisen Road', 'Sehore Road', 'Vidisha Road', 
        'Guna Road', 'Ashok Nagar Road', 'Gwalior Road', 'Jhansi Road', 'Sagar Road', 'Chhindwara Road'
      ],
      'Andhra Pradesh': [
        'Benz Circle', 'Auto Nagar', 'One Town', 'Two Town', 'Three Town', 'Four Town', 'Five Town', 
        'Six Town', 'Seven Town', 'Eight Town', 'Nine Town', 'Ten Town', 'Gandhi Nagar', 'Krishna Nagar', 
        'Lakshmi Nagar', 'Saraswati Nagar', 'Durga Nagar', 'Kali Nagar', 'Brahma Nagar', 'Vishnu Nagar'
      ],
      'Punjab': [
        'Sector 17', 'Sector 22', 'Sector 35', 'Sector 37', 'Sector 38', 'Sector 39', 'Sector 40', 
        'Sector 41', 'Sector 42', 'Sector 43', 'Sector 44', 'Sector 45', 'Sector 46', 'Sector 47', 
        'Sector 48', 'Sector 49', 'Sector 50', 'Sector 51', 'Sector 52', 'Sector 53'
      ],
      'Bihar': [
        'Fraser Road', 'Beer Chand Patel Path', 'Boring Road', 'Exhibition Road', 'Station Road', 'Gandhi Maidan', 
        'Patna Junction', 'Rajendra Nagar', 'Kankarbagh', 'Rajeev Nagar', 'Anisabad', 'Danapur', 'Phulwari Sharif', 
        'Bihta', 'Maner', 'Fatuha', 'Bakhtiarpur', 'Barh', 'Mokama', 'Hajipur'
      ],
      'Odisha': [
        'Cuttack Road', 'Bhubaneswar-Puri Road', 'Bhubaneswar-Cuttack Road', 'Khandagiri', 'Kalinga Vihar', 
        'Sahid Nagar', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8', 
        'Unit 9', 'Unit 10', 'Unit 11', 'Unit 12', 'Unit 13', 'Unit 14', 'Unit 15'
      ],
      'Assam': [
        'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 
        'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 
        'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar', 
        'Fancy Bazaar', 'Uzan Bazaar', 'Paltan Bazaar'
      ]
    };
    
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
  const { user, isAuthenticated } = useAuth();
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
    // Product selection
    product_chosen: '',
    product_price: '',
    // Purchase Details
    main_category: '',
    design_selected: false,
    actual_purchase_amount: '',
    // Follow-up
    next_follow_up: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical',
    // Notes
    notes: '',
    visit_time: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night',
    customer_type: 'Individual' as 'Individual' | 'Family' | 'Corporate' | 'Bulk Purchase' | 'Wedding Party' | 'Event Organizer' | 'Jewelry Designer' | 'Wholesaler' | 'Retailer' | 'Investor',
  } as any);

  // Predefined options for common fields (now static module-level constant)
  const predefinedOptions = PREDEFINED_OPTIONS;

  // Product data state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Dynamic catchment areas based on selected state
  const getCatchmentAreas = (state: string) => {
    return CATCHMENT_AREAS_MAP[state] || [];
  };

  // Load dropdown data when modal opens
  const loadDropdownData = async () => {
    if (!isModalOpen) return;
    setDropdownLoading(true);
    setProductsLoading(true);
    try {
      // Static states (no network)
      setStates([...PREDEFINED_OPTIONS.states]);

      // Load categories via api service (Supabase-backed)
      const categoriesResp = await apiService.getCategories();
      if (categoriesResp?.success && Array.isArray(categoriesResp.data)) {
        setCategories(categoriesResp.data as Category[]);
      } else {
        setCategories([]);
      }

      // Load products for Product Chosen dropdown
      try {
        const productsResp = await apiService.getProducts({ status: 'active' });
        if (productsResp?.success && Array.isArray(productsResp.data)) {
          setProducts(productsResp.data);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      }

      // Load team members for "Assign To" (if available)
      try {
        const members = await apiService.getTeamMembers();
        if (Array.isArray(members)) {
          setTeamMembers(members as TeamMember[]);
        } else {
          setTeamMembers([]);
        }
      } catch {
        setTeamMembers([]);
      }
    } finally {
      setDropdownLoading(false);
      setProductsLoading(false);
    }
  };

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isModalOpen) {
      loadDropdownData();
    }
  }, [isModalOpen]);

  // Remove global Escape handler to avoid any focus interference
  // Modal is closed via the close button only

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
      case 'product_chosen':
        if (value && value.trim() && !products.find(p => p.id === value)) {
          return 'Please select a valid product';
        }
        break;
      case 'product_price':
        if (value && isNaN(Number(value))) {
          return 'Product price must be a valid number';
        }
        break;
      case 'actual_purchase_amount':
        if (value && isNaN(Number(value))) {
          return 'Purchase amount must be a valid number';
        }
        if (value && Number(value) < 0) {
          return 'Purchase amount cannot be negative';
        }
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
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Clear error but do NOT mark touched on every keystroke
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'state') {
      setFormData((prev: any) => ({ ...prev, catchment_area: '' }));
    }

    // Auto-fill product price when product is selected
    if (name === 'product_chosen') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        const price = selectedProduct.salePrice || selectedProduct.basePrice || selectedProduct.price || selectedProduct.selling_price || 0;
        setFormData((prev: any) => ({ 
          ...prev, 
          product_price: price.toString(),
          actual_purchase_amount: price.toString()
        }));
      }
    }
  };

  // Handle boolean field change specifically for checkboxes
  const handleBooleanFieldChange = (name: string, checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Mark touched only on change (boolean fields)
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
    
    // Check authentication before proceeding
    if (!isAuthenticated || !user) {
      // Show error message and redirect to login
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.textContent = 'Please log in to create customers. Redirecting to login...';
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        document.body.removeChild(errorMessage);
        window.location.href = '/login';
      }, 2000);
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
        product_chosen: '',
        product_price: '',
        main_category: '',
        design_selected: false,
        actual_purchase_amount: '',
        next_follow_up: '',
        priority: 'Medium',
        notes: '',
        visit_time: 'morning',
        customer_type: 'Individual',
      });

      // Reset product data
      setProducts([]);
      setProductsLoading(false);
      
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
      
      // Handle authentication errors specifically
      let errorText = 'Failed to create customer. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorText = 'Please log in to create customers. Redirecting to login...';
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.message.includes('user_context')) {
          errorText = 'Session expired. Please log in again. Redirecting to login...';
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          errorText = error.message || 'Failed to create customer. Please try again.';
        }
      }
      
      // Show error message in a more elegant way
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.textContent = errorText;
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced searchable dropdown component with keyboard shortcuts
  const SearchableDropdown = ({ 
    value, 
    onValueChange, 
    options, 
    placeholder, 
    label,
    loading = false,
    required = false,
    error = '',
    searchable = true
  }: {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly string[];
    placeholder: string;
    label: string;
    loading?: boolean;
    required?: boolean;
    error?: string;
    searchable?: boolean;
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Ensure unique, non-empty options and then filter by search term
    const uniqueOptions = Array.from(new Set(options.filter(o => !!o && o.trim() !== '')));
    const filteredOptions = uniqueOptions.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-2">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
        <div className="relative">
          <Select 
            value={value || ''} 
            onValueChange={onValueChange} 
            disabled={loading}
          >
            <SelectTrigger className={cn(error && "border-red-500 focus:ring-red-500")}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-60 w-full min-w-[200px]">
              {searchable && (
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, idx) => (
                    <SelectItem 
                      key={`${option}-${idx}`} 
                      value={option} 
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No options found
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    );
  };

  // Simple dropdown component for basic selections
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
    options: readonly string[];
    placeholder: string;
    label: string;
    loading?: boolean;
    required?: boolean;
    error?: string;
  }) => {
    return (
      <div className="space-y-2">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
        <Select 
          value={value || ''} 
          onValueChange={onValueChange} 
          disabled={loading}
        >
          <SelectTrigger className={cn(error && "border-red-500 focus:ring-red-500")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
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
            error && isTouched && "border-red-500 focus:ring-red-500"
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
        <div className="fixed inset-0 bg-black/50 flex sm:items-center items-end sm:justify-center justify-center z-50 sm:py-0 py-4">
          <div className="bg-white w-full sm:max-w-4xl sm:rounded-lg rounded-t-2xl sm:mx-4 mx-0 p-6 sm:max-h-[90vh] h-[92dvh] sm:h-auto overflow-y-auto shadow-xl">
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
                    <Label 
                      htmlFor="first_name" 
                      className="after:content-['*'] after:ml-0.5 after:text-red-500"
                    >
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      onBlur={() => handleFieldBlur('first_name')}
                    placeholder=""
                      className={cn(
                        errors.first_name && touched.first_name && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.first_name && touched.first_name && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.first_name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      onBlur={() => handleFieldBlur('last_name')}
                    placeholder=""
                      className={cn(
                        errors.last_name && touched.last_name && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.last_name && touched.last_name && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.last_name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="after:content-['*'] after:ml-0.5 after:text-red-500">Phone</Label>
                    <Input
                      id="phone"
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      onBlur={() => handleFieldBlur('phone')}
                    placeholder=""
                      className={cn(
                        errors.phone && touched.phone && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.phone && touched.phone && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                    type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                    placeholder=""
                      className={cn(
                        errors.email && touched.email && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.email && touched.email && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                  <SimpleDropdown
                    value={formData.interest}
                    onValueChange={(value: string) => handleFieldChange('interest', value)}
                    options={predefinedOptions.interests}
                    placeholder="Select interest"
                    label="Interest"
                    required
                    error={errors.interest && touched.interest ? errors.interest : ''}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="visited_date" className="after:content-['*'] after:ml-0.5 after:text-red-500">Visited Date</Label>
                    <Input
                      id="visited_date"
                    type="date"
                      value={formData.visited_date || ''}
                      onChange={(e) => handleFieldChange('visited_date', e.target.value)}
                      onBlur={() => handleFieldBlur('visited_date')}
                      className={cn(
                        errors.visited_date && touched.visited_date && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.visited_date && touched.visited_date && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.visited_date}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Visit Time</Label>
                    <Select 
                      value={formData.visit_time || 'morning'} 
                      onValueChange={(value) => handleFieldChange('visit_time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                        <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                        <SelectItem value="night">Night (8 PM - 9 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Customer Type</Label>
                    <Select 
                      value={formData.customer_type || 'Individual'} 
                      onValueChange={(value) => handleFieldChange('customer_type', value)}
                    >
                      <SelectTrigger className={cn(
                        errors.customer_type && touched.customer_type && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedOptions.customerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customer_type && touched.customer_type && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.customer_type}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Floor</Label>
                    <Select 
                      value={formData.floor?.toString() || '1'} 
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
                      value={formData.status || 'lead'} 
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
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={() => handleFieldBlur('address')}
                    placeholder="123, Diamond Lane"
                  />
                  </div>
                  <SearchableDropdown
                    value={formData.city}
                    onValueChange={(value: string) => handleFieldChange('city', value)}
                    options={predefinedOptions.cities}
                    placeholder="Enter or select city"
                    label="City"
                    loading={dropdownLoading}
                    error={errors.city && touched.city ? errors.city : ''}
                  />
                  <SearchableDropdown
                    value={formData.state}
                    onValueChange={(value: string) => handleFieldChange('state', value)}
                    options={predefinedOptions.states}
                    placeholder="Enter or select state"
                    label="State"
                    loading={dropdownLoading}
                    error={errors.state && touched.state ? errors.state : ''}
                  />
                  <SearchableDropdown
                    value={formData.country}
                    onValueChange={(value: string) => handleFieldChange('country', value)}
                    options={predefinedOptions.countries}
                    placeholder="Select country"
                    label="Country"
                  />
                  <SearchableDropdown
                    value={formData.catchment_area}
                    onValueChange={(value: string) => handleFieldChange('catchment_area', value)}
                    options={getCatchmentAreas(formData.state)}
                    placeholder="Select catchment area"
                    label="Catchment Area"
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Personal</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                    type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      onBlur={() => handleFieldBlur('date_of_birth')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anniversary_date">Anniversary Date</Label>
                    <Input
                      id="anniversary_date"
                    type="date"
                      value={formData.anniversary_date || ''}
                      onChange={(e) => handleFieldChange('anniversary_date', e.target.value)}
                      onBlur={() => handleFieldBlur('anniversary_date')}
                  />
                  </div>
                  <SimpleDropdown
                    value={formData.community}
                    onValueChange={(value: string) => handleFieldChange('community', value)}
                    options={predefinedOptions.communities}
                    placeholder="Select community"
                    label="Community"
                  />
                  <SimpleDropdown
                    value={formData.mother_tongue}
                    onValueChange={(value: string) => handleFieldChange('mother_tongue', value)}
                    options={predefinedOptions.motherTongues}
                    placeholder="Select mother tongue"
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
                    onValueChange={(value: string) => handleFieldChange('reason_for_visit', value)}
                    options={predefinedOptions.reasonsForVisit}
                    placeholder="Select reason"
                    label="Reason for Visit"
                  />
                  <SimpleDropdown
                    value={formData.lead_source}
                    onValueChange={(value: string) => handleFieldChange('lead_source', value)}
                    options={predefinedOptions.leadSources}
                    placeholder="Select source"
                    label="Lead Source"
                  />
                  <SimpleDropdown
                    value={formData.age_of_end_user}
                    onValueChange={(value: string) => handleFieldChange('age_of_end_user', value)}
                    options={predefinedOptions.ageGroups}
                    placeholder="Select age group"
                    label="Age of End-User"
                  />
                  <SimpleDropdown
                    value={formData.saving_scheme}
                    onValueChange={(value: string) => handleFieldChange('saving_scheme', value)}
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
                    onValueChange={(value: string) => handleFieldChange('preferred_metal', value)}
                    options={predefinedOptions.preferredMetals}
                    placeholder="Select metal"
                    label="Preferred Metal"
                  />
                  <SimpleDropdown
                    value={formData.preferred_style}
                    onValueChange={(value: string) => handleFieldChange('preferred_style', value)}
                    options={predefinedOptions.preferredStyles}
                    placeholder="Select style"
                    label="Preferred Style"
                  />
                  <SimpleDropdown
                    value={formData.preferred_occasion}
                    onValueChange={(value: string) => handleFieldChange('preferred_occasion', value)}
                    options={predefinedOptions.preferredOccasions}
                    placeholder="Select occasion"
                    label="Occasion"
                  />
                  <SimpleDropdown
                    value={formData.budget}
                    onValueChange={(value: string) => handleFieldChange('budget', value)}
                    options={predefinedOptions.budgetRanges}
                    placeholder="Select budget range"
                    label="Budget"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Product Selection</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Chosen</Label>
                    <Select 
                      value={formData.product_chosen || ''} 
                      onValueChange={(value) => handleFieldChange('product_chosen', value)}
                      disabled={productsLoading}
                    >
                      <SelectTrigger className={cn(
                        errors.product_chosen && touched.product_chosen && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              {product.main_image_url && (
                                <img 
                                  src={product.main_image_url} 
                                  alt={product.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              )}
                              <span>{product.name}</span>
                              <span className="text-gray-500 ml-auto">
                                ₹{product.salePrice || product.basePrice || product.price || product.selling_price || 0}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {productsLoading && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading products...
                      </div>
                    )}
                    {formData.product_chosen && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="text-blue-800 font-medium">Product Selected</div>
                        <div className="text-blue-700 text-sm">
                          {(() => {
                            const selectedProduct = products.find(p => p.id === formData.product_chosen);
                            return selectedProduct ? `${selectedProduct.name} - ₹${selectedProduct.salePrice || selectedProduct.basePrice || selectedProduct.price || selectedProduct.selling_price || 0}` : 'Product details loading...';
                          })()}
                        </div>
                      </div>
                    )}
                    {errors.product_chosen && touched.product_chosen && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.product_chosen}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Product Price (₹)</Label>
                    <Input
                      type="number"
                      value={formData.product_price || ''}
                      onChange={(e) => handleFieldChange('product_price', e.target.value)}
                      onBlur={() => handleFieldBlur('product_price')}
                      placeholder="Auto-filled from product selection"
                      readOnly
                      className={cn(
                        "bg-gray-50",
                        errors.product_price && touched.product_price && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    <div className="text-xs text-gray-500">
                      Price is automatically filled when product is selected
                    </div>
                    {errors.product_price && touched.product_price && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.product_price}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Purchase Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SimpleDropdown
                    value={formData.main_category}
                    onValueChange={(value: string) => handleFieldChange('main_category', value)}
                    options={categories.map(cat => cat.name)}
                    placeholder="Select main category"
                    label="Main Category"
                    loading={dropdownLoading}
                    error={errors.main_category && touched.main_category ? errors.main_category : ''}
                  />
                  <div className="space-y-2">
                    <Label>Design Selected</Label>
                    <Select 
                      value={formData.design_selected ? 'yes' : 'no'} 
                      onValueChange={(value) => handleBooleanFieldChange('design_selected', value === 'yes')}
                    >
                      <SelectTrigger className={cn(
                        errors.design_selected && touched.design_selected && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.design_selected && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-green-800 font-medium">Design Selected</div>
                        <div className="text-green-700 text-sm">This customer has selected a design. Enter the purchase amount below.</div>
                      </div>
                    )}
                    {errors.design_selected && touched.design_selected && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.design_selected}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Purchase Amount (₹)</Label>
                    <Input 
                      type="number" 
                      value={formData.actual_purchase_amount} 
                      onChange={(e) => handleFieldChange('actual_purchase_amount', e.target.value)} 
                      placeholder="e.g., 75000" 
                    />
                    {formData.actual_purchase_amount && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-green-800 font-medium">Converted Sale!</div>
                        <div className="text-green-700 text-sm">This will be counted as realized revenue.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Follow-up</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="next_follow_up">Next Follow-up Date</Label>
                    <Input
                      id="next_follow_up"
                      type="date"
                      value={formData.next_follow_up || ''}
                      onChange={(e) => handleFieldChange('next_follow_up', e.target.value)}
                      onBlur={() => handleFieldBlur('next_follow_up')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={formData.priority || 'Medium'} 
                      onValueChange={(value) => handleFieldChange('priority', value)}
                    >
                      <SelectTrigger className={cn(
                        errors.priority && touched.priority && "border-red-500 focus:ring-red-500"
                      )}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedOptions.followUpPriorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.priority && touched.priority && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.priority}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea 
                  id="notes"
                  rows={3} 
                  value={formData.notes} 
                  onChange={(e) => handleFieldChange('notes', e.target.value)} 
                  onBlur={() => handleFieldBlur('notes')}
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