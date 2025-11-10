/**
 * Format report/appeal status for display
 * Converts database values (e.g., "in_progress") to display text (e.g., "In Progress")
 */
export function formatStatus(status: string): string {
  if (!status) return '';
  
  // Handle common status formats
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'dismissed': 'Dismissed',
    'approved': 'Approved',
    'denied': 'Denied',
    'rejected': 'Rejected',
    'active': 'Active',
    'archived': 'Archived',
  };
  
  // Check if we have a direct mapping
  if (statusMap[status.toLowerCase()]) {
    return statusMap[status.toLowerCase()];
  }
  
  // Fallback: convert snake_case or kebab-case to Title Case
  return status
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

