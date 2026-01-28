import express from 'express';
import cors from 'cors';
import https from 'https';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// CKEditor Cloud Services token endpoint
// This endpoint should authenticate users and return a token for CKEditor Cloud Services
// For production, implement proper authentication and get token from CKEditor Cloud Services API
// CKEditor makes GET requests to this endpoint
const handleTokenRequest = async (req, res) => {
  try {
    // DEVELOPMENT: token URL from env (set CKEDITOR_DEV_TOKEN_URL in .env)
    const tokenUrlString = process.env.CKEDITOR_DEV_TOKEN_URL;
    if (!tokenUrlString || tokenUrlString.trim() === '') {
      console.error('CKEDITOR_DEV_TOKEN_URL is not set in .env');
      return res.status(500).json({
        error: 'Token endpoint not configured',
        message: 'Set CKEDITOR_DEV_TOKEN_URL in your .env file. See .env.example.',
      });
    }

    console.log('Token request received');
    const tokenUrl = new URL(tokenUrlString);
    const options = {
      hostname: tokenUrl.hostname,
      path: tokenUrl.pathname + tokenUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'CKEditor-Collaboration-Server/1.0'
      }
    };

    // Use Node.js built-in https module to fetch token
    const tokenData = await new Promise((resolve, reject) => {
      const request = https.get(options, (tokenRes) => {
        let data = '';
        
        console.log('Response status:', tokenRes.statusCode);
        console.log('Response headers:', JSON.stringify(tokenRes.headers, null, 2));
        
        // Handle non-200 status codes
        if (tokenRes.statusCode !== 200) {
          tokenRes.on('data', (chunk) => { data += chunk.toString(); });
          tokenRes.on('end', () => {
            console.error('Non-200 response. Status:', tokenRes.statusCode);
            console.error('Response body:', data);
            reject(new Error(`CKEditor returned ${tokenRes.statusCode}: ${tokenRes.statusMessage}`));
          });
          return;
        }
        
        tokenRes.on('data', (chunk) => {
          data += chunk.toString();
        });
        
        tokenRes.on('end', () => {
          console.log('Response received, length:', data.length);
          console.log('Response preview:', data.substring(0, 200));
          
          if (!data || data.trim().length === 0) {
            reject(new Error('Empty response from CKEditor'));
            return;
          }
          
          // The development token URL returns a plain token string (JWT), not JSON
          // CKEditor expects the token endpoint to return the token as a plain string
          const token = data.trim();
          console.log('Token received successfully');
          resolve(token);
        });
      });
      
      request.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      
      request.setTimeout(20000, () => {
        console.error('Request timeout');
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log('Token fetched successfully, sending to client');
    // Set CORS headers
    // CKEditor expects the token endpoint to return the token as a plain text string
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Send token as plain text string (not JSON)
    res.send(tokenData);
    
    /* PRODUCTION IMPLEMENTATION:
     * 
     * For production, you should:
     * 1. Authenticate the user (verify session/auth token from req.headers)
     * 2. Generate a token using CKEditor Cloud Services API with your API secret
     * 3. Use the API base URL: https://secadm7b6x0h.cke-cs.com/api/v5/TxH1gUrBXkCrPAR8CNFc
     * 4. Sign the request using your API secret (store in environment variable!)
     * 
     * See CKEditor documentation for proper token generation:
     * https://ckeditor.com/docs/cs/latest/guides/security/token-endpoint.html
     */
  } catch (error) {
    console.error('=== TOKEN ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('==================');
    
    res.status(500).json({ 
      error: 'Failed to generate token',
      message: error.message
    });
  }
};

// Handle OPTIONS for CORS preflight
app.options('/cs-token', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Handle both GET and POST requests (CKEditor uses GET)
app.get('/cs-token', handleTokenRequest);
app.post('/cs-token', handleTokenRequest);

const PORT = process.env.PORT || 3001; // eslint-disable-line no-undef
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CKEditor token endpoint: http://localhost:${PORT}/cs-token`);
});
