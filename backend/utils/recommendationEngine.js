const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'from', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'of', 'up', 'down',
  'this', 'that', 'these', 'those', 'am', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'using', 'based', 'system', 'project',
  'design', 'development', 'implementation', 'controlled', 'monitoring', 'smart', 'iot'
]);

/**
 * Extracts unique keywords from text strings
 * @param {...string} texts 
 * @returns {string[]} keywords
 */
export const extractKeywords = (...texts) => {
  const words = texts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // remove special chars except hyphens and alphanumeric
    .split(/\s+/);
    
  const keywords = new Set();
  for (const word of words) {
    if (word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
      keywords.add(word);
    }
  }
  
  return Array.from(keywords);
};

/**
 * Matches extracted project keywords against component keywords
 * @param {string[]} projectKeywords 
 * @param {any[]} components 
 * @returns {any[]} matched components with scores
 */
export const getRecommendedComponents = (projectKeywords, components) => {
  if (!projectKeywords || projectKeywords.length === 0) {
    // If no keywords, return components from popular categories as fallback
    return components.slice(0, 6);
  }

  const scoredComponents = components.map(component => {
    let score = 0;
    const componentKeywords = component.keywords || [];
    
    // Check direct match
    for (const pKey of projectKeywords) {
      for (const cKey of componentKeywords) {
        if (cKey.toLowerCase() === pKey.toLowerCase()) {
          score += 3; // direct match higher weight
        } else if (cKey.toLowerCase().includes(pKey.toLowerCase()) || pKey.toLowerCase().includes(cKey.toLowerCase())) {
          score += 1; // partial match lower weight
        }
      }
      // Also match component name or description
      if (component.name.toLowerCase().includes(pKey)) {
        score += 2;
      }
      if (component.description && component.description.toLowerCase().includes(pKey)) {
        score += 1;
      }
    }
    
    return { component, score };
  });

  // Filter out components with 0 score, sort by score descending, and return component sub-objects
  return scoredComponents
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.component);
};
