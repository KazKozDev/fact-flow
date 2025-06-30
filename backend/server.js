const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to call the DuckDuckGo Python script
const searchDuckDuckGo = (query) => {
  return new Promise((resolve, reject) => {
    console.log(`Starting DuckDuckGo search for: "${query}"`);
    
    // Path to the Python script
    const pythonScript = path.join(__dirname, '..', 'parsing_duckduckgo.py');
    
    // Launch the Python script with arguments
    const pythonProcess = spawn('python3', [
      pythonScript, 
      query,
      '--json', '/tmp/duckduckgo_results.json',
      '--limit', '5',
      '--no-cache' // Disable cache for fresh results
    ]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script finished with code: ${code}`);
      
      if (code === 0) {
        try {
          // Read results from JSON file
          const fs = require('fs');
          const resultsPath = '/tmp/duckduckgo_results.json';
          
          if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            console.log(`Found ${results.length} results for "${query}"`);
            
            // Transform to the desired format
            const formattedResults = results.map(result => ({
              title: result.title || 'No Title',
              snippet: result.description || 'No Description',
              url: result.link || '#',
              source: 'duckduckgo'
            }));
            
            resolve(formattedResults);
            
            // Delete temporary file
            fs.unlinkSync(resultsPath);
          } else {
            // If file was not created, parse stdout
            console.log('JSON file not found, parsing stdout...');
            resolve(parsePlainTextResults(stdout));
          }
        } catch (error) {
          console.error('Error parsing results:', error);
          reject(new Error(`Failed to parse results: ${error.message}`));
        }
      } else {
        console.error('Python script error:', stderr);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    // Timeout to prevent hanging
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('DuckDuckGo search timeout'));
    }, 30000); // 30 seconds
  });
};

// Parsing results from plain text (fallback)
const parsePlainTextResults = (text) => {
  const results = [];
  const lines = text.split('\n');
  
  let currentResult = null;
  
  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      // New result
      if (currentResult) {
        results.push(currentResult);
      }
      currentResult = {
        title: line.replace(/^\d+\.\s*/, '').trim(),
        snippet: '',
        url: '',
        source: 'duckduckgo'
      };
    } else if (currentResult && line.trim().startsWith('http')) {
      currentResult.url = line.trim();
    } else if (currentResult && line.trim() && !line.includes('=')) {
      currentResult.snippet = line.trim();
    }
  }
  
  if (currentResult) {
    results.push(currentResult);
  }
  
  return results.slice(0, 5); // Limit to 5 results
};

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fact Checker Backend is running' });
});

// Search in DuckDuckGo
app.post('/api/search/duckduckgo', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a string' 
      });
    }
    
    console.log(`Received DuckDuckGo search request: "${query}"`);
    
    const results = await searchDuckDuckGo(query);
    
    res.json({
      success: true,
      query: query,
      results: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: req.body.query || 'unknown'
    });
  }
});

// Test endpoint for Python script
app.get('/api/test/python', (req, res) => {
  const pythonProcess = spawn('python3', ['--version']);
  
  let output = '';
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  pythonProcess.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    res.json({
      pythonVersion: output.trim(),
      exitCode: code,
      scriptPath: path.join(__dirname, '..', 'parsing_duckduckgo.py'),
      scriptExists: require('fs').existsSync(path.join(__dirname, '..', 'parsing_duckduckgo.py'))
    });
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/search/duckduckgo',
      'GET /api/test/python'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Fact Checker Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 DuckDuckGo API: http://localhost:${PORT}/api/search/duckduckgo`);
});
