import axios from 'axios';
import validator from 'amphtml-validator';
import pLimit from 'p-limit';

const MAX_CONCURRENT_REQUESTS = 5; // Limit the number of concurrent requests

export default async function handler(req, res) {
  const { urls } = req.query;

  if (!urls) {
    return res.status(400).json({ error: 'URLs are required' });
  }

  // Use regex to split URLs by their prefix ('http' or 'https')
  const urlList = urls.match(/https?:\/\/[^\s]+/g) || [];

  if (urlList.length === 0) {
    return res.status(400).json({ error: 'No valid URLs found' });
  }

  const limit = pLimit(MAX_CONCURRENT_REQUESTS);

  // Create validation promises with concurrency control
  const validationPromises = urlList.map((url, index) =>
    limit(() => validateUrl(url, index + 1))
  );

  try {
    const results = await Promise.all(validationPromises);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({
      error: 'Error validating AMP URLs',
      details: error.message,
    });
  }
}

// Helper function to validate a single URL
async function validateUrl(url, id) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      },
      timeout: 10000, // Timeout for each request
    });

    const html = response.data;

    // Check for the mandatory ⚡ (amp) attribute in the <html> tag
    if (!html.includes('<html ⚡>') && !html.includes('<html amp>')) {
      return {
        id,
        url,
        isValid: false,
        status: 'NON-AMP',
        errors: [
          {
            message: "Missing '⚡' attribute in <html> tag",
            severity: 'ERROR',
          },
        ],
      };
    }

    // Validate the HTML content with the AMP validator
    const ampValidator = await validator.getInstance();
    const validationResult = ampValidator.validateString(html);

    return {
      id,
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
    if (error.response && error.response.status === 404) {
      return {
        id,
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

    return {
      id,
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
