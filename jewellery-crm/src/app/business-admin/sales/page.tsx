'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Eye, 
  Download,
  Calendar,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { generateSalesReportCSV, downloadCSV, formatReportFilename } from '@/lib/csv-generator';

interface SalesReport {
  id: string;
  floor_manager_name: string;
  floor: number;
  period: string;
  start_date: string;
  end_date: string;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  notes?: string;
  report_data?: any[];
}

interface SalesSummary {
  total_revenue: number;
  total_leads: number;
  conversion_rate: number;
  pending_reports: number;
  approved_reports: number;
}

export default function BusinessAdminSalesPage() {
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    total_revenue: 0,
    total_leads: 0,
    conversion_rate: 0,
    pending_reports: 0,
    approved_reports: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchSalesData();
  }, [selectedFloor, dateFilter]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch real sales reports and summary
      const [reportsResponse, summaryResponse] = await Promise.all([
        apiService.getSalesReports({ 
          floor: selectedFloor, 
          dateFilter 
        }),
        apiService.getSalesSummary({ 
          floor: selectedFloor, 
          dateFilter 
        })
      ]);

      if (reportsResponse.success) {
        console.log('✅ Sales reports fetched successfully:', reportsResponse.data);
        setSalesReports(reportsResponse.data || []);
      } else {
        console.error('❌ Error fetching sales reports:', reportsResponse.message);
        setSalesReports([]);
      }

      if (summaryResponse.success) {
        console.log('✅ Sales summary fetched successfully:', summaryResponse.data);
        setSalesSummary(summaryResponse.data);
      } else {
        console.error('❌ Error fetching sales summary:', summaryResponse.message);
        // Fallback to calculated summary from reports
        const reports = reportsResponse.data || [];
        const fallbackSummary: SalesSummary = {
          total_revenue: reports.reduce((sum, report) => sum + report.total_revenue, 0),
          total_leads: reports.reduce((sum, report) => sum + report.total_leads, 0),
          conversion_rate: reports.length > 0 ? 
            (reports.reduce((sum, report) => sum + report.converted_leads, 0) / 
             reports.reduce((sum, report) => sum + report.total_leads, 0)) * 100 : 0,
          pending_reports: reports.filter(r => r.status === 'pending').length,
          approved_reports: reports.filter(r => r.status === 'approved').length
        };
        console.log('📊 Using fallback summary:', fallbackSummary);
        setSalesSummary(fallbackSummary);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Fallback to empty data
      setSalesReports([]);
      setSalesSummary({
        total_revenue: 0,
        total_leads: 0,
        conversion_rate: 0,
        pending_reports: 0,
        approved_reports: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report: SalesReport) => {
    // TODO: Implement detailed view modal
    console.log('Viewing details for report:', report);
    // You could open a modal here with detailed information
  };

  const handleDownloadReport = (report: SalesReport) => {
    try {
      if (!report.report_data || report.report_data.length === 0) {
        toast.error('No data available for download');
        return;
      }

      const csvContent = generateSalesReportCSV(report.report_data);
      const filename = formatReportFilename(report.floor, report.period, new Date().toISOString().split('T')[0]);
      downloadCSV(csvContent, filename);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleExport = async () => {
    try {
      // Export current filtered data
      const reports = await apiService.getSalesReports({ 
        floor: selectedFloor, 
        dateFilter 
      });
      
      if (reports.success && reports.data) {
        // Create CSV content
        const csvContent = [
          ['Manager', 'Floor', 'Period', 'Total Leads', 'Converted', 'Revenue', 'Status', 'Notes'],
          ...reports.data.map(report => [
            report.floor_manager_name,
            `Floor ${report.floor}`,
            `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`,
            report.total_leads.toString(),
            report.converted_leads.toString(),
            formatCurrency(report.total_revenue),
            report.status,
            report.notes || ''
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_reports_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading sales data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Review sales reports from floor managers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesSummary.total_revenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-blue-600">
                  {salesSummary.total_leads}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {salesSummary.conversion_rate.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-orange-600">
                  {salesSummary.pending_reports}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Reports</p>
                <p className="text-2xl font-bold text-green-600">
                  {salesSummary.approved_reports}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="1">Floor 1</SelectItem>
              <SelectItem value="2">Floor 2</SelectItem>
              <SelectItem value="3">Floor 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Reports</CardTitle>
          <CardDescription>
            Review weekly sales reports from floor managers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Floor {report.floor}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">
                      {report.floor_manager_name}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Period:</span>
                        <p className="capitalize">{report.period} ({formatDate(report.start_date)} - {formatDate(report.end_date)})</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Leads:</span>
                        <p className="font-medium">{report.total_leads}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Converted:</span>
                        <p className="font-medium">{report.converted_leads}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <p className="font-medium">{formatCurrency(report.total_revenue)}</p>
                      </div>
                    </div>
                    
                    {report.notes && (
                      <div className="mt-2">
                        <span className="text-gray-600">Notes:</span>
                        <p className="text-sm mt-1">{report.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(report)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadReport(report)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {salesReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales reports found for the selected criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
