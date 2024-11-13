import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateAmp = async () => {
    setLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      const res = await fetch(`/api/amp-validate?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok) {
        setValidationResult(data);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to fetch AMP validation');
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>AMP Validation Tool</h1>
      <input
        type="text"
        placeholder="Enter URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={validateAmp} disabled={loading}>
        {loading ? 'Validating...' : 'Validate AMP'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {validationResult && (
        <div>
          <h2>Validation Result:</h2>
          <pre>{JSON.stringify(validationResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
