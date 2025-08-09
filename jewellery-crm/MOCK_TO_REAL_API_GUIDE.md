# Mock Data to Real Supabase API - Implementation Guide

## Overview
This guide shows the correct way to replace mock data with real Supabase APIs that are compatible with your existing schema.

---

## 🏗️ **Your Current Supabase Schema**

### Core Tables
- `team_members` - User management with roles and floors
- `customers` - Customer records with floor assignments  
- `products` - Product catalog with categories and pricing
- `sales` - Sales transactions with floor tracking
- `visits` - Customer visits and interests
- `appointments` - Appointment scheduling (existing)
- `categories` - Product categories (existing)

---

## 📋 **Step-by-Step Replacement Process**

### Example 1: Customers Management (High Priority)

#### ❌ Current Mock Data (Floor Manager Customers)
```typescript
// In: src/app/floor-manager/customers/page.tsx
const fetchCustomers = async () => {
  // Mock data for floor manager customers
  const mockCustomers: Customer[] = [
    {
      id: 1,
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      address: 'Mumbai, Maharashtra',
      preferences: { metal: 'Gold', style: 'Traditional' },
      total_spent: 75000,
      last_visit: '2024-01-15',
      status: 'vip',
      assigned_to: 'Floor 1'
    }
  ];
  setCustomers(mockCustomers);
};
```

#### ✅ Correct Real API Implementation

**Step 1: Update Customer Interface to Match Schema**
```typescript
interface Customer {
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
  // Computed fields from relationships
  assigned_team_member?: {
    first_name: string;
    last_name: string;
  };
}
```

**Step 2: Add API Methods to api-service.ts**
```typescript
// Get customers for a specific floor (floor manager view)
async getFloorCustomers(floor: number): Promise<ApiResponse<Customer[]>> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        assigned_team_member:team_members(first_name, last_name)
      `)
      .eq('floor', floor)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return this.handleSupabaseResponse(data || []);
  } catch (error) {
    console.error('Error fetching floor customers:', error);
    throw error;
  }
}

// Get all customers (business admin view)
async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        assigned_team_member:team_members(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return this.handleSupabaseResponse(data || []);
  } catch (error) {
    console.error('Error fetching all customers:', error);
    throw error;
  }
}

// Create new customer
async createCustomer(customerData: {
  name: string;
  phone: string;
  interest: string;
  floor: number;
  assigned_to?: string;
  notes?: string;
}): Promise<ApiResponse<Customer>> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        visited_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.handleSupabaseResponse(data);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}
```

**Step 3: Update Component to Use Real API**
```typescript
// In: src/app/floor-manager/customers/page.tsx
import { useFloor } from '@/contexts/FloorContext';

const fetchCustomers = async () => {
  try {
    setLoading(true);
    
    // Get current floor from context
    const { currentFloor } = useFloor();
    if (!currentFloor) return;
    
    const floorNumber = parseInt(currentFloor.id);
    const response = await apiService.getFloorCustomers(floorNumber);
    
    if (response.success) {
      setCustomers(response.data);
    } else {
      toast.error('Failed to load customers');
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast.error('Failed to load customers');
  } finally {
    setLoading(false);
  }
};
```

---

### Example 2: Products Management 

#### ❌ Current Mock Data
```typescript
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Gold Necklace Set',
    sku: 'GN-001',
    type: 'Necklace',
    category: 'Gold',
    price: 75000,
    stock_quantity: 5,
    status: 'active'
  }
];
```

#### ✅ Real API Implementation
```typescript
// Products are already in your schema, just need proper API methods
async getProducts(params?: {
  category?: string;
  type?: string;
  search?: string;
  status?: 'active' | 'inactive';
}): Promise<ApiResponse<Product[]>> {
  try {
    let query = supabase.from('products').select('*');
    
    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    
    if (params?.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }
    
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }
    
    if (params?.status) {
      query = query.eq('status', params.status);
    } else {
      query = query.eq('status', 'active'); // Default to active products
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return this.handleSupabaseResponse(data || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}
```

---

### Example 3: Sales Pipeline (Needs New Schema)

#### Current Mock Data Issue
The sales pipeline uses mock data because there's no `deals` or `pipeline` table in your schema.

#### ✅ Solution: Extend Schema
```sql
-- Add to your schema
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    stage TEXT NOT NULL CHECK (stage IN ('lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    assigned_to UUID REFERENCES team_members(id),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔧 **Common Patterns for Mock Data Replacement**

### Pattern 1: Simple List Replacement
```typescript
// ❌ Mock
const [items, setItems] = useState(mockData);

// ✅ Real API
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getItems();
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Pattern 2: Filter-based Data
```typescript
// ❌ Mock with filters
const filteredData = mockData.filter(item => item.status === filter);

// ✅ Real API with server-side filtering
const fetchData = async (filterParams) => {
  const response = await apiService.getItems(filterParams);
  setItems(response.data);
};
```

### Pattern 3: Role-based Data Access
```typescript
// ✅ Use your existing RLS policies
const fetchCustomers = async () => {
  // RLS automatically filters based on user role and floor
  const response = await apiService.getCustomers();
  // Floor managers only see their floor's customers
  // Business admins see all customers
};
```

---

## 📊 **Schema Extensions Needed**

For complete mock data replacement, you'll need these additional tables:

```sql
-- Orders/Sales Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    created_by UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES team_members(id),
    created_by UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 **Implementation Priority**

### Phase 1: Existing Schema (No Schema Changes)
1. **Customers** - Use existing `customers` table
2. **Products** - Use existing `products` table  
3. **Sales Analytics** - Use existing `sales` and `visits` tables
4. **Team Management** - Use existing `team_members` table

### Phase 2: Schema Extensions
1. **Orders System** - Add `orders` and `order_items` tables
2. **Sales Pipeline** - Add `deals` table
3. **Support System** - Add `support_tickets` table

---

## 📝 **Action Steps**

1. **Start with existing schema** - Replace customers and products first
2. **Update API service** - Add methods that match your schema exactly
3. **Update components** - Replace mock data calls with real API calls
4. **Add loading states** - Handle async data properly
5. **Implement error handling** - Use toast notifications
6. **Test with RLS** - Ensure proper data access by role

This approach ensures you're building on your existing schema while gradually replacing all mock data with real, properly secured Supabase APIs.
