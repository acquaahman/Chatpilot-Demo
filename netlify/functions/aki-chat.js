// ============================================================
//  Netlify Function: aki-chat.js
//  Location: netlify/functions/aki-chat.js
//
//  Securely proxies requests to the Anthropic Claude API
//  so the API key is never exposed in client-side code.
//
//  Environment variable to set in Netlify dashboard:
//    ANTHROPIC_API_KEY → your Anthropic API key
// ============================================================

exports.handler = async function (event) {

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { messages, system } = body;

  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, body: 'Missing messages array' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'API key not configured' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1000,
        system:     system || '',
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Anthropic API error' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
