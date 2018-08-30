var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(1234, () => {
  console.log('listening on port 1234');
});

app.use(express.static(__dirname + '/public'));

var io = socket(server);
