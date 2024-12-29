import { cleanWebsiteUrl } from './websiteCleaner';

export function cleanCSVData(data: any[]): any[] {
  // Ensure these columns are always preserved
  const preservedColumns = [
    'email',
    'fullName',
    'firstName',
    'lastName',
    'title',
    'phone',
    'mxProvider',
    'other_dm_name',
    'website',
    'company',
    'department'
  ];

  return data.map(row => {
    const cleanRow: any = {};
    
    // Clean website URLs from various column names
    const websiteColumns = ['website', 'site', 'sites', 'domain', 'url', 'web'];
    let websiteFound = false;
    
    for (const col of websiteColumns) {
      if (row[col]) {
        const cleanedUrl = cleanWebsiteUrl(row[col]);
        if (cleanedUrl) {
          cleanRow.website = cleanedUrl;
          websiteFound = true;
          break;
        }
      }
    }

    // First, preserve our known good columns
    preservedColumns.forEach(col => {
      if (col !== 'website' || !websiteFound) { // Skip website if already processed
        if (row[col] !== undefined) {
          cleanRow[col] = row[col];
        }
      }
    });

    // Then add any other non-dummy columns with values
    Object.entries(row).forEach(([key, value]) => {
      if (
        !preservedColumns.includes(key) && // Skip already processed columns
        !websiteColumns.includes(key.toLowerCase()) && // Skip website columns
        !key.match(/_\d+$/) && // Skip columns ending with _1, _2, etc.
        !key.match(/^\d+$/) && // Skip columns that are just numbers
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        cleanRow[key] = value;
      }
    });

    return cleanRow;
  });
}