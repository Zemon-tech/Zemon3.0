import { supabase } from '@/lib/supabase';

/**
 * Search across all content in the application
 * @param {string} query - The search query string
 * @param {number} limit - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} Array of search results
 */
export async function globalSearch(query, limit = 10) {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // Call the search_content function we created in the database
    const { data, error } = await supabase
      .rpc('search_content', { search_term: query })
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error during search:', error);
    return [];
  }
}

/**
 * Get a properly formatted icon based on content type
 * @param {string} type - The content type
 * @returns {string} Icon name for the content type
 */
export function getContentTypeIcon(type) {
  const iconMap = {
    // Resources
    'documentation': 'FileText',
    'tool': 'Wrench',
    'video': 'Video',
    'article': 'Newspaper',
    'tutorial': 'BookOpen',
    'spreadsheet': 'Table',
    'presentation': 'Presentation',
    'code_snippet': 'Code',
    
    // Other content types
    'task': 'CheckSquare',
    'event': 'Calendar',
    'chat': 'MessageSquare',
    'ai': 'Sparkles',
    'music': 'Music',
    'user': 'User',
    
    // Default
    'default': 'Search'
  };
  
  return iconMap[type] || iconMap.default;
}

/**
 * Format search results for display
 * @param {Array} results - Raw search results
 * @returns {Array} Formatted search results with additional UI properties
 */
export function formatSearchResults(results) {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
  return results.map(result => {
    // Extract a snippet from content if it exists
    const snippet = result.content 
      ? result.content.substring(0, 100) + (result.content.length > 100 ? '...' : '')
      : '';
      
    return {
      ...result,
      icon: getContentTypeIcon(result.type),
      snippet,
      // Generate a URL if one doesn't exist
      url: result.url || generateUrlFromType(result.type, result.source_id)
    };
  });
}

/**
 * Generate a URL for a search result based on its type
 * @param {string} type - Content type
 * @param {string} id - Content ID
 * @returns {string} Generated URL
 */
function generateUrlFromType(type, id) {
  switch (type) {
    case 'documentation':
    case 'article':
    case 'tutorial':
    case 'spreadsheet':
    case 'presentation':
    case 'code_snippet':
    case 'tool':
    case 'video':
      return `/resources/${id}`;
    case 'task':
      return `/tasks/${id}`;
    case 'event':
      return `/calendar/${id}`;
    case 'chat':
      return `/chat/${id}`;
    case 'ai':
      return `/ai/${id}`;
    case 'music':
      return `/music/${id}`;
    case 'user':
      return `/users/${id}`;
    default:
      return '/';
  }
} 