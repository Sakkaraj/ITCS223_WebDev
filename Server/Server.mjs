import { createServer } from "node:http";

const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type' : 'text/plain'});
    res.end('Hello World');
});

server.listen(8081, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:8081');
});