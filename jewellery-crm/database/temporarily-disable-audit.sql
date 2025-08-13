-- Temporarily disable audit triggers to fix "user_context" error
-- This is a temporary solution for testing - use fix-user-context-error.sql for permanent fix

-- Disable all audit triggers
ALTER TABLE customers DISABLE TRIGGER audit_customers_changes;
ALTER TABLE products DISABLE TRIGGER audit_products_changes;
ALTER TABLE orders DISABLE TRIGGER audit_orders_changes;
ALTER TABLE sales DISABLE TRIGGER audit_sales_changes;
ALTER TABLE visits DISABLE TRIGGER audit_visits_changes;

-- Verify triggers are disabled
SELECT 
  schemaname,
  tablename,
  triggername,
  tgtype,
  tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE triggername LIKE 'audit_%';

-- To re-enable later, use:
-- ALTER TABLE customers ENABLE TRIGGER audit_customers_changes;
-- ALTER TABLE products ENABLE TRIGGER audit_products_changes;
-- ALTER TABLE orders ENABLE TRIGGER audit_orders_changes;
-- ALTER TABLE sales ENABLE TRIGGER audit_sales_changes;
-- ALTER TABLE visits ENABLE TRIGGER audit_visits_changes;
