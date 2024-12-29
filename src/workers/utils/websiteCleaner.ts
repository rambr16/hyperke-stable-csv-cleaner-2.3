export function cleanWebsiteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    // Convert to lowercase and trim
    let domain = url.toLowerCase().trim();
    
    // Remove common protocols
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
    
    // Remove everything after the first slash
    domain = domain.split('/')[0];
    
    // Remove any parameters or fragments
    domain = domain.split('?')[0].split('#')[0];
    
    // Remove any port numbers
    domain = domain.split(':')[0];
    
    // Basic validation
    if (domain.includes('.') && domain.length > 3) {
      // Remove any leading/trailing dots
      domain = domain.replace(/^\.+|\.+$/g, '');
      return domain;
    }
    
    return null;
  } catch {
    return null;
  }
}