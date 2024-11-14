import axios from 'axios';
import validator from 'amphtml-validator';

export default async function handler(req, res) {
  const { urls } = req.query;

  if (!urls) {
    return res.status(400).json({ error: 'URLs are required' });
  }

  // Split the incoming URLs by commas and trim each URL
  const urlList = urls.split(',').map(url => url.trim());
  const validationPromises = urlList.map((url, index) => validateUrl(url, index + 1));

  try {
    const results = await Promise.all(validationPromises);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({
      error: 'Error validating AMP URLs',
      details: error.message,  // Send only the error message, not the full HTML
    });
  }
}

// Helper function to validate a single URL
async function validateUrl(url, id) {
  try {
    // Fetch the HTML content of the specified URL as a mobile device
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      },
    });

    const html = response.data;

    // Check for the mandatory ⚡ (amp) attribute in the <html> tag
    if (!html.includes('<html ⚡>') && !html.includes('<html amp>')) {
      return {
        id,  // Add the id here
        url,
        isValid: false,
        status: 'NON-AMP',
        errors: [
          {
            message: "Missing '⚡' attribute in <html> tag",
            severity: 'ERROR',
            line: 4, // Example line number, can be dynamically calculated if needed
            col: 0,  // Column number where the <html> tag is found
          },
        ],
      };
    }

    // Validate the HTML content with the AMP validator
    const ampValidator = await validator.getInstance();
    const validationResult = ampValidator.validateString(html);

    // Structure the response based on validation results
    return {
      id,  // Add the id here
      url,
      isValid: validationResult.status === 'PASS',
      status: validationResult.status,
      errors: validationResult.errors.map((error) => ({
        message: error.message,
        severity: error.severity,
        line: error.line,
        col: error.col,
      })),
    };
  } catch (error) {
    // Catch other types of errors (e.g., network errors, invalid URL)
    if (error.response && error.response.status === 404) {
      return {
        id,  // Add the id here
        url,
        isValid: false,
        status: 'ERROR',
        errors: [
          {
            message: 'Page Not Found (404)',
            severity: 'ERROR',
          },
        ],
      };
    }

    // Handle other errors
    return {
      id,  // Add the id here
      url,
      isValid: false,
      status: 'ERROR',
      errors: [
        {
          message: error.response ? error.response.data : error.message,
          severity: 'ERROR',
        },
      ],
    };
  }
}
