const http = require('http');

http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const prod = json.products.find(p => p.ProductName === 'Grey Comfort Sofa');
    console.log(JSON.stringify(prod, null, 2));
  });
});
