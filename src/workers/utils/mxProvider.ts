import { MXProviderConfig, MXProviderResult } from '../../types';

const MX_PROVIDERS: MXProviderConfig[] = [
  {
    name: 'google',
    patterns: ['google', 'gmail', 'googlemail', 'aspmx.l.google.com'],
    priority: 1
  },
  {
    name: 'microsoft',
    patterns: ['outlook', 'microsoft', 'hotmail', 'protection.outlook.com'],
    priority: 1
  },
  {
    name: 'amazon',
    patterns: ['amazonses', 'aws'],
    priority: 2
  },
  {
    name: 'proofpoint',
    patterns: ['pphosted', 'proofpoint'],
    priority: 2
  },
  {
    name: 'mimecast',
    patterns: ['mimecast'],
    priority: 2
  },
  {
    name: 'zoho',
    patterns: ['zoho'],
    priority: 3
  }
];

const cache = new Map<string, MXProviderResult>();

async function fetchMXRecords(domain: string): Promise<string[]> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=mx`);
    if (!response.ok) throw new Error('MX lookup failed');
    
    const data = await response.json();
    if (!data.Answer) return [];
    
    return data.Answer
      .map((record: any) => record.data.toLowerCase())
      .filter((mx: string) => mx.length > 0);
  } catch {
    return [];
  }
}

function detectProvider(mxRecords: string[]): MXProviderResult {
  if (!mxRecords.length) {
    return { provider: 'unknown', confidence: 0 };
  }

  const matches = new Map<string, number>();
  
  for (const record of mxRecords) {
    for (const config of MX_PROVIDERS) {
      if (config.patterns.some(pattern => record.includes(pattern))) {
        const score = matches.get(config.name) || 0;
        matches.set(config.name, score + config.priority);
      }
    }
  }

  if (matches.size === 0) {
    return { 
      provider: 'others',
      confidence: 0.5,
      mxRecords 
    };
  }

  // Find the provider with highest score
  let maxScore = 0;
  let bestProvider = '';
  
  matches.forEach((score, provider) => {
    if (score > maxScore) {
      maxScore = score;
      bestProvider = provider;
    }
  });

  return {
    provider: bestProvider,
    confidence: maxScore / (mxRecords.length * 2),
    mxRecords
  };
}

export async function checkMXProvider(domain: string): Promise<string> {
  try {
    // Check cache first
    if (cache.has(domain)) {
      return cache.get(domain)!.provider;
    }

    const mxRecords = await fetchMXRecords(domain);
    const result = detectProvider(mxRecords);
    
    // Cache the result
    cache.set(domain, result);
    
    return result.provider;
  } catch {
    return 'unknown';
  }
}

// Export for testing
export const __testing = {
  detectProvider,
  fetchMXRecords
};