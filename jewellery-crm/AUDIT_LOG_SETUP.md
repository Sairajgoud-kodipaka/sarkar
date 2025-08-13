# Audit Log System Setup Guide

This guide explains how to set up and use the comprehensive audit logging system for the Jewellery CRM.

## 🎯 Overview

The audit log system automatically tracks all changes made to the CRM system, including:
- Customer records (create, update, delete)
- Product information (create, update, delete)
- Orders and transactions (create, update, delete)
- Appointments (create, update, delete)
- User management (create, update, delete)
- Inventory changes (create, update)
- Stock transfers (create, update)
- Announcements (create, update, delete)
- Support tickets (create, update)
- Business settings (update)

## 🚀 Quick Setup

### 1. Database Setup

Run the audit triggers SQL file in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database/audit-triggers.sql
-- This will create all necessary functions and triggers
```

### 2. Frontend Integration

The audit log system is already integrated into the frontend:

- **Audit Dashboard**: `/business-admin/audit-logs`
- **Customer Audit Logs**: Available in customer detail modals
- **API Service**: Comprehensive audit log methods
- **Types**: Full TypeScript support

## 📊 Features

### Automatic Logging
- **Real-time tracking** of all database changes
- **User context** (who made the change)
- **IP address** tracking for security
- **User agent** information
- **Detailed change tracking** (old vs new values)

### Comprehensive Coverage
- **All CRUD operations** are automatically logged
- **Context-specific information** for each table type
- **Soft delete support** with reason tracking
- **Status change tracking** for workflows

### Advanced Filtering
- Filter by table name
- Filter by action type
- Filter by user
- Filter by date range
- Filter by record ID

### Export Capabilities
- CSV export
- Excel export
- Filtered exports
- Bulk data export

## 🔧 Database Schema

The audit log system uses the existing `audit_logs` table:

```sql
CREATE TABLE public.audit_logs (
  id integer NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  record_id integer NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['create', 'update', 'delete', 'restore', 'login', 'logout', 'export', 'import'])),
  old_values jsonb,
  new_values jsonb,
  user_id uuid,
  user_email text,
  ip_address text,
  user_agent text,
  additional_context jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.team_members(id)
);
```

## 🎮 Usage Examples

### Viewing Audit Logs

1. **Navigate to Audit Dashboard**:
   ```
   Business Admin → Audit Logs
   ```

2. **Filter by specific criteria**:
   - Table: customers, products, orders, etc.
   - Action: create, update, delete, etc.
   - Date range: specific time periods
   - User: specific team member

3. **View detailed changes**:
   - Previous values (red background)
   - New values (green background)
   - Context information
   - User and IP details

### Programmatic Access

```typescript
import { AuditService } from '@/lib/audit-service';

// Get all audit logs
const logs = await AuditService.getAuditLogs();

// Get logs for specific record
const customerLogs = await AuditService.getRecordAuditLogs('customers', 123);

// Get logs for specific user
const userLogs = await AuditService.getUserAuditLogs('user-id');

// Get audit summary
const summary = await AuditService.getAuditSummary('2024-01-01', '2024-12-31');
```

### API Service Methods

```typescript
import { apiService } from '@/lib/api-service';

// Get all audit logs
const response = await apiService.getAuditLogs();

// Get table-specific logs
const customerLogs = await apiService.getTableAuditLogs('customers');

// Get user-specific logs
const userLogs = await apiService.getUserAuditLogs('user-id');

// Get summary statistics
const summary = await apiService.getAuditSummary();

// Export audit logs
const exportData = await apiService.exportAuditLogs({}, 'csv');
```

## 🛡️ Security Features

### Access Control
- **Role-based access**: Only business admins can view audit logs
- **Secure functions**: Uses `SECURITY DEFINER` for proper access control
- **User context**: Captures authenticated user information

### Data Protection
- **IP tracking**: Records source of each action
- **User agent**: Tracks browser/client information
- **Timestamp**: Precise timing of all actions
- **Audit trail**: Complete history of changes

## 📈 Monitoring & Analytics

### Dashboard Metrics
- **Total actions**: Overall system activity
- **Active users**: Number of users making changes
- **Tables monitored**: Coverage of audit system
- **Today's actions**: Recent activity summary

### Detailed Analytics
- **Actions by type**: Distribution of operations
- **Actions by user**: User activity patterns
- **Actions by table**: Table change frequency
- **Recent activity**: Latest system changes

## 🔍 Troubleshooting

### Common Issues

1. **Triggers not working**:
   - Ensure SQL file was run completely
   - Check for syntax errors in Supabase
   - Verify table permissions

2. **No audit logs appearing**:
   - Check if triggers are active
   - Verify user authentication
   - Check database connection

3. **Performance issues**:
   - Monitor audit_logs table size
   - Consider archiving old logs
   - Optimize queries with proper indexing

### Debug Mode

Enable debug logging in the audit service:

```typescript
// In audit-service.ts
console.log('Audit action:', params);
```

## 📚 API Reference

### AuditService Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `logAction()` | Log a custom audit action | `params` object |
| `getAuditLogs()` | Get filtered audit logs | `filters` object |
| `getRecordAuditLogs()` | Get logs for specific record | `tableName`, `recordId` |
| `getUserAuditLogs()` | Get logs for specific user | `userId`, `limit` |
| `getAuditSummary()` | Get summary statistics | `dateFrom`, `dateTo` |

### AuditLog Interface

```typescript
interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: 'create' | 'update' | 'delete' | 'restore' | 'login' | 'logout' | 'export' | 'import';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  additional_context?: Record<string, any>;
  created_at: string;
}
```

## 🚀 Best Practices

### Performance
- **Regular cleanup**: Archive old audit logs
- **Indexing**: Add indexes on frequently queried columns
- **Partitioning**: Consider table partitioning for large datasets

### Security
- **Access control**: Limit audit log access to authorized users
- **Data retention**: Implement appropriate retention policies
- **Monitoring**: Set up alerts for suspicious activities

### Maintenance
- **Regular backups**: Backup audit logs regularly
- **Performance monitoring**: Monitor query performance
- **Storage management**: Monitor disk space usage

## 🔗 Related Components

- **AuditLogDashboard**: Main audit log interface
- **CustomerDetailModal**: Customer-specific audit logs
- **AuditService**: Backend audit service
- **API Service**: REST API endpoints
- **Database Triggers**: Automatic logging system

## 📞 Support

For issues or questions about the audit log system:

1. Check the troubleshooting section above
2. Review the database triggers SQL file
3. Check browser console for JavaScript errors
4. Verify Supabase connection and permissions

## 🎉 Conclusion

The audit log system provides comprehensive tracking of all CRM activities, ensuring transparency, security, and compliance. With automatic logging, detailed change tracking, and powerful filtering capabilities, you have complete visibility into your system's usage and changes.

The system is designed to be:
- **Automatic**: No manual intervention required
- **Comprehensive**: Covers all major system operations
- **Secure**: Proper access control and data protection
- **Scalable**: Handles high-volume operations efficiently
- **User-friendly**: Intuitive interface for business users
