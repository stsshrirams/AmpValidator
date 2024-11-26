import { useState } from 'react';
import TagManager from 'react-gtm-module';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [validationResults, setValidationResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateUrls = async () => {
    setLoading(true);
    setError(null);
    setValidationResults([]);

    const urlList = urls.split(',').map(url => url.trim());

    try {
      const res = await fetch(`/api/amp-validate?urls=${encodeURIComponent(urlList.join(','))}`);
      const data = await res.json();

      if (res.ok) {
        setValidationResults(data);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to fetch AMP validation');
    }

    setLoading(false);
  };
  const tagManagerArgs = {
    gtmId: 'G-H4SEWQSGXM'
}
 
TagManager.initialize(tagManagerArgs)
  return (
    <div className='container py-5'>
      <h1>AMP Validation Tool</h1>
      <textarea
        placeholder="Enter URLs separated by commas or one by one"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={8}
        style={{ width: '100%' }}
        className='form-control'
      />
      <button className='btn btn-primary mt-4' onClick={validateUrls} disabled={loading}>
        {loading ? 'Validating...' : 'Validate AMP URLs'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {validationResults.length > 0 && (
        <div className='mt-3'>
          <h2>Validation Results:</h2>
          <table border="1" cellPadding="10" className='table table-bordered'>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>URL</th>
                <th>Status</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {validationResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.url}</td>
                  <td>{result.url}</td>
                  <td>{result.status}</td>
                  <td>
                    {result.errors.length > 0 ? (
                      <ul>
                        {result.errors.map((error, i) => (
                          <li key={i}>{error.message} (Line {error.line}, Col {error.col})</li>
                        ))}
                      </ul>
                    ) : (
                      <span>No Errors </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
