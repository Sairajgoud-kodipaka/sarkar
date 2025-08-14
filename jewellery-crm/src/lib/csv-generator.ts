// CSV Generator for Sales Reports
// Used by Business Admin to download floor manager reports

export interface CSVRow {
  customer_name: string;
  product_purchased: string;
  price: number;
  salesperson: string;
  floor_manager: string;
  floor: number;
  stage: string;
  created_date: string;
}

export function generateSalesReportCSV(reportData: any[]): string {
  // CSV Headers
  const headers = [
    'Customer Name',
    'Product Purchased',
    'Price (₹)',
    'Salesperson',
    'Floor Manager',
    'Floor',
    'Stage',
    'Created Date'
  ];

  // Convert data to CSV rows
  const rows = reportData.map(item => [
    item.customer_name || 'N/A',
    item.products?.name || item.product_name || 'N/A',
    (item.amount || 0).toLocaleString(),
    item.team_members?.name || item.assigned_to_name || 'Unassigned',
    'Floor Manager', // This will be filled from the report metadata
    item.floor || 'N/A',
    item.stage || 'N/A',
    new Date(item.created_at).toLocaleDateString('en-IN')
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function formatReportFilename(floor: number, period: string, date: string): string {
  return `floor-${floor}-${period}-report-${date}.csv`;
}
