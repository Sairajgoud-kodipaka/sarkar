// Comprehensive mock data for Sarkar CRM
import { User, Customer, Product, Sale, Visit } from './api-service';

// Mock users with business admin and floor managers
export const mockUsers: (User & { password: string })[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@sarkarcrm.com',
    first_name: 'Business',
    last_name: 'Admin',
    role: 'business_admin',
    name: 'Business Admin',
    phone: '+91 9876543210',
    address: 'Mumbai, Maharashtra',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    password: 'admin123'
  },
  {
    id: 2,
    username: 'floor1_manager',
    email: 'floor1@sarkarcrm.com',
    first_name: 'Floor',
    last_name: 'Manager 1',
    role: 'floor_manager',
    name: 'Floor Manager 1',
    phone: '+91 9876543211',
    address: 'Mumbai, Maharashtra',
    floor: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    password: 'floor123'
  },
  {
    id: 3,
    username: 'floor2_manager',
    email: 'floor2@sarkarcrm.com',
    first_name: 'Floor',
    last_name: 'Manager 2',
    role: 'floor_manager',
    name: 'Floor Manager 2',
    phone: '+91 9876543212',
    address: 'Mumbai, Maharashtra',
    floor: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    password: 'floor123'
  },
  {
    id: 4,
    username: 'floor3_manager',
    email: 'floor3@sarkarcrm.com',
    first_name: 'Floor',
    last_name: 'Manager 3',
    role: 'floor_manager',
    name: 'Floor Manager 3',
    phone: '+91 9876543213',
    address: 'Mumbai, Maharashtra',
    floor: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    password: 'floor123'
  }
];

// Mock customers with floor assignments
export const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    phone: '+91 9876543210',
    interest: 'Gold Necklace',
    floor: 1,
    visited_date: '2024-01-15',
    assigned_to: 2,
    notes: 'Interested in traditional gold jewellery',
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    phone: '+91 9876543211',
    interest: 'Diamond Ring',
    floor: 1,
    visited_date: '2024-01-16',
    assigned_to: 2,
    notes: 'Looking for engagement ring',
    status: 'active',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z'
  },
  {
    id: 3,
    name: 'Amit Patel',
    phone: '+91 9876543212',
    interest: 'Silver Earrings',
    floor: 2,
    visited_date: '2024-01-17',
    assigned_to: 3,
    notes: 'Budget conscious customer',
    status: 'active',
    created_at: '2024-01-17T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z'
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    phone: '+91 9876543213',
    interest: 'Platinum Chain',
    floor: 2,
    visited_date: '2024-01-18',
    assigned_to: 3,
    notes: 'High-end customer',
    status: 'active',
    created_at: '2024-01-18T00:00:00Z',
    updated_at: '2024-01-18T00:00:00Z'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    phone: '+91 9876543214',
    interest: 'Pearl Set',
    floor: 3,
    visited_date: '2024-01-19',
    assigned_to: 4,
    notes: 'Wedding jewellery requirement',
    status: 'active',
    created_at: '2024-01-19T00:00:00Z',
    updated_at: '2024-01-19T00:00:00Z'
  },
  {
    id: 6,
    name: 'Anjali Desai',
    phone: '+91 9876543215',
    interest: 'Gold Bangles',
    floor: 3,
    visited_date: '2024-01-20',
    assigned_to: 4,
    notes: 'Traditional jewellery lover',
    status: 'active',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 7,
    name: 'Rahul Verma',
    phone: '+91 9876543216',
    interest: 'Diamond Studs',
    floor: 1,
    visited_date: '2024-01-21',
    assigned_to: 2,
    notes: 'Gift for wife',
    status: 'active',
    created_at: '2024-01-21T00:00:00Z',
    updated_at: '2024-01-21T00:00:00Z'
  },
  {
    id: 8,
    name: 'Meera Iyer',
    phone: '+91 9876543217',
    interest: 'Silver Necklace',
    floor: 2,
    visited_date: '2024-01-22',
    assigned_to: 3,
    notes: 'Fashion jewellery enthusiast',
    status: 'active',
    created_at: '2024-01-22T00:00:00Z',
    updated_at: '2024-01-22T00:00:00Z'
  }
];

// Mock products with various categories and types
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Traditional Gold Necklace',
    sku: 'GOLD-NECK-001',
    type: 'Necklace',
    category: 'Gold',
    price: 75000,
    image: '/images/gold-necklace.jpg',
    description: 'Traditional 22K gold necklace with intricate design',
    stock_quantity: 5,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Diamond Solitaire Ring',
    sku: 'DIAMOND-RING-001',
    type: 'Ring',
    category: 'Diamond',
    price: 150000,
    image: '/images/diamond-ring.jpg',
    description: '1 carat diamond solitaire ring in white gold',
    stock_quantity: 3,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Silver Filigree Earrings',
    sku: 'SILVER-EAR-001',
    type: 'Earrings',
    category: 'Silver',
    price: 8500,
    image: '/images/silver-earrings.jpg',
    description: 'Handcrafted silver filigree earrings',
    stock_quantity: 12,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Platinum Chain',
    sku: 'PLATINUM-CHAIN-001',
    type: 'Chain',
    category: 'Platinum',
    price: 95000,
    image: '/images/platinum-chain.jpg',
    description: 'Pure platinum chain with modern design',
    stock_quantity: 2,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Pearl Drop Earrings',
    sku: 'PEARL-EAR-001',
    type: 'Earrings',
    category: 'Pearl',
    price: 25000,
    image: '/images/pearl-earrings.jpg',
    description: 'South sea pearl drop earrings',
    stock_quantity: 8,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 6,
    name: 'Gold Bangles Set',
    sku: 'GOLD-BANGLE-001',
    type: 'Bangles',
    category: 'Gold',
    price: 45000,
    image: '/images/gold-bangles.jpg',
    description: 'Set of 4 traditional gold bangles',
    stock_quantity: 6,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 7,
    name: 'Diamond Studs',
    sku: 'DIAMOND-STUD-001',
    type: 'Earrings',
    category: 'Diamond',
    price: 75000,
    image: '/images/diamond-studs.jpg',
    description: '0.5 carat diamond studs',
    stock_quantity: 4,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 8,
    name: 'Silver Necklace',
    sku: 'SILVER-NECK-001',
    type: 'Necklace',
    category: 'Silver',
    price: 12000,
    image: '/images/silver-necklace.jpg',
    description: 'Contemporary silver necklace',
    stock_quantity: 15,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock sales data
export const mockSales: Sale[] = [
  {
    id: 1,
    customer_id: 1,
    customer_name: 'Rajesh Kumar',
    amount: 75000,
    date: '2024-01-15',
    floor: 1,
    created_by: 2,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: 'Priya Sharma',
    amount: 150000,
    date: '2024-01-16',
    floor: 1,
    created_by: 2,
    created_at: '2024-01-16T00:00:00Z'
  },
  {
    id: 3,
    customer_id: 3,
    customer_name: 'Amit Patel',
    amount: 8500,
    date: '2024-01-17',
    floor: 2,
    created_by: 3,
    created_at: '2024-01-17T00:00:00Z'
  },
  {
    id: 4,
    customer_id: 4,
    customer_name: 'Sneha Reddy',
    amount: 95000,
    date: '2024-01-18',
    floor: 2,
    created_by: 3,
    created_at: '2024-01-18T00:00:00Z'
  },
  {
    id: 5,
    customer_id: 5,
    customer_name: 'Vikram Singh',
    amount: 25000,
    date: '2024-01-19',
    floor: 3,
    created_by: 4,
    created_at: '2024-01-19T00:00:00Z'
  },
  {
    id: 6,
    customer_id: 6,
    customer_name: 'Anjali Desai',
    amount: 45000,
    date: '2024-01-20',
    floor: 3,
    created_by: 4,
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 7,
    customer_id: 7,
    customer_name: 'Rahul Verma',
    amount: 75000,
    date: '2024-01-21',
    floor: 1,
    created_by: 2,
    created_at: '2024-01-21T00:00:00Z'
  },
  {
    id: 8,
    customer_id: 8,
    customer_name: 'Meera Iyer',
    amount: 12000,
    date: '2024-01-22',
    floor: 2,
    created_by: 3,
    created_at: '2024-01-22T00:00:00Z'
  }
];

// Mock visits data
export const mockVisits: Visit[] = [
  {
    id: 1,
    customer_id: 1,
    customer_name: 'Rajesh Kumar',
    floor: 1,
    date: '2024-01-15',
    interest: 'Gold Necklace',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: 'Priya Sharma',
    floor: 1,
    date: '2024-01-16',
    interest: 'Diamond Ring',
    created_at: '2024-01-16T00:00:00Z'
  },
  {
    id: 3,
    customer_id: 3,
    customer_name: 'Amit Patel',
    floor: 2,
    date: '2024-01-17',
    interest: 'Silver Earrings',
    created_at: '2024-01-17T00:00:00Z'
  },
  {
    id: 4,
    customer_id: 4,
    customer_name: 'Sneha Reddy',
    floor: 2,
    date: '2024-01-18',
    interest: 'Platinum Chain',
    created_at: '2024-01-18T00:00:00Z'
  },
  {
    id: 5,
    customer_id: 5,
    customer_name: 'Vikram Singh',
    floor: 3,
    date: '2024-01-19',
    interest: 'Pearl Set',
    created_at: '2024-01-19T00:00:00Z'
  },
  {
    id: 6,
    customer_id: 6,
    customer_name: 'Anjali Desai',
    floor: 3,
    date: '2024-01-20',
    interest: 'Gold Bangles',
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 7,
    customer_id: 7,
    customer_name: 'Rahul Verma',
    floor: 1,
    date: '2024-01-21',
    interest: 'Diamond Studs',
    created_at: '2024-01-21T00:00:00Z'
  },
  {
    id: 8,
    customer_id: 8,
    customer_name: 'Meera Iyer',
    floor: 2,
    date: '2024-01-22',
    interest: 'Silver Necklace',
    created_at: '2024-01-22T00:00:00Z'
  }
];

// Export all mock data as a single object
export const mockData = {
  users: mockUsers,
  customers: mockCustomers,
  products: mockProducts,
  sales: mockSales,
  visits: mockVisits
};

// Helper functions for getting mock data
export function getMockProducts(tenantId: string): Product[] {
  return mockProducts;
}

export function getMockCategories(tenantId: string): any[] {
  return [
    { id: 1, name: 'Gold', description: 'Traditional gold jewellery' },
    { id: 2, name: 'Diamond', description: 'Precious diamond jewellery' },
    { id: 3, name: 'Silver', description: 'Elegant silver jewellery' },
    { id: 4, name: 'Platinum', description: 'Luxury platinum jewellery' },
    { id: 5, name: 'Pearl', description: 'Beautiful pearl jewellery' }
  ];
} 