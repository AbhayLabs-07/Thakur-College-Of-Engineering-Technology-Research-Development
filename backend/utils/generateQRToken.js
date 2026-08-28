import QRCode from 'qrcode';

/**
 * Generates a base64 QR Code data URL from a text token
 * @param {string} token 
 * @returns {Promise<string>} Base64 Data URL
 */
export const generateQRDataURL = async (token) => {
  try {
    const dataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#0b2545', // TCET Deep Navy
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('QR Generation Error:', error);
    throw new Error('Failed to generate QR token');
  }
};
