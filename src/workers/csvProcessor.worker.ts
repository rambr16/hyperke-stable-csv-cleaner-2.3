import { checkMXProvider } from './utils/mxProvider';
import { processEmailColumns } from './utils/emailProcessor';
import { assignAlternateContacts } from './utils/domainGrouping';
import { cleanCSVData } from './utils/csvCleaner';

async function processData(data: any[]): Promise<any[]> {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid CSV data');
  }

  try {
    self.postMessage({ type: 'progress', progress: 10, stage: 'Analyzing CSV structure...' });
    
    // Check if we have email columns
    const hasEmail = data.some(row => 
      row.email || 
      row.email_1 || 
      Object.keys(row).some(key => key.toLowerCase().includes('email'))
    );

    let processedData = hasEmail
      ? (data[0].email_1 ? data.flatMap(processEmailColumns) : data)
      : data;

    self.postMessage({ type: 'progress', progress: 30, stage: 'Cleaning data...' });
    processedData = cleanCSVData(processedData);

    self.postMessage({ type: 'progress', progress: 40, stage: 'Removing duplicates...' });
    
    // Remove duplicates based on website if no email
    const uniqueKeys = new Set();
    processedData = processedData.filter(row => {
      const key = row.email?.toLowerCase().trim() || row.website?.toLowerCase().trim();
      if (!key) return false;
      if (uniqueKeys.has(key)) return false;
      uniqueKeys.add(key);
      return true;
    });

    // Only process MX records if we have emails
    if (hasEmail) {
      self.postMessage({ type: 'progress', progress: 50, stage: 'Processing MX records...' });
      
      const batchSize = 10;
      const domainCache = new Map();
      
      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async row => {
          if (!row.email) return;
          const domain = row.email.split('@')[1];
          if (!domainCache.has(domain)) {
            domainCache.set(domain, await checkMXProvider(domain));
          }
          row.mxProvider = domainCache.get(domain);
        }));
        
        const progress = 50 + (i / processedData.length) * 40;
        self.postMessage({ 
          type: 'progress',
          progress,
          stage: `Processing MX records (${i + batch.length}/${processedData.length})...`
        });
      }

      self.postMessage({ type: 'progress', progress: 90, stage: 'Assigning alternate contacts...' });
      assignAlternateContacts(processedData);
    }

    // Final cleanup
    processedData = cleanCSVData(processedData);

    return processedData;
  } catch (error) {
    throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

self.onmessage = async (e) => {
  try {
    const result = await processData(e.data);
    self.postMessage({
      type: 'complete',
      data: result
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};