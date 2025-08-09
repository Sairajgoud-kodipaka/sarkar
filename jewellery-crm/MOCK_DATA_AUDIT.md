# Mock Data Audit - Jewellery CRM Application

## Overview
This document provides a comprehensive audit of all pages and sections in the Jewellery CRM application that are currently using mock data instead of real Supabase APIs.

## Status Legend
- 🔴 **Uses Mock Data** - Needs API integration
- 🟡 **Partially Real** - Some real data, some mock
- 🟢 **Real API** - Fully integrated with Supabase

---

## Business Admin Section

### ✅ Real API (Completed)
- 🟢 **Business Admin Dashboard** (`/business-admin/dashboard`) - Uses real Supabase APIs
- 🟢 **Settings - Team Members** (`/business-admin/settings`) - Real API with CRUD operations

### 🔴 Mock Data (Needs Integration)
- 🔴 **Settings - Stores** (`/business-admin/settings`) - Mock store data
- 🔴 **Settings - Integrations** (`/business-admin/settings`) - Mock third-party integrations
- 🔴 **Products Management** (`/business-admin/products`) - Uses real API but may have some mock features
- 🔴 **Customers Management** (`/business-admin/customers`) - Mock customer data

---

## Floor Manager Section

### ✅ Real API (Completed)
- 🟢 **Floor Manager Dashboard** (`/floor-manager/dashboard`) - Uses real Supabase APIs for visitor/sales stats

### 🔴 Mock Data (Needs Integration)
- 🔴 **Customers** (`/floor-manager/customers`) - Mock customer data with preferences
  ```typescript
  // Mock customers with detailed preferences, spending history
  const mockCustomers: Customer[] = [
    { name: 'Priya Sharma', preferences: { metal: 'Gold', style: 'Traditional' }, ... }
  ];
  ```

- 🔴 **Products** (`/floor-manager/products`) - Mock product catalog
- 🔴 **Orders** (`/floor-manager/orders`) - Mock order management
- 🔴 **Appointments** (`/floor-manager/appointments`) - Mock appointment system
- 🔴 **Support** (`/floor-manager/support`) - Mock support tickets

---

## Sales Team Section

### 🔴 Mock Data (All Needs Integration)
- 🔴 **Sales Profile** (`/sales/profile`) - Mock sales rep profile data
- 🔴 **Products** (`/sales/products`) - Mock product catalog for sales
  ```typescript
  // Mock products with SKU, pricing, inventory
  const mockProducts: Product[] = [
    { name: 'Gold Necklace Set', sku: 'GN-001', price: 75000, ... }
  ];
  ```

- 🔴 **Sales Pipeline** (`/sales/pipeline`) - Mock deal pipeline
  ```typescript
  // Mock sales deals with stages and probabilities
  const mockDeals: PipelineDeal[] = [
    { title: 'Gold Necklace Sale', stage: 'qualified', probability: 75, ... }
  ];
  ```

- 🔴 **Orders** (`/sales/orders`) - Mock order management for sales
- 🔴 **Appointments** (`/sales/appointments`) - Mock appointment booking
- 🔴 **Support** (`/sales/support`) - Mock support system

---

## Platform/Admin Section

### 🔴 Mock Data (All Needs Integration)
- 🔴 **Platform Analytics** (`/platform/analytics`) - Mock platform-wide analytics
  ```typescript
  // Mock analytics with tenant growth, revenue metrics
  const mockData: AnalyticsData = {
    platform_growth: { total_tenants: 6, new_tenants_this_month: 2 },
    revenue_metrics: { total_revenue: 2500000, monthly_revenue: 450000 }
  };
  ```

- 🔴 **Platform Users** (`/platform/users`) - Mock user management
- 🔴 **Platform Billing** (`/platform/billing`) - Mock billing and subscription data

---

## Component-Level Mock Data

### Dashboard Components
- 🔴 **SalesTeamDashboard** - Mock sales performance data
- 🔴 **StoreManagerDashboard** - Mock store-specific metrics

### Other Components
- 🟢 **BusinessAdminDashboard** - Real API integration (completed)

---

## Core Mock Data File
- 🔴 **`src/lib/mock-data.ts`** - Central mock data file containing:
  - Mock users (business admin, floor managers)
  - Mock customers with floor assignments
  - Mock products with categories and pricing
  - Mock sales transactions
  - Mock visits and interactions

---

## Priority Matrix for Integration

### High Priority (Business Critical)
1. 🔴 **Business Admin - Customers** - Core customer management
2. 🔴 **Floor Manager - Customers** - Floor-specific customer data
3. 🔴 **Sales Pipeline** - Deal tracking and management
4. 🔴 **Products Management** - Inventory and catalog

### Medium Priority (Feature Enhancement)
5. 🔴 **Orders Management** - Order processing and tracking
6. 🔴 **Appointments System** - Booking and scheduling
7. 🔴 **Sales Analytics** - Performance metrics

### Lower Priority (Admin/Platform)
8. 🔴 **Platform Analytics** - Multi-tenant insights
9. 🔴 **Support Systems** - Ticket management
10. 🔴 **Store Management** - Multi-location support

---

## Integration Requirements

### Database Schema Needs
- ✅ **team_members** - Already implemented
- ✅ **customers** - Table exists, needs API integration
- ✅ **products** - Table exists, needs full integration
- ✅ **sales** - Table exists, needs integration
- ✅ **visits** - Table exists, needs integration
- 🔴 **orders** - New table needed
- 🔴 **appointments** - New table needed
- 🔴 **support_tickets** - New table needed
- 🔴 **deals/pipeline** - New table needed

### API Methods Needed
- Customer CRUD operations
- Product management with categories
- Order processing workflow
- Appointment booking system
- Sales pipeline management
- Analytics and reporting endpoints
- Multi-tenant platform metrics

---

## Total Count Summary

| Section | Total Pages | Real API | Mock Data | Completion % |
|---------|-------------|----------|-----------|--------------|
| Business Admin | 4 | 2 | 2 | 50% |
| Floor Manager | 6 | 1 | 5 | 17% |
| Sales Team | 6 | 0 | 6 | 0% |
| Platform/Admin | 3 | 0 | 3 | 0% |
| **TOTAL** | **19** | **3** | **16** | **16%** |

## Next Steps
1. Prioritize customer management pages (Business Admin + Floor Manager)
2. Implement sales pipeline and product management
3. Add order and appointment systems
4. Complete platform analytics and admin features
5. Remove mock data file once all integrations are complete

---

*Last Updated: Current Date*
*Status: 16% Real API Integration Complete*
