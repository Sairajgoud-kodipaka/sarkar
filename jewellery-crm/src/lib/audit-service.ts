import { supabase } from './supabase';
import { AuditLog, AuditLogFilters, AuditLogSummary } from '../types';

/**
 * Audit Service for tracking all system changes
 * This service provides comprehensive audit logging capabilities
 */
export class AuditService {
  /**
   * Log a new audit entry
   */
  static async logAction(params: {
    table_name: string;
    record_id: number;
    action: AuditLog['action'];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    user_id?: string;
    user_email?: string;
    ip_address?: string;
    user_agent?: string;
    additional_context?: Record<string, any>;
  }): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          table_name: params.table_name,
          record_id: params.record_id,
          action: params.action,
          old_values: params.old_values || null,
          new_values: params.new_values || null,
          user_id: params.user_id || null,
          user_email: params.user_email || null,
          ip_address: params.ip_address || null,
          user_agent: params.user_agent || null,
          additional_context: params.additional_context || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging audit action:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in audit logging:', error);
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.record_id) {
        query = query.eq('record_id', filters.record_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific record
   */
  static async getRecordAuditLogs(tableName: string, recordId: number): Promise<AuditLog[]> {
    return this.getAuditLogs({
      table_name: tableName,
      record_id: recordId,
      limit: 100
    });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({
      user_id: userId,
      limit
    });
  }

  /**
   * Get audit summary statistics
   */
  static async getAuditSummary(dateFrom?: string, dateTo?: string): Promise<AuditLogSummary | null> {
    try {
      // Get total actions
      const totalQuery = supabase
        .from('audit_logs')
        .select('action', { count: 'exact', head: true });

      if (dateFrom) {
        totalQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        totalQuery.lte('created_at', dateTo);
      }

      const { count: totalActions } = await totalQuery;

      // Get actions by type
      const actionsByTypeQuery = supabase
        .from('audit_logs')
        .select('action')
        .order('action');

      if (dateFrom) {
        actionsByTypeQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        actionsByTypeQuery.lte('created_at', dateTo);
      }

      const { data: actionsData } = await actionsByTypeQuery;
      
      const actionsByType: Record<string, number> = {};
      if (actionsData) {
        actionsData.forEach(item => {
          actionsByType[item.action] = (actionsByType[item.action] || 0) + 1;
        });
      }

      // Get actions by user
      const actionsByUserQuery = supabase
        .from('audit_logs')
        .select('user_email')
        .order('user_email');

      if (dateFrom) {
        actionsByUserQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        actionsByUserQuery.lte('created_at', dateTo);
      }

      const { data: usersData } = await actionsByUserQuery;
      
      const actionsByUser: Record<string, number> = {};
      if (usersData) {
        usersData.forEach(item => {
          if (item.user_email) {
            actionsByUser[item.user_email] = (actionsByUser[item.user_email] || 0) + 1;
          }
        });
      }

      // Get actions by table
      const actionsByTableQuery = supabase
        .from('audit_logs')
        .select('table_name')
        .order('table_name');

      if (dateFrom) {
        actionsByTableQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        actionsByTableQuery.lte('created_at', dateTo);
      }

      const { data: tablesData } = await actionsByTableQuery;
      
      const actionsByTable: Record<string, number> = {};
      if (tablesData) {
        tablesData.forEach(item => {
          actionsByTable[item.table_name] = (actionsByTable[item.table_name] || 0) + 1;
        });
      }

      // Get recent activity
      const recentActivity = await this.getAuditLogs({
        limit: 10
      });

      return {
        total_actions: totalActions || 0,
        actions_by_type: actionsByType,
        actions_by_user: actionsByUser,
        actions_by_table: actionsByTable,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error getting audit summary:', error);
      return null;
    }
  }

  /**
   * Log user login
   */
  static async logUserLogin(userId: string, userEmail: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logAction({
      table_name: 'auth.users',
      record_id: 0, // No specific record for login
      action: 'login',
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      user_agent: userAgent,
      additional_context: {
        event_type: 'authentication',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log user logout
   */
  static async logUserLogout(userId: string, userEmail: string, ipAddress?: string): Promise<void> {
    await this.logAction({
      table_name: 'auth.users',
      record_id: 0,
      action: 'logout',
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      additional_context: {
        event_type: 'authentication',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log data export
   */
  static async logDataExport(userId: string, userEmail: string, tableName: string, recordCount: number, format: string): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: 0,
      action: 'export',
      user_id: userId,
      user_email: userEmail,
      additional_context: {
        event_type: 'data_export',
        record_count: recordCount,
        export_format: format,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log data import
   */
  static async logDataImport(userId: string, userEmail: string, tableName: string, recordCount: number, successCount: number, errorCount: number): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: 0,
      action: 'import',
      user_id: userId,
      user_email: userEmail,
      additional_context: {
        event_type: 'data_import',
        total_records: recordCount,
        success_count: successCount,
        error_count: errorCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log record creation
   */
  static async logRecordCreation(tableName: string, recordId: number, newValues: Record<string, any>, userId?: string, userEmail?: string): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: recordId,
      action: 'create',
      new_values: newValues,
      user_id: userId,
      user_email: userEmail
    });
  }

  /**
   * Log record update
   */
  static async logRecordUpdate(tableName: string, recordId: number, oldValues: Record<string, any>, newValues: Record<string, any>, userId?: string, userEmail?: string): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: recordId,
      action: 'update',
      old_values: oldValues,
      new_values: newValues,
      user_id: userId,
      user_email: userEmail
    });
  }

  /**
   * Log record deletion
   */
  static async logRecordDeletion(tableName: string, recordId: number, oldValues: Record<string, any>, userId?: string, userEmail?: string): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: recordId,
      action: 'delete',
      old_values: oldValues,
      user_id: userId,
      user_email: userEmail
    });
  }

  /**
   * Log record restoration
   */
  static async logRecordRestoration(tableName: string, recordId: number, newValues: Record<string, any>, userId?: string, userEmail?: string): Promise<void> {
    await this.logAction({
      table_name: tableName,
      record_id: recordId,
      action: 'restore',
      new_values: newValues,
      user_id: userId,
      user_email: userEmail
    });
  }
}
