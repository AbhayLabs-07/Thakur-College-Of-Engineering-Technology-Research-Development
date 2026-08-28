import { Parser } from 'json2csv';

/**
 * Converts JSON data to CSV string
 * @param {any[]} data 
 * @param {string[]} fields 
 * @returns {string} CSV string
 */
export const convertToCSV = (data, fields) => {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    console.error('CSV Conversion Error:', error);
    throw new Error('Failed to generate CSV export');
  }
};
