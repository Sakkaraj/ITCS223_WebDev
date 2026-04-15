const http = require('http');

const data = JSON.stringify({
  productName: "Debug Test",
  price: 1500,
  colorIds: [{ id: 1, index: 1 }, { id: 2, index: 2 }]
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/products/2', // Assuming ID 2 exists
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
    // Note: This might fail if requireAuth is on, but we can see the response
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
