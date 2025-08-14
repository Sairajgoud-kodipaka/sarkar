# Store Isolation Testing Guide

## Overview

This guide will help you test the store isolation functionality to ensure that users can only access data from their assigned store, providing complete data isolation between different store locations.

## 🚀 Quick Start Testing

### 1. Access the Test Page
Navigate to: `/test-store-isolation` in your application

### 2. Run Basic Tests
- Click "Test Store 1" to test isolation for Store 1
- Click "Test Store 2" to test isolation for Store 2  
- Click "Test Store 3" to test isolation for Store 3
- Click "Run All Tests" to test all stores at once

### 3. Review Results
Check the test results to verify:
- ✅ Data filtering is working correctly
- ✅ No data leakage between stores
- ✅ Admin users can see all data
- ✅ Regular users only see their store data

## 🔍 What the Tests Check

### Test 1: Customer Isolation
- **Purpose**: Verify customers are filtered by store
- **Expected**: Users only see customers from their assigned store
- **Exception**: Business Admin sees all customers

### Test 2: Product Isolation  
- **Purpose**: Verify products are filtered by store
- **Expected**: Users only see products from their assigned store
- **Exception**: Business Admin sees all products

### Test 3: Sales Isolation
- **Purpose**: Verify sales are filtered by store
- **Expected**: Users only see sales from their assigned store
- **Exception**: Business Admin sees all sales

## 🧪 Testing Scenarios

### Scenario 1: Store Manager Testing
1. **Login** as a Store Manager assigned to Store 1
2. **Run Test** for Store 1 → Should show access granted
3. **Run Test** for Store 2 → Should show access restricted
4. **Verify** only Store 1 data is visible

### Scenario 2: Floor Manager Testing
1. **Login** as a Floor Manager assigned to Store 1, Floor 2
2. **Run Test** for Store 1 → Should show access granted
3. **Run Test** for Store 2 → Should show access restricted
4. **Verify** only Store 1 data is visible

### Scenario 3: Business Admin Testing
1. **Login** as a Business Admin
2. **Run Test** for any store → Should show access granted
3. **Verify** all store data is visible
4. **Check** that no filtering is applied

### Scenario 4: Sales Person Testing
1. **Login** as a Sales Person assigned to Store 1, Floor 1
2. **Run Test** for Store 1 → Should show access granted
3. **Run Test** for Store 2 → Should show access restricted
4. **Verify** only Store 1 data is visible

## 📊 Expected Test Results

### For Regular Users (Store-Specific)
```
Store 1 Test: ✅ Access Granted, Isolation Working
Store 2 Test: ❌ Access Restricted
Store 3 Test: ❌ Access Restricted

Test Results:
- Total Customers: 150 (all customers in system)
- Store Customers: 50 (only Store 1 customers)
- Total Products: 300 (all products in system)  
- Store Products: 100 (only Store 1 products)
- Total Sales: 75 (all sales in system)
- Store Sales: 25 (only Store 1 sales)
```

### For Business Admin Users
```
Store 1 Test: ✅ Access Granted, Isolation Working
Store 2 Test: ✅ Access Granted, Isolation Working  
Store 3 Test: ✅ Access Granted, Isolation Working

Test Results:
- Total Customers: 150 (all customers in system)
- Store Customers: 150 (all customers visible)
- Total Products: 300 (all products in system)
- Store Products: 300 (all products visible)
- Total Sales: 75 (all sales in system)
- Store Sales: 75 (all sales visible)
```

## 🚨 Troubleshooting Common Issues

### Issue 1: All Users See All Data
**Problem**: Store isolation not working
**Symptoms**: 
- All test results show same data counts
- No filtering applied
- Access granted to all stores

**Solutions**:
1. Check if `getCurrentUserStore()` returns correct store ID
2. Verify user metadata contains store information
3. Check database RLS policies are active
4. Ensure `store_id` fields exist in tables

### Issue 2: Users Can't See Any Data
**Problem**: Over-restrictive filtering
**Symptoms**:
- All test results show 0 counts
- Access restricted to all stores
- Empty data sets

**Solutions**:
1. Check if user has valid store assignment
2. Verify `store_id` values in database
3. Check RLS policy syntax
4. Ensure user role permissions are correct

### Issue 3: Inconsistent Filtering
**Problem**: Some data filtered, some not
**Symptoms**:
- Mixed results across different data types
- Some tables filtered, others not
- Inconsistent access patterns

**Solutions**:
1. Verify all tables have `store_id` fields
2. Check RLS policies on all tables
3. Ensure consistent store ID data types
4. Verify foreign key relationships

## 🔧 Manual Testing Steps

### Step 1: Database Verification
```sql
-- Check if store_id fields exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'store_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('customers', 'products', 'sales');

-- Check store context functions
SELECT get_current_store_id(), get_current_user_role();
```

### Step 2: User Store Assignment
```sql
-- Check user store assignments
SELECT id, email, role, store_id 
FROM team_members 
WHERE email = 'user@example.com';

-- Update user store if needed
UPDATE team_members 
SET store_id = 1 
WHERE email = 'user@example.com';
```

### Step 3: Data Verification
```sql
-- Check data distribution across stores
SELECT store_id, COUNT(*) as count 
FROM customers 
GROUP BY store_id;

-- Verify store isolation
SELECT * FROM customers WHERE store_id = 1;
SELECT * FROM customers WHERE store_id = 2;
```

## 📱 Testing via API

### Test Store Isolation via API
```typescript
// Test with different store contexts
const testStore1 = await apiService.testStoreIsolation(1);
const testStore2 = await apiService.testStoreIsolation(2);
const testStore3 = await apiService.testStoreIsolation(3);

console.log('Store 1 Test:', testStore1);
console.log('Store 2 Test:', testStore2);
console.log('Store 3 Test:', testStore3);
```

### Test Individual Data Fetching
```typescript
// Test customer filtering
const customers = await apiService.getCustomers();
console.log('Total customers:', customers.data?.length);

// Test product filtering  
const products = await apiService.getProducts();
console.log('Total products:', products.data?.length);

// Test sales filtering
const sales = await apiService.getSales();
console.log('Total sales:', sales.data?.length);
```

## ✅ Success Criteria

### Store Isolation Working Correctly When:
1. **Regular users** only see data from their assigned store
2. **Business Admin users** can see data from all stores
3. **No data leakage** occurs between different stores
4. **API responses** are properly filtered by store
5. **Database queries** respect RLS policies
6. **New records** automatically get correct store_id

### Performance Requirements:
1. **Query response time** < 2 seconds for filtered data
2. **No significant performance degradation** with store filtering
3. **Indexes** properly utilized for store_id filtering
4. **Caching** works correctly with store context

## 🎯 Next Steps After Testing

### If Tests Pass:
1. ✅ Store isolation is working correctly
2. ✅ Deploy to production environment
3. ✅ Monitor for any performance issues
4. ✅ Train users on store-specific workflows

### If Tests Fail:
1. ❌ Identify specific failure points
2. ❌ Check database schema and RLS policies
3. ❌ Verify user store assignments
4. ❌ Review API service implementation
5. ❌ Fix issues and re-run tests

## 📞 Getting Help

### When Tests Fail:
1. **Check browser console** for error messages
2. **Review test results** for specific failure details
3. **Verify database state** matches expected schema
4. **Check user authentication** and store assignment
5. **Review RLS policies** and database functions

### Support Resources:
- **This Testing Guide** - For common issues and solutions
- **STORE_ISOLATION.md** - For implementation details
- **Database logs** - For RLS policy issues
- **API logs** - For service-level problems

---

**Remember**: Store isolation is critical for data security. Always test thoroughly before deploying to production!
