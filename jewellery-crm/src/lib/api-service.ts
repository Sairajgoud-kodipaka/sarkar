// API Service for Supabase backend
import { supabase } from './supabase';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Type definitions for the CRM system
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'business_admin' | 'floor_manager';
  name: string;
  phone?: string;
  address?: string;
  floor?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  interest: string;
  floor: number;
  visited_date: string;
  assigned_to?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Extended customer shape used by complex customer forms and modals
// This matches the optional columns we may add to the `customers` table
export interface Client {
  id: number;
  // Core
  name: string; // keep for backwards compatibility
  phone: string;
  interest?: string;
  floor: number;
  visited_date: string;
  assigned_to?: string; // uuid
  notes?: string;
  status?: 'active' | 'inactive' | 'lead' | 'prospect' | 'customer' | 'vip';
  created_at?: string;
  updated_at?: string;

  // Extended profile
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  date_of_birth?: string; // YYYY-MM-DD
  anniversary_date?: string; // YYYY-MM-DD
  community?: string;
  mother_tongue?: string;
  reason_for_visit?: string;
  lead_source?: string;
  age_of_end_user?: string;
  saving_scheme?: string;
  catchment_area?: string;
  next_follow_up?: string; // YYYY-MM-DD
  summary_notes?: string;

  // Preferences (optional)
  preferred_metal?: string;
  preferred_style?: string;
  preferred_occasion?: string;
  budget?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  category: string;
  price: number;
  image?: string;
  // Optional fields that might not exist in the database
  description?: string;
  stock_quantity?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  date: string;
  floor: number;
  created_by: string;
  created_at: string;
}

export interface Visit {
  id: number;
  customer_id: number;
  customer_name: string;
  floor: number;
  date: string;
  interest: string;
  created_at: string;
}

export interface DashboardStats {
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  sales_today: number;
  sales_this_week: number;
  sales_this_month: number;
  total_customers: number;
  total_products: number;
}

export interface FloorData {
  floor: number;
  customers: Customer[];
  visits: Visit[];
  sales: Sale[];
}

// Dashboard data interface for the admin dashboard
export interface DashboardData {
  visitors: {
    today: number;
    this_week: number;
    this_month: number;
  };
  sales: {
    today: number;
    this_week: number;
    this_month: number;
  };
  floor_customers: Array<{
    floor: number;
    customers: Array<{
      name: string;
      number: string;
      interest: string;
    }>;
  }>;
}

// Extended Customer interface for admin pages
export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  floor: string;
  status: 'active' | 'inactive' | 'prospect' | 'vip';
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  preferredCategory: string;
  journeyStage: 'awareness' | 'consideration' | 'purchase' | 'loyalty' | 'advocacy';
  assignedTo: string;
  notes: string;
  tags: string[];
}

// Extended Team Member interface for admin pages
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'floor_manager' | 'sales_associate' | 'support_staff' | 'admin';
  floor: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
  joinDate: string;
  performance: {
    sales: number;
    customers: number;
    rating: number;
  };
}

class ApiService {
  private handleSupabaseResponse<T>(response: any): ApiResponse<T> {
    // Handle case where response is undefined (like in deleteProduct)
    if (response === undefined) {
      return {
        data: undefined as T,
        success: true,
      };
    }
    
    if (response && response.error) {
      throw new Error(response.error.message);
    }
    
    return {
      data: response?.data || response,
      success: true,
    };
  }

  // Dashboard
  async getDashboardData(timeFilter: string = 'month'): Promise<DashboardData> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get visits count
    const { data: visits_today } = await supabase
      .from('visits')
      .select('id')
      .eq('date', today);

    const { data: visits_this_week } = await supabase
      .from('visits')
      .select('id')
      .gte('date', weekAgo);

    const { data: visits_this_month } = await supabase
      .from('visits')
      .select('id')
      .gte('date', monthAgo);

    // Get sales amounts
    const { data: sales_today } = await supabase
      .from('sales')
      .select('amount')
      .eq('date', today);

    const { data: sales_this_week } = await supabase
      .from('sales')
      .select('amount')
      .gte('date', weekAgo);

    const { data: sales_this_month } = await supabase
      .from('sales')
      .select('amount')
      .gte('date', monthAgo);

    // Get customers by floor
    const { data: customers } = await supabase
      .from('customers')
      .select('*');

    const floorCustomers = [1, 2, 3].map(floor => ({
      floor,
      customers: customers?.filter(c => c.floor === floor).map(c => ({
        name: c.name,
        number: c.phone,
        interest: c.interest
      })) || []
    }));

    return {
      visitors: {
        today: visits_today?.length || 0,
        this_week: visits_this_week?.length || 0,
        this_month: visits_this_month?.length || 0,
      },
      sales: {
        today: sales_today?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
        this_week: sales_this_week?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
        this_month: sales_this_month?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
      },
      floor_customers: floorCustomers,
    };
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get visits count
    const { data: visits_today } = await supabase
      .from('visits')
      .select('id')
      .eq('date', today);

    const { data: visits_this_week } = await supabase
      .from('visits')
      .select('id')
      .gte('date', weekAgo);

    const { data: visits_this_month } = await supabase
      .from('visits')
      .select('id')
      .gte('date', monthAgo);

    // Get sales amounts
    const { data: sales_today } = await supabase
      .from('sales')
      .select('amount')
      .eq('date', today);

    const { data: sales_this_week } = await supabase
      .from('sales')
      .select('amount')
      .gte('date', weekAgo);

    const { data: sales_this_month } = await supabase
      .from('sales')
      .select('amount')
      .gte('date', monthAgo);

    // Get total counts
    const { count: total_customers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: total_products } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const stats: DashboardStats = {
      visits_today: visits_today?.length || 0,
      visits_this_week: visits_this_week?.length || 0,
      visits_this_month: visits_this_month?.length || 0,
      sales_today: sales_today?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
      sales_this_week: sales_this_week?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
      sales_this_month: sales_this_month?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0,
      total_customers: total_customers || 0,
      total_products: total_products || 0,
    };

    return this.handleSupabaseResponse(stats);
  }

  // Customers
  async getAdminCustomers(): Promise<AdminCustomer[]> {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*');
    
    if (error) throw new Error(error.message);
    
    // Get real sales and visit data for each customer
    const customersWithRealData = await Promise.all(
      (customers || []).map(async (customer: any) => {
        // Get sales for this customer
        const { data: salesData } = await supabase
          .from('sales')
          .select('amount, date')
          .eq('customer_id', customer.id);
        
        // Get visits for this customer
        const { data: visitsData } = await supabase
          .from('visits')
          .select('date')
          .eq('customer_id', customer.id);
        
        const totalSpent = salesData?.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0) || 0;
        const visitCount = visitsData?.length || 0;
        const lastVisit = visitsData && visitsData.length > 0 ? visitsData[visitsData.length - 1].date : customer.visited_date;
        
        // Determine journey stage based on spending
        let journeyStage: 'awareness' | 'consideration' | 'purchase' | 'loyalty' | 'advocacy' = 'awareness';
        if (totalSpent > 100000) journeyStage = 'loyalty';
        else if (totalSpent > 50000) journeyStage = 'purchase';
        else if (totalSpent > 10000) journeyStage = 'consideration';
        
        return {
          id: customer.id.toString(),
          name: customer.name,
          email: customer.email || `${customer.name.toLowerCase().replace(' ', '.')}@example.com`,
          phone: customer.phone,
          floor: `Floor ${customer.floor}`,
          status: customer.status as 'active' | 'inactive' | 'prospect' | 'vip',
          totalSpent: totalSpent,
          visitCount: visitCount,
          lastVisit: lastVisit,
          preferredCategory: customer.interest,
          journeyStage: journeyStage,
          assignedTo: 'John Smith', // This would need to be looked up from team_members table
          notes: customer.notes || '',
          tags: [customer.interest.split(' ')[0]],
        };
      })
    );
    
    return customersWithRealData;
  }

  async getCustomers(params?: {
    page?: number;
    search?: string;
    floor?: number;
    status?: string;
  }): Promise<ApiResponse<Customer[]>> {
    console.log('getCustomers called with params:', params);
    
    let query = supabase.from('customers').select('*');

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }

    if (params?.floor) {
      query = query.eq('floor', params.floor);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    console.log('Executing Supabase query...');
    const { data, error } = await query;
    console.log('Supabase response - data:', data, 'error:', error);
    
    if (error) {
      console.error('Supabase error in getCustomers:', error);
      throw new Error(error.message);
    }
    
    // Return the data directly since we've already handled the error
    const response: ApiResponse<Customer[]> = {
      data: data || [],
      success: true,
    };
    console.log('Final getCustomers response:', response);
    return response;
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data);
  }

  // Removed older customer CRUD (string id) to avoid duplicates. Use unified versions below.

  // Products
  async getProducts(params?: {
    page?: number;
    search?: string;
    category?: string;
    type?: string;
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<Product[]>> {
    console.log('getProducts called with params:', params);
    let query = supabase.from('products').select('*');

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    if (params?.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    } else {
      // Default to active products only
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;
    console.log('Supabase response - data:', data, 'error:', error);
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }
    
    const response = this.handleSupabaseResponse({ data, error }) as ApiResponse<Product[]>;
    console.log('Final response:', response);
    return response;
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data);
  }

  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      // Clean the product data for database insertion
      const cleanProductData: any = { ...productData };
      
      // Ensure image fields are properly set
      if (cleanProductData.image) {
        cleanProductData.image_url = cleanProductData.image;
      }
      
      // Remove undefined values
      const finalData = Object.fromEntries(
        Object.entries(cleanProductData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      console.log('Creating product with data:', finalData);
      
      const { data, error } = await supabase
        .from('products')
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('Supabase create error:', error);
        throw new Error(error.message);
      }
      
      console.log('Product created successfully:', data);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<Product> | FormData): Promise<ApiResponse<Product>> {
    try {
      let cleanProductData: any = {};

      // Handle FormData (from edit form) or regular object (from other forms)
      if (productData instanceof FormData) {
        // Convert FormData to object (only include fields that exist in your database)
        for (const [key, value] of productData.entries()) {
          if (value !== null && value !== undefined && value !== '') {
            // Only process fields that exist in your database schema
            if (['price', 'stock_quantity'].includes(key)) {
              cleanProductData[key] = parseFloat(value as string);
            } else if (['name', 'sku', 'description', 'category', 'type', 'status', 'image', 'image_url'].includes(key)) {
              cleanProductData[key] = value;
            }
          }
        }
      } else {
        // Handle regular object
        cleanProductData = Object.fromEntries(
          Object.entries(productData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
        );
      }

      // Map field names to database schema (only include fields that exist in the database)
      const mappedData: any = {
        name: cleanProductData.name,
        sku: cleanProductData.sku,
        description: cleanProductData.description,
        category: cleanProductData.category,
        price: cleanProductData.selling_price || cleanProductData.price,
        stock_quantity: cleanProductData.quantity,
        status: cleanProductData.status,
        image: cleanProductData.image || cleanProductData.main_image_url,
        image_url: cleanProductData.image || cleanProductData.main_image_url,
        main_image_url: cleanProductData.main_image_url,
        additional_images_urls: cleanProductData.additional_images_urls,
        // Only include fields that exist in your database schema
        type: cleanProductData.type,
      };

      // Remove undefined values
      const finalData = Object.fromEntries(
        Object.entries(mappedData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      console.log('Updating product with data:', finalData);

      const { data, error } = await supabase
        .from('products')
        .update(finalData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message);
      }
      
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(undefined);
  }

  // Sales
  async getSales(params?: {
    page?: number;
    date_from?: string;
    date_to?: string;
    floor?: number;
  }): Promise<ApiResponse<Sale[]>> {
    let query = supabase.from('sales').select('*');

    if (params?.date_from) {
      query = query.gte('date', params.date_from);
    }

    if (params?.date_to) {
      query = query.lte('date', params.date_to);
    }

    if (params?.floor) {
      query = query.eq('floor', params.floor);
    }

    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data || []);
  }

  async createSale(saleData: Partial<Sale>): Promise<ApiResponse<Sale>> {
    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data);
  }

  // Visits
  async getVisits(params?: {
    page?: number;
    date_from?: string;
    date_to?: string;
    floor?: number;
  }): Promise<ApiResponse<Visit[]>> {
    let query = supabase.from('visits').select('*');

    if (params?.date_from) {
      query = query.gte('date', params.date_from);
    }

    if (params?.date_to) {
      query = query.lte('date', params.date_to);
    }

    if (params?.floor) {
      query = query.eq('floor', params.floor);
    }

    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data || []);
  }

  async createVisit(visitData: Partial<Visit>): Promise<ApiResponse<Visit>> {
    const { data, error } = await supabase
      .from('visits')
      .insert([visitData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return this.handleSupabaseResponse(data);
  }

  // Team Management
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching team members:', error);
        // If RLS blocks access, return empty array instead of throwing
        if (error.message.includes('permission denied') || error.message.includes('403')) {
          console.warn('Access denied to team_members table. Returning empty array.');
          return [];
        }
        throw new Error(error.message);
      }
      
      // Get real performance data for each team member
      const teamMembersWithPerformance = await Promise.all(
        (teamMembers || []).map(async (member: any) => {
          // Get sales data for this team member
          const { data: salesData } = await supabase
            .from('sales')
            .select('amount')
            .eq('created_by', member.id);
          
          // Get customers assigned to this team member
          const { data: customersData } = await supabase
            .from('customers')
            .select('id')
            .eq('assigned_to', member.id);
          
          const totalSales = salesData?.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0) || 0;
          const totalCustomers = customersData?.length || 0;
          
          // Calculate rating based on performance (simple algorithm)
          const rating = totalSales > 100000 ? 5 : totalSales > 50000 ? 4 : totalSales > 10000 ? 3 : 2;
          
          return {
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            email: member.email,
            phone: member.phone || '+91 98765 43210',
            role: member.role as 'floor_manager' | 'sales_associate' | 'support_staff' | 'admin',
            floor: `Floor ${member.floor || 1}`,
            status: member.status as 'active' | 'inactive' | 'on_leave',
            avatar: member.avatar,
            joinDate: member.created_at,
            performance: {
              sales: totalSales,
              customers: totalCustomers,
              rating: rating,
            },
          };
        })
      );
      
      return teamMembersWithPerformance;
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async createTeamMember(memberData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    floor?: number;
  }): Promise<ApiResponse<User>> {
    // Use regular signup instead of admin.createUser
    const { data, error } = await supabase.auth.signUp({
      email: memberData.email,
      password: memberData.password,
      options: {
        data: {
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          role: memberData.role,
          floor: memberData.floor,
          name: `${memberData.first_name} ${memberData.last_name}`,
          phone: memberData.phone
        }
      }
    });

    if (error) throw new Error(error.message);
    
         // Insert into team_members table with the auth user's UUID
     const { data: teamMemberData, error: teamMemberError } = await supabase
       .from('team_members')
       .insert({
         id: data.user?.id, // Use the UUID from the auth user
         email: memberData.email,
         first_name: memberData.first_name,
         last_name: memberData.last_name,
         role: memberData.role,
         floor: memberData.floor,
         phone: memberData.phone,
         status: 'active'
       })
       .select()
       .single();

    if (teamMemberError) {
      console.error('Error inserting team member:', teamMemberError);
      // Don't throw error here as the user was created successfully
    }
    
    // Transform the user data to match our User interface
    const user: User = {
      id: parseInt(data.user?.id || '0'),
      username: memberData.email,
      email: memberData.email,
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      role: memberData.role as 'business_admin' | 'floor_manager',
      name: `${memberData.first_name} ${memberData.last_name}`,
      phone: memberData.phone,
      floor: memberData.floor,
      is_active: true,
      created_at: data.user?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return this.handleSupabaseResponse(user);
  }

  async updateTeamMember(id: string, memberData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({
          ...memberData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating team member:', error);
        throw new Error(error.message);
      }

      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error in updateTeamMember:', error);
      throw error;
    }
  }

  async deleteTeamMember(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team member:', error);
        throw new Error(error.message);
      }

      return this.handleSupabaseResponse(undefined);
    } catch (error) {
      console.error('Error in deleteTeamMember:', error);
      throw error;
    }
  }

  // Export functionality
  async exportCustomers(params: {
    format: string;
    fields: string[];
    floor?: number;
  }): Promise<ApiResponse<Blob>> {
    let query = supabase.from('customers').select('*');

    if (params.floor) {
      query = query.eq('floor', params.floor);
    }

    const { data, error } = await query;
    
    if (error) throw new Error(error.message);

    // Transform data for export
    const exportData = data?.map((c: any) => ({
      name: c.name,
      phone: c.phone,
      interest: c.interest,
      floor: c.floor,
      status: c.status,
    })) || [];

    // Create CSV content
    let csvContent = '';
    if (params.format === 'csv') {
      // Add headers
      const headers = params.fields.map(field => field.charAt(0).toUpperCase() + field.slice(1));
      csvContent = headers.join(',') + '\n';
      
      // Add data rows
      exportData.forEach((row: any) => {
        const values = params.fields.map(field => {
          const value = row[field];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csvContent += values.join(',') + '\n';
      });
    } else {
      // JSON format
      csvContent = JSON.stringify(exportData, null, 2);
    }

    // Create blob
    const blob = new Blob([csvContent], { 
      type: params.format === 'csv' ? 'text/csv' : 'application/json' 
    });

    return {
      data: blob,
      success: true,
    };
  }

  // Floor-specific data
  async getFloorData(floor: number): Promise<ApiResponse<FloorData>> {
    const [customersResponse, visitsResponse, salesResponse] = await Promise.all([
      supabase.from('customers').select('*').eq('floor', floor),
      supabase.from('visits').select('*').eq('floor', floor),
      supabase.from('sales').select('*').eq('floor', floor)
    ]);

    if (customersResponse.error) throw new Error(customersResponse.error.message);
    if (visitsResponse.error) throw new Error(visitsResponse.error.message);
    if (salesResponse.error) throw new Error(salesResponse.error.message);

    const floorData: FloorData = {
      floor,
      customers: customersResponse.data || [],
      visits: visitsResponse.data || [],
      sales: salesResponse.data || [],
    };

    return this.handleSupabaseResponse(floorData);
  }

  // Get floors with their managers
  async getFloors(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    managerId: string;
    managerName: string;
    status: 'active' | 'inactive';
    visitorCount: number;
    salesToday: number;
    lastUpdated: string;
  }>>> {
    try {
      // Get floor managers from team_members table
      const { data: floorManagers, error } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, floor, status')
        .eq('role', 'floor_manager');

      if (error) throw new Error(error.message);

      // Create floor data with manager information
      const floors = [];
      const floorNames = ['Ground Floor', 'First Floor', 'Second Floor'];
      
      for (let floorNum = 1; floorNum <= 3; floorNum++) {
        const manager = floorManagers?.find(m => m.floor === floorNum);
        const managerName = manager ? `${manager.first_name} ${manager.last_name}` : 'No Manager Assigned';
        
        // Get today's stats for this floor
        const today = new Date().toISOString().split('T')[0];
        
        const [visitsToday, salesToday] = await Promise.all([
          supabase
            .from('visits')
            .select('*')
            .eq('floor', floorNum)
            .gte('date', today),
          supabase
            .from('sales')
            .select('amount')
            .eq('floor', floorNum)
            .gte('date', today)
        ]);

        const visitorCount = visitsToday.data?.length || 0;
        const salesTodayAmount = salesToday.data?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;

        floors.push({
          id: floorNum.toString(),
          name: floorNames[floorNum - 1],
          managerId: manager?.id || '',
          managerName,
          status: manager?.status === 'active' ? 'active' as const : 'inactive' as const,
          visitorCount,
          salesToday: salesTodayAmount,
          lastUpdated: 'Just now'
        });
      }

      return this.handleSupabaseResponse(floors);
    } catch (error) {
      console.error('Error fetching floors:', error);
      throw error;
    }
  }

  // Get floor assigned to a specific user by email
  async getUserFloorByEmail(userEmail: string): Promise<ApiResponse<{
    id: string;
    name: string;
    managerId: string;
    managerName: string;
    status: 'active' | 'inactive';
    visitorCount: number;
    salesToday: number;
    lastUpdated: string;
  } | null>> {
    try {
      const { data: user, error } = await supabase
        .from('team_members')
        .select('id, floor, first_name, last_name, status')
        .eq('email', userEmail)
        .eq('role', 'floor_manager')
        .single();

      if (error || !user?.floor) {
        return this.handleSupabaseResponse(null);
      }

      const floorNames = ['Ground Floor', 'First Floor', 'Second Floor'];
      const today = new Date().toISOString().split('T')[0];
      
      const [visitsToday, salesToday] = await Promise.all([
        supabase
          .from('visits')
          .select('*')
          .eq('floor', user.floor)
          .gte('date', today),
        supabase
          .from('sales')
          .select('amount')
          .eq('floor', user.floor)
          .gte('date', today)
      ]);

      const visitorCount = visitsToday.data?.length || 0;
      const salesTodayAmount = salesToday.data?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;

      const floorData = {
        id: user.floor.toString(),
        name: floorNames[user.floor - 1],
        managerId: user.id,
        managerName: `${user.first_name} ${user.last_name}`,
        status: user.status === 'active' ? 'active' as const : 'inactive' as const,
        visitorCount,
        salesToday: salesTodayAmount,
        lastUpdated: 'Just now'
      };

      return this.handleSupabaseResponse(floorData);
    } catch (error) {
      console.error('Error fetching user floor:', error);
      throw error;
    }
  }

  // Customer management methods
  async getFloorCustomers(floor: number): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          team_members!assigned_to(first_name, last_name)
        `)
        .eq('floor', floor)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching floor customers:', error);
      throw error;
    }
  }

  async getAllCustomers(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          team_members!assigned_to(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching all customers:', error);
      throw error;
    }
  }

  async createCustomer(customerData: Partial<Client> & { phone: string; floor: number }): Promise<ApiResponse<any>> {
    try {
      // Provide sensible defaults while letting caller override
      const nowDate = new Date().toISOString().split('T')[0];

      // Compose display name if not provided
      const computedName = (customerData.name && customerData.name.trim().length > 0)
        ? customerData.name
        : `${(customerData.first_name || '').trim()} ${(customerData.last_name || '').trim()}`.trim();

      const payload: Record<string, any> = {
        ...customerData,
        name: computedName || 'New Customer',
        visited_date: customerData.visited_date || nowDate,
        status: customerData.status || 'lead',
      };

      // Whitelist columns that may exist in the customers table (base + optional extended)
      const allowedColumns = new Set([
        'name','phone','interest','floor','visited_date','assigned_to','notes','status',
        // optional extended profile fields (safe if missing; Supabase ignores extras only if omitted)
        'email','address','city','state','country','date_of_birth','anniversary_date','community',
        'lead_source','reason_for_visit','age_of_end_user','saving_scheme','catchment_area','next_follow_up','summary_notes',
        'preferred_metal','preferred_style','preferred_occasion','budget'
      ]);

      // Date fields that should be converted from empty strings to null
      const dateFields = ['date_of_birth', 'anniversary_date', 'visited_date', 'next_follow_up'];
      
      // Remove undefined/empty-string keys and any non-whitelisted fields
      // Convert empty strings to null for date fields
      const finalData = Object.fromEntries(
        Object.entries(payload)
          .filter(([k, v]) => allowedColumns.has(k) && v !== undefined && v !== null)
          .map(([k, v]) => {
            // Convert empty strings to null for date fields
            if (dateFields.includes(k) && v === '') {
              return [k, null];
            }
            // Filter out empty strings for non-date fields
            if (v === '' && !dateFields.includes(k)) {
              return null;
            }
            return [k, v];
          })
          .filter(entry => entry !== null)
      );

      let { data, error } = await supabase
        .from('customers')
        .insert(finalData)
        .select()
        .single();

      // If insert fails due to unknown columns (extended fields not yet added), retry with a minimal payload
      if (error && /(column .* does not exist|unknown column|invalid input|could not find the .* column)/i.test(error.message)) {
        console.warn('Create customer failed due to unknown columns. Retrying with minimal schema.', error.message);
        const minimalData = {
          name: finalData.name,
          phone: finalData.phone,
          interest: finalData.interest,
          floor: finalData.floor,
          visited_date: finalData.visited_date,
          status: finalData.status,
          assigned_to: finalData.assigned_to,
          notes: finalData.notes,
        };
        const retry = await supabase
          .from('customers')
          .insert(minimalData)
          .select()
          .single();
        data = retry.data as any;
        error = retry.error as any;
      }

      if (error) throw new Error(error.message);

      // Automatically create a visit record for dashboard statistics
      try {
        await supabase
          .from('visits')
          .insert({
            customer_id: data.id,
            customer_name: data.name,
            floor: data.floor,
            date: data.visited_date,
            interest: data.interest || 'General Interest'
          });
      } catch (visitError) {
        console.warn('Failed to create visit record:', visitError);
        // Don't throw - customer was created successfully
      }

      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: number, customerData: Partial<Client>): Promise<ApiResponse<any>> {
    try {
      // Whitelist columns to prevent unknown-column errors
      const allowedColumns = new Set([
        'name','phone','interest','floor','visited_date','assigned_to','notes','status',
        'email','address','city','state','country','date_of_birth','anniversary_date','community',
        'lead_source','reason_for_visit','age_of_end_user','saving_scheme','catchment_area','next_follow_up','summary_notes',
        'preferred_metal','preferred_style','preferred_occasion','budget'
      ]);

      const base = { ...customerData, updated_at: new Date().toISOString() } as Record<string, any>;
      
      // Date fields that should be converted from empty strings to null
      const dateFields = ['date_of_birth', 'anniversary_date', 'visited_date', 'next_follow_up'];
      
      // Clean the data: convert empty strings to null for date fields, remove undefined/null values
      const finalData = Object.fromEntries(
        Object.entries(base)
          .filter(([k, v]) => allowedColumns.has(k) && v !== undefined)
          .map(([k, v]) => {
            // Convert empty strings to null for date fields
            if (dateFields.includes(k) && v === '') {
              return [k, null];
            }
            // Remove null values (but keep the converted nulls for date fields)
            if (v === null && !dateFields.includes(k)) {
              return null;
            }
            return [k, v];
          })
          .filter(entry => entry !== null)
      );

      const { data, error } = await supabase
        .from('customers')
        .update(finalData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(undefined);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Sales Pipeline / Deals management
  async getDeals(params?: {
    stage?: string;
    assigned_to?: string;
    floor?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('deals')
        .select(`
          *,
          team_members!assigned_to(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (params?.stage && params.stage !== 'all') {
        query = query.eq('stage', params.stage);
      }

      if (params?.assigned_to) {
        query = query.eq('assigned_to', params.assigned_to);
      }

      if (params?.floor) {
        query = query.eq('floor', params.floor);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  async createDeal(dealData: {
    title: string;
    customer_name: string;
    amount: number;
    stage: string;
    probability?: number;
    expected_close_date?: string;
    assigned_to?: string;
    floor?: number;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  async updateDeal(id: number, dealData: {
    title?: string;
    amount?: number;
    stage?: string;
    probability?: number;
    expected_close_date?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          ...dealData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  }

  async deleteDeal(id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(undefined);
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  }

  // Orders management
  async getOrders(params?: {
    status?: string;
    floor?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          created_by_member:team_members(first_name, last_name),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params?.floor) {
        query = query.eq('floor', params.floor);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async createOrder(orderData: {
    customer_id?: number;
    customer_name: string;
    total_amount: number;
    status?: string; // pending|confirmed|processing|shipped|delivered|cancelled
    floor?: number;
    created_by?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: orderData.customer_id,
          customer_name: orderData.customer_name,
          total_amount: orderData.total_amount,
          status: orderData.status || 'pending',
          floor: orderData.floor,
          created_by: orderData.created_by,
          notes: orderData.notes
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Automatically create a sales record for dashboard statistics (only for confirmed/processing/shipped/delivered orders)
      const salesEligibleStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
      if (salesEligibleStatuses.includes(data.status)) {
        try {
          await supabase
            .from('sales')
            .insert({
              customer_id: data.customer_id,
              customer_name: data.customer_name,
              amount: data.total_amount,
              date: new Date().toISOString().split('T')[0], // today
              floor: data.floor,
              created_by: data.created_by
            });
        } catch (salesError) {
          console.warn('Failed to create sales record:', salesError);
          // Don't throw - order was created successfully
        }
      }

      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: number, updates: Partial<{
    customer_name: string;
    total_amount: number;
    status: string;
    notes: string;
  }>): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // If order status changed to confirmed/processing/shipped/delivered, create sales record
      const salesEligibleStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
      if (updates.status && salesEligibleStatuses.includes(updates.status)) {
        try {
          // Check if sales record already exists for this order
          const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('customer_name', data.customer_name)
            .eq('amount', data.total_amount)
            .eq('floor', data.floor)
            .single();

          // Only create if no existing sales record found
          if (!existingSale) {
            await supabase
              .from('sales')
              .insert({
                customer_id: data.customer_id,
                customer_name: data.customer_name,
                amount: data.total_amount,
                date: new Date().toISOString().split('T')[0], // today
                floor: data.floor,
                created_by: data.created_by
              });
          }
        } catch (salesError) {
          console.warn('Failed to create sales record on status update:', salesError);
          // Don't throw - order was updated successfully
        }
      }

      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Appointments management
  async getAppointments(params?: {
    status?: string;
    floor?: number;
    dateFrom?: string; // ISO date string
    dateTo?: string;   // ISO date string
  }): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params?.floor) {
        query = query.eq('floor', params.floor);
      }

      if (params?.dateFrom) {
        query = query.gte('appointment_date', params.dateFrom);
      }

      if (params?.dateTo) {
        query = query.lte('appointment_date', params.dateTo);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData: {
    customer_id?: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    appointment_date: string; // ISO datetime
    duration_minutes?: number;
    floor: number;
    assigned_to?: string | null; // UUID
    status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const cleanData = { ...appointmentData };
      
      // Convert empty string to null for UUID fields
      if (cleanData.assigned_to === '') {
        cleanData.assigned_to = null;
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...cleanData,
          duration_minutes: cleanData.duration_minutes ?? 60,
          status: cleanData.status ?? 'scheduled',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, updates: Partial<{
    appointment_date: string;
    duration_minutes: number;
    floor: number;
    assigned_to: string | null;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    notes: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  }>): Promise<ApiResponse<any>> {
    try {
      // Clean up the updates object to handle UUID fields properly
      const cleanUpdates = { ...updates };
      
      // Convert empty string to null for UUID fields
      if (cleanUpdates.assigned_to === '') {
        cleanUpdates.assigned_to = null as any;
      }
      
      // Remove undefined values
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key as keyof typeof cleanUpdates] === undefined) {
          delete cleanUpdates[key as keyof typeof cleanUpdates];
        }
      });

      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(undefined);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(id: number, status: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  // Support tickets management (single source of truth below using mock until table exists).

  // Floor-specific dashboard statistics
  async getFloorDashboardStats(floor: number): Promise<ApiResponse<{
    visitors: {
      today: number;
      this_week: number;
      this_month: number;
    };
    sales: {
      today: number;
      this_week: number;
      this_month: number;
    };
    walkins: {
      total: number;
      data: Array<{
        id: string;
        customerName: string;
        time: string;
        status: 'active' | 'completed' | 'pending';
      }>;
    };
  }>> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get visits for different time periods
      const [visitsToday, visitsThisWeek, visitsThisMonth] = await Promise.all([
        supabase
          .from('visits')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfDay.toISOString().split('T')[0]),
        supabase
          .from('visits')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfWeek.toISOString().split('T')[0]),
        supabase
          .from('visits')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfMonth.toISOString().split('T')[0])
      ]);

      // Get sales for different time periods
      const [salesToday, salesThisWeek, salesThisMonth] = await Promise.all([
        supabase
          .from('sales')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfDay.toISOString().split('T')[0]),
        supabase
          .from('sales')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfWeek.toISOString().split('T')[0]),
        supabase
          .from('sales')
          .select('*')
          .eq('floor', floor)
          .gte('date', startOfMonth.toISOString().split('T')[0])
      ]);

      // Get recent walk-ins (visits from today)
      const walkinsResponse = await supabase
        .from('visits')
        .select('customer_name, date, created_at')
        .eq('floor', floor)
        .gte('date', startOfDay.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(10);

      if (visitsToday.error) throw new Error(visitsToday.error.message);
      if (visitsThisWeek.error) throw new Error(visitsThisWeek.error.message);
      if (visitsThisMonth.error) throw new Error(visitsThisMonth.error.message);
      if (salesToday.error) throw new Error(salesToday.error.message);
      if (salesThisWeek.error) throw new Error(salesThisWeek.error.message);
      if (salesThisMonth.error) throw new Error(salesThisMonth.error.message);
      if (walkinsResponse.error) throw new Error(walkinsResponse.error.message);

      // Calculate sales totals
      const salesTodayTotal = salesToday.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const salesThisWeekTotal = salesThisWeek.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const salesThisMonthTotal = salesThisMonth.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

      // Format walk-ins data
      const walkinsData = walkinsResponse.data?.map((visit, index) => ({
        id: (index + 1).toString(),
        customerName: visit.customer_name,
        time: new Date(visit.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'active' : 'pending' as const
      })) || [];

      const stats = {
        visitors: {
          today: visitsToday.data?.length || 0,
          this_week: visitsThisWeek.data?.length || 0,
          this_month: visitsThisMonth.data?.length || 0,
        },
        sales: {
          today: salesTodayTotal,
          this_week: salesThisWeekTotal,
          this_month: salesThisMonthTotal,
        },
        walkins: {
          total: walkinsData.length,
          data: walkinsData,
        },
      };

      return this.handleSupabaseResponse(stats);
    } catch (error) {
      console.error('Error fetching floor dashboard stats:', error);
      throw error;
    }
  }

  // Notification functions
  async getNotifications(params?: {
    page?: number;
    status?: 'read' | 'unread';
    type?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      // For now, return empty array since we don't have a notifications table
      // This prevents the error and allows the app to work
      return this.handleSupabaseResponse([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  async getNotificationSettings(): Promise<ApiResponse<any>> {
    try {
      // Return default notification settings
      const defaultSettings = {
        emailNotifications: {
          enabled: true,
          types: ['appointment_reminder', 'deal_update', 'new_customer'],
          frequency: 'immediate' as const
        },
        pushNotifications: {
          enabled: true,
          types: ['appointment_reminder', 'deal_update']
        },
        inAppNotifications: {
          enabled: true,
          types: ['appointment_reminder', 'deal_update', 'new_customer', 'order_status'],
          sound: true,
          desktop: true
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'Asia/Kolkata'
        },
        preferences: {
          appointmentReminders: true,
          dealUpdates: true,
          orderNotifications: true,
          inventoryAlerts: true,
          taskReminders: true,
          announcements: true,
          escalations: true,
          marketingUpdates: true
        }
      };

      return this.handleSupabaseResponse(defaultSettings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw new Error('Failed to fetch notification settings');
    }
  }

  async updateNotificationSettings(settings: Partial<any>): Promise<ApiResponse<any>> {
    try {
      // For now, just return success since we don't have a settings table
      return this.handleSupabaseResponse(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  // Additional API functions for products and categories
  async getMyProducts(params?: {
    page?: number;
    search?: string;
    category?: string;
  }): Promise<ApiResponse<Product[]>> {
    try {
      // For now, return the same as getProducts since we don't have user-specific filtering
      return this.getProducts(params);
    } catch (error) {
      console.error('Error fetching my products:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  async getCategories(params?: {
    scope?: 'global' | 'store';
  }): Promise<ApiResponse<any[]>> {
    try {
      // Query the dedicated categories table
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return this.handleSupabaseResponse([]);
      }

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (categories || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name)
            .eq('status', 'active');

          return {
            id: category.id,
            name: category.name,
            description: category.description || `${category.name} jewellery`,
            product_count: count || 0,
            scope: 'global',
            image_url: category.image_url,
            parent_id: category.parent_id,
            sort_order: category.sort_order
          };
        })
      );

      // Filter by scope if specified
      let filteredCategories = categoriesWithCounts;
      if (params?.scope) {
        filteredCategories = categoriesWithCounts.filter(cat => cat.scope === params.scope);
      }
      
      return this.handleSupabaseResponse(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  async getInventory(): Promise<ApiResponse<any[]>> {
    try {
      // For now, return empty array since we don't have an inventory table
      return this.handleSupabaseResponse([]);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  async getProductStats(): Promise<ApiResponse<any>> {
    try {
      // Return default stats
      const stats = {
        total_products: 0,
        active_products: 0,
        out_of_stock: 0,
        low_stock: 0,
        total_value: 0,
        category_count: 0,
        recent_products: 0,
      };
      return this.handleSupabaseResponse(stats);
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw new Error('Failed to fetch product stats');
    }
  }

  async getGlobalCatalogue(): Promise<ApiResponse<any>> {
    try {
      // Return default global catalogue data
      const catalogue = {
        total_products: 0,
        total_stores: 0,
        product_distribution: {},
      };
      return this.handleSupabaseResponse(catalogue);
    } catch (error) {
      console.error('Error fetching global catalogue:', error);
      throw new Error('Failed to fetch global catalogue');
    }
  }

  async createCategory(categoryData: any): Promise<ApiResponse<any>> {
    try {
      // Insert directly into the categories table
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description || `${categoryData.name} jewellery`,
          is_active: true,
          sort_order: 999 // Will be reordered later
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw new Error('Failed to create category');
      }

      console.log('Created new category:', newCategory);
      
      return this.handleSupabaseResponse(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  async updateCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    try {
      // Get the current category to find its name
      const { data: currentCategory, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (fetchError || !currentCategory) {
        throw new Error('Category not found');
      }

      // Update all products that use this category name if name is changing
      if (categoryData.name && categoryData.name !== currentCategory.name) {
        const { error } = await supabase
          .from('products')
          .update({ category: categoryData.name })
          .eq('category', currentCategory.name);

        if (error) {
          console.error('Error updating products with new category name:', error);
          throw new Error('Failed to update products');
        }
      }

      // Update the category in the categories table
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name || currentCategory.name,
          description: categoryData.description || currentCategory.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(id))
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw new Error('Failed to update category');
      }

      console.log('Updated category:', updatedCategory);
      
      return this.handleSupabaseResponse(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    try {
      // Get the category to delete
      const { data: categoryToDelete, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (fetchError || !categoryToDelete) {
        throw new Error('Category not found');
      }

      // Get all available categories to choose a default
      const { data: availableCategories, error: availableError } = await supabase
        .from('categories')
        .select('name')
        .neq('id', parseInt(id))
        .eq('is_active', true);

      if (availableError) {
        console.error('Error fetching available categories:', availableError);
        throw new Error('Failed to fetch available categories');
      }

      const defaultCategory = availableCategories && availableCategories.length > 0 
        ? availableCategories[0].name 
        : 'Gold';

      // Update all products in this category to use the default category
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: defaultCategory })
        .eq('category', categoryToDelete.name);

      if (updateError) {
        console.error('Error updating products:', updateError);
        throw new Error('Failed to update products');
      }

      // Delete the category from the categories table
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', parseInt(id));

      if (deleteError) {
        console.error('Error deleting category:', deleteError);
        throw new Error('Failed to delete category');
      }

      return this.handleSupabaseResponse(undefined);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  async getTenantCategories(tenant: string): Promise<ApiResponse<any[]>> {
    try {
      // For now, return empty array since we don't have tenant-specific categories
      return this.handleSupabaseResponse([]);
    } catch (error) {
      console.error('Error fetching tenant categories:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  async getTenantProducts(tenant: string): Promise<ApiResponse<any[]>> {
    try {
      // For now, return the same as getProducts since we don't have tenant-specific filtering
      return this.getProducts();
    } catch (error) {
      console.error('Error fetching tenant products:', error);
      return this.handleSupabaseResponse([]);
    }
  }

  // Sales Dashboard Methods
  async getSalesDashboard(): Promise<ApiResponse<any>> {
    try {
      // Get sales data
      const salesResponse = await this.getSales();
      const customersResponse = await this.getCustomers();
      
      if (!salesResponse.success || !customersResponse.success) {
        throw new Error('Failed to fetch dashboard data');
      }

      const sales = salesResponse.data || [];
      const customers = customersResponse.data || [];

      // Calculate dashboard metrics
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const monthlySales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      });

      const monthlyRevenue = monthlySales.reduce((total: number, sale: any) => total + (sale.amount || 0), 0);
      const totalDeals = sales.length;
      const totalCustomers = customers.length;
      const conversionRate = totalCustomers > 0 ? Math.round((totalDeals / totalCustomers) * 100) : 0;

      const dashboardData = {
        sales_count: totalDeals,
        total_deals: totalDeals,
        total_customers: totalCustomers,
        conversion_rate: conversionRate,
        monthly_revenue: monthlyRevenue,
        recent_sales: monthlySales.slice(0, 5),
        top_products: ['Gold Necklace', 'Diamond Ring', 'Silver Anklet', 'Pearl Earrings']
      };

      return this.handleSupabaseResponse(dashboardData);
    } catch (error) {
      console.error('Error fetching sales dashboard:', error);
      throw new Error('Failed to fetch sales dashboard data');
    }
  }

  // Manager Dashboard Methods
  async getManagerDashboard(): Promise<ApiResponse<any>> {
    try {
      // Get team members, customers, and products data
      const teamResponse = await this.getTeamMembers();
      const customersResponse = await this.getCustomers();
      const productsResponse = await this.getProducts();

      const teamMembers = Array.isArray(teamResponse) ? teamResponse : [];
      const customers = customersResponse.success ? customersResponse.data : [];
      const products = productsResponse.success ? productsResponse.data : [];

      const dashboardData = {
        team_members: teamMembers.length,
        total_customers: customers.length,
        total_products: products.length,
        active_team_members: teamMembers.filter((member: any) => member.status === 'active').length,
        recent_activities: [],
        performance_metrics: {
          avg_sales_per_member: 0,
          customer_growth_rate: 0,
          product_utilization: 0
        }
      };

      return this.handleSupabaseResponse(dashboardData);
    } catch (error) {
      console.error('Error fetching manager dashboard:', error);
      throw new Error('Failed to fetch manager dashboard data');
    }
  }

  // Platform Admin Dashboard Methods
  async getPlatformAdminDashboard(): Promise<ApiResponse<any>> {
    try {
      // Get tenants, users, and system metrics
      const tenantsResponse = await this.getTenants();
      const teamResponse = await this.getTeamMembers();

      const tenants = tenantsResponse.success ? tenantsResponse.data : [];
      const teamMembers = Array.isArray(teamResponse) ? teamResponse : [];

      const dashboardData = {
        total_tenants: tenants.length,
        total_users: teamMembers.length,
        active_tenants: tenants.filter((tenant: any) => tenant.status === 'active').length,
        system_metrics: {
          uptime: '99.9%',
          response_time: '120ms',
          error_rate: 0.1
        },
        recent_activities: [],
        revenue_metrics: {
          total_revenue: 0,
          monthly_revenue: 0,
          growth_rate: 0
        }
      };

      return this.handleSupabaseResponse(dashboardData);
    } catch (error) {
      console.error('Error fetching platform admin dashboard:', error);
      throw new Error('Failed to fetch platform admin dashboard data');
    }
  }

  // Support Ticket Methods
  async getSupportTicket(ticketId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      throw new Error('Failed to fetch support ticket');
    }
  }

  async getTicketMessages(ticketId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      throw new Error('Failed to fetch ticket messages');
    }
  }

  async createTicketMessage(ticketId: string, messageData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .insert({
        ticket_id: parseInt(ticketId),
        message: messageData.message,
          sender_id: messageData.sender_id,
          is_internal: messageData.is_internal ?? false
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating ticket message:', error);
      throw new Error('Failed to create ticket message');
    }
  }

  async getSupportTickets(params?: { status?: string; floor?: number; assigned_to?: string; search?: string; }): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          customer:customers(id, name, phone),
          assigned_team_member:team_members!assigned_to(id, first_name, last_name, email),
          created_by_member:team_members!created_by(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
      if (params?.floor) query = query.eq('floor', params.floor);
      if (params?.assigned_to) query = query.eq('assigned_to', params.assigned_to);
      if (params?.search) query = query.ilike('title', `%${params.search}%`);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      
      // Transform the data to include proper customer and team member names
      const transformedData = (data || []).map((ticket: any) => ({
        ...ticket,
        customer_name: ticket.customer?.name || 'Unknown Customer',
        customer_email: 'N/A', // Customers table doesn't have email column
        customer_phone: ticket.customer?.phone || 'N/A',
        assigned_to_name: ticket.assigned_team_member 
          ? `${ticket.assigned_team_member.first_name} ${ticket.assigned_team_member.last_name}` 
          : 'Unassigned',
        created_by_name: ticket.created_by_member 
          ? `${ticket.created_by_member.first_name} ${ticket.created_by_member.last_name}` 
          : 'Unknown'
      }));
      
      return this.handleSupabaseResponse(transformedData);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw new Error('Failed to fetch support tickets');
    }
  }

  async createSupportTicket(ticketData: any): Promise<ApiResponse<any>> {
    try {
      // Whitelist fields that actually exist on support_tickets
      const payload: any = {
        title: ticketData.title || 'Untitled Support Request',
        description: ticketData.description || 'No description provided',
        status: ticketData.status || 'open',
        priority: ticketData.priority || 'medium',
        customer_id: ticketData.customer_id,
        assigned_to: ticketData.assigned_to,
        created_by: ticketData.created_by,
        floor: ticketData.floor,
      };

      // Remove undefined/null values (but keep empty strings for required fields)
      const finalData = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          // Keep required fields even if they're empty strings
          const requiredFields = ['title', 'description'];
          if (requiredFields.includes(key)) {
            return value !== undefined && value !== null;
          }
          // For other fields, filter out undefined, null, and empty strings
          return value !== undefined && value !== null && value !== '';
        })
      );

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(finalData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  async updateSupportTicket(ticketId: string, updateData: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
        ...updateData,
        updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw new Error('Failed to update support ticket');
    }
  }

  async assignTicketToMe(ticketId: string): Promise<ApiResponse<any>> {
    try {
      // In app code, pass the real user id to updateSupportTicket instead
      throw new Error('assignTicketToMe is deprecated. Use updateSupportTicket with a real user id.');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw new Error('Failed to assign ticket');
    }
  }

  async resolveTicket(ticketId: string): Promise<ApiResponse<any>> {
    try {
      return this.updateSupportTicket(ticketId, { status: 'resolved' });
    } catch (error) {
      console.error('Error resolving ticket:', error);
      throw new Error('Failed to resolve ticket');
    }
  }

  async closeTicket(ticketId: string): Promise<ApiResponse<any>> {
    try {
      return this.updateSupportTicket(ticketId, { status: 'closed' });
    } catch (error) {
      console.error('Error closing ticket:', error);
      throw new Error('Failed to close ticket');
    }
  }

  // Escalation Methods
  async getEscalations(params?: any): Promise<ApiResponse<any[]>> {
    try {
      // Mock escalations data
      const mockEscalations = [
        {
          id: 1,
          title: 'High-value customer complaint',
          description: 'VIP customer unhappy with service',
          status: 'open',
          priority: 'urgent',
          customer_name: 'VIP Customer',
          assigned_to: null,
          created_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockEscalations);
    } catch (error) {
      console.error('Error fetching escalations:', error);
      throw new Error('Failed to fetch escalations');
    }
  }

  async getEscalationStats(): Promise<ApiResponse<any>> {
    try {
      const stats = {
        total_escalations: 5,
        open_escalations: 2,
        resolved_escalations: 3,
        avg_resolution_time: '2.5 days'
      };

      return this.handleSupabaseResponse(stats);
    } catch (error) {
      console.error('Error fetching escalation stats:', error);
      throw new Error('Failed to fetch escalation stats');
    }
  }

  async changeEscalationStatus(escalationId: string, newStatus: string): Promise<ApiResponse<any>> {
    try {
      const updatedEscalation = {
        id: parseInt(escalationId),
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedEscalation);
    } catch (error) {
      console.error('Error changing escalation status:', error);
      throw new Error('Failed to change escalation status');
    }
  }

  async assignEscalation(escalationId: string, userId: number): Promise<ApiResponse<any>> {
    try {
      const updatedEscalation = {
        id: parseInt(escalationId),
        assigned_to: userId,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedEscalation);
    } catch (error) {
      console.error('Error assigning escalation:', error);
      throw new Error('Failed to assign escalation');
    }
  }

  async createEscalation(escalationData: any): Promise<ApiResponse<any>> {
    try {
      const newEscalation = {
        id: Date.now(),
        title: escalationData.title,
        description: escalationData.description,
        status: 'open',
        priority: escalationData.priority || 'medium',
        customer_name: escalationData.customer_name,
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newEscalation);
    } catch (error) {
      console.error('Error creating escalation:', error);
      throw new Error('Failed to create escalation');
    }
  }

  async createEscalationNote(escalationId: string, noteData: any): Promise<ApiResponse<any>> {
    try {
      const newNote = {
        id: Date.now(),
        escalation_id: parseInt(escalationId),
        note: noteData.note,
        created_by: noteData.created_by || 1,
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newNote);
    } catch (error) {
      console.error('Error creating escalation note:', error);
      throw new Error('Failed to create escalation note');
    }
  }

  // Announcement Methods
  async getAnnouncements(): Promise<ApiResponse<any[]>> {
    try {
      // Mock announcements data
      const mockAnnouncements = [
        {
          id: 1,
          title: 'New Product Launch',
          content: 'We are excited to announce our new diamond collection',
          type: 'announcement',
          priority: 'high',
          created_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  async getTeamMessages(): Promise<ApiResponse<any[]>> {
    try {
      // Mock team messages
      const mockMessages = [
        {
          id: 1,
          sender_name: 'Manager',
          message: 'Team meeting at 3 PM today',
          type: 'message',
          created_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockMessages);
    } catch (error) {
      console.error('Error fetching team messages:', error);
      throw new Error('Failed to fetch team messages');
    }
  }

  async markAnnouncementAsRead(announcementId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      throw new Error('Failed to mark announcement as read');
    }
  }

  async acknowledgeAnnouncement(announcementId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      throw new Error('Failed to acknowledge announcement');
    }
  }

  async markMessageAsRead(messageId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  async createAnnouncement(announcementData: any): Promise<ApiResponse<any>> {
    try {
      const newAnnouncement = {
        id: Date.now(),
        title: announcementData.title,
        content: announcementData.content,
        type: 'announcement',
        priority: announcementData.priority || 'medium',
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  async createTeamMessage(messageData: any): Promise<ApiResponse<any>> {
    try {
      const newMessage = {
        id: Date.now(),
        sender_name: messageData.sender_name,
        message: messageData.message,
        type: 'message',
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newMessage);
    } catch (error) {
      console.error('Error creating team message:', error);
      throw new Error('Failed to create team message');
    }
  }

  async replyToMessage(messageId: string, replyData: any): Promise<ApiResponse<any>> {
    try {
      const newReply = {
        id: Date.now(),
        parent_message_id: parseInt(messageId),
        sender_name: replyData.sender_name,
        message: replyData.message,
        type: 'reply',
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newReply);
    } catch (error) {
      console.error('Error replying to message:', error);
      throw new Error('Failed to reply to message');
    }
  }

  // Appointment Methods
  async confirmAppointment(appointmentId: string): Promise<ApiResponse<any>> {
    try {
      const updatedAppointment = {
        id: parseInt(appointmentId),
        status: 'confirmed',
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedAppointment);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw new Error('Failed to confirm appointment');
    }
  }

  async completeAppointment(appointmentId: string, outcomeNotes: string): Promise<ApiResponse<any>> {
    try {
      const updatedAppointment = {
        id: parseInt(appointmentId),
        status: 'completed',
        outcome_notes: outcomeNotes,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedAppointment);
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw new Error('Failed to complete appointment');
    }
  }

  async cancelAppointment(appointmentId: string, cancelReason: string): Promise<ApiResponse<any>> {
    try {
      const updatedAppointment = {
        id: parseInt(appointmentId),
        status: 'cancelled',
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedAppointment);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    }
  }

  async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<ApiResponse<any>> {
    try {
      const updatedAppointment = {
        id: parseInt(appointmentId),
        date: newDate,
        time: newTime,
        status: 'rescheduled',
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedAppointment);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw new Error('Failed to reschedule appointment');
    }
  }

  async editAppointment(appointmentId: string, editData: any): Promise<ApiResponse<any>> {
    try {
      const updatedAppointment = {
        id: parseInt(appointmentId),
        ...editData,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedAppointment);
    } catch (error) {
      console.error('Error editing appointment:', error);
      throw new Error('Failed to edit appointment');
    }
  }

  // Customer Management Methods
  async getClient(clientId: string): Promise<ApiResponse<any>> {
    try {
      const customerResponse = await this.getCustomer(clientId);
      return customerResponse;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw new Error('Failed to fetch client');
    }
  }

  async updateClient(clientId: string, clientData: any): Promise<ApiResponse<any>> {
    try {
      return this.updateCustomer(parseInt(clientId), clientData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('Failed to update client');
    }
  }

  async getClientAuditLogs(clientId: string): Promise<ApiResponse<any[]>> {
    try {
      // Mock audit logs
      const mockLogs = [
        {
          id: 1,
          client_id: parseInt(clientId),
          action: 'profile_updated',
          details: 'Customer information updated',
          created_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockLogs);
    } catch (error) {
      console.error('Error fetching client audit logs:', error);
      throw new Error('Failed to fetch client audit logs');
    }
  }

  async getTrashedClients(): Promise<ApiResponse<any[]>> {
    try {
      // Mock trashed clients
      const mockTrashedClients = [
        {
          id: 1,
          name: 'Deleted Customer',
          email: 'deleted@example.com',
          deleted_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockTrashedClients);
    } catch (error) {
      console.error('Error fetching trashed clients:', error);
      throw new Error('Failed to fetch trashed clients');
    }
  }

  async restoreClient(clientId: string): Promise<ApiResponse<any>> {
    try {
      const restoredClient = {
        id: parseInt(clientId),
        restored_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(restoredClient);
    } catch (error) {
      console.error('Error restoring client:', error);
      throw new Error('Failed to restore client');
    }
  }

  async importCustomers(importData: any): Promise<ApiResponse<any>> {
    try {
      // Mock import result
      const importResult = {
        total_imported: 10,
        success_count: 8,
        error_count: 2,
        errors: ['Invalid email format', 'Missing phone number']
      };

      return this.handleSupabaseResponse(importResult);
    } catch (error) {
      console.error('Error importing customers:', error);
      throw new Error('Failed to import customers');
    }
  }

  // Pipeline Methods
  async getMyPipeline(dealId: string): Promise<ApiResponse<any>> {
    try {
      // Mock pipeline data
      const mockPipeline = {
        id: parseInt(dealId),
        title: 'Gold Necklace Deal',
        value: 50000,
        stage: 'negotiation',
        customer_name: 'John Doe',
        probability: 75,
        expected_close_date: new Date().toISOString()
      };

      return this.handleSupabaseResponse(mockPipeline);
    } catch (error) {
      console.error('Error fetching my pipeline:', error);
      throw new Error('Failed to fetch my pipeline');
    }
  }

  async getPipeline(dealId: string): Promise<ApiResponse<any>> {
    try {
      return this.getMyPipeline(dealId);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      throw new Error('Failed to fetch pipeline');
    }
  }

  async updatePipeline(dealId: string, pipelineData: any): Promise<ApiResponse<any>> {
    try {
      const updatedPipeline = {
        id: parseInt(dealId),
        ...pipelineData,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedPipeline);
    } catch (error) {
      console.error('Error updating pipeline:', error);
      throw new Error('Failed to update pipeline');
    }
  }

  async updatePipelineStage(dealId: string, stageData: any): Promise<ApiResponse<any>> {
    try {
      const updatedPipeline = {
        id: parseInt(dealId),
        stage: stageData.stage,
        updated_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(updatedPipeline);
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      throw new Error('Failed to update pipeline stage');
    }
  }

  async createSalesPipeline(pipelineData: any): Promise<ApiResponse<any>> {
    try {
      const newPipeline = {
        id: Date.now(),
        title: pipelineData.title,
        value: pipelineData.value,
        stage: 'lead',
        customer_name: pipelineData.customer_name,
        probability: pipelineData.probability || 10,
        expected_close_date: pipelineData.expected_close_date,
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newPipeline);
    } catch (error) {
      console.error('Error creating sales pipeline:', error);
      throw new Error('Failed to create sales pipeline');
    }
  }

  // Store Methods
  async getStores(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw new Error('Failed to fetch stores');
    }
  }

  async createStore(storeData: {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    manager?: string; // team_members UUID
    is_active: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const payload: Record<string, any> = {
        name: storeData.name,
        code: storeData.code,
        address: storeData.address,
        city: storeData.city,
        state: storeData.state,
        is_active: storeData.is_active,
      };

      if (storeData.manager) {
        payload.manager = storeData.manager;
      }

      const { data, error } = await supabase
        .from('stores')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error creating store:', error);
      throw new Error('Failed to create store');
    }
  }

  async updateStore(storeId: string, storeData: Partial<{
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    timezone: string;
    manager: string; // team_members UUID
    is_active: boolean;
  }>): Promise<ApiResponse<any>> {
    try {
      const cleanUpdates: Record<string, any> = Object.fromEntries(
        Object.entries(storeData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      const { data, error } = await supabase
        .from('stores')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parseInt(storeId))
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error updating store:', error);
      throw new Error('Failed to update store');
    }
  }

  // Business Settings Methods
  async getBusinessSettings(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.message && !/No rows/.test(error.message)) {
        throw new Error(error.message);
      }

      return this.handleSupabaseResponse(data || null);
    } catch (error) {
      console.error('Error fetching business settings:', error);
      throw new Error('Failed to fetch business settings');
    }
  }

  async upsertBusinessSettings(settings: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    description?: string;
    currency?: string;
    tax_rate?: number;
    business_hours?: any;
    payment_methods?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const clean = Object.fromEntries(
        Object.entries(settings).filter(([_, v]) => v !== undefined)
      );

      // If a row exists, update it; else insert
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .limit(1)
        .single();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('business_settings')
          .update({ ...clean, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return this.handleSupabaseResponse(data);
      }

      const { data, error } = await supabase
        .from('business_settings')
        .insert(clean)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.handleSupabaseResponse(data);
    } catch (error) {
      console.error('Error saving business settings:', error);
      throw new Error('Failed to save business settings');
    }
  }

  // Tenant Methods
  async getTenants(): Promise<ApiResponse<any[]>> {
    try {
      // Mock tenants data
      const mockTenants = [
        {
          id: 1,
          name: 'Sairaj Jewelries',
          domain: 'sairaj.jewelry.com',
          status: 'active',
          plan: 'premium',
          created_at: new Date().toISOString()
        }
      ];

      return this.handleSupabaseResponse(mockTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw new Error('Failed to fetch tenants');
    }
  }

  async getTenant(tenantId: string): Promise<ApiResponse<any>> {
    try {
      // Mock tenant data
      const mockTenant = {
        id: parseInt(tenantId),
        name: 'Sairaj Jewelries',
        domain: 'sairaj.jewelry.com',
        status: 'active',
        plan: 'premium',
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(mockTenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      throw new Error('Failed to fetch tenant');
    }
  }

  async deleteTenant(tenantId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant');
    }
  }

  // Notification Methods
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    try {
      return this.handleSupabaseResponse({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async createNotification(notificationData: any): Promise<ApiResponse<any>> {
    try {
      const newNotification = {
        id: Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        created_at: new Date().toISOString()
      };

      return this.handleSupabaseResponse(newNotification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }
}

export const apiService = new ApiService();
export { ApiService }; 