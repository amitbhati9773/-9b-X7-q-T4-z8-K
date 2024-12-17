// var http = require('http');
// http.createServer(function (req, res) {
//   res.write("I'm alive");
//   res.end();
// }).listen(8080);


import http from 'http';

const server = http.createServer((req, res) => {
  res.write("I'm alive");
  res.end();
});

server.listen(8080);

export default server; // Add this line
