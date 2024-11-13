import axios from 'axios';
import validator from 'amphtml-validator';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch the HTML content of the specified URL as a mobile device
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      },
    });
    const html = response.data;

    // Validate the HTML content with the AMP validator
    const ampValidator = await validator.getInstance();
    const validationResult = ampValidator.validateString(html);

    // Structure the response based on validation results
    const result = {
      isValid: validationResult.status === 'PASS',
      status: validationResult.status,
      errors: validationResult.errors.map((error) => ({
        message: error.message,
        severity: error.severity,
        line: error.line,
        col: error.col,
      })),
    };

    // Send the validation result back
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Error validating AMP URL',
      details: error.response ? error.response.data : error.message,
    });
  }
}
