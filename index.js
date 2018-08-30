const express = require('express');
const socket = require('socket.io');

const app = express();
const server = app.listen(1234, () => {
  console.log('listening on port 1234');
});

app.use(express.static(__dirname + '/public'));

const io = socket(server);

const XTILES = 16;
const YTILES = 16;
let players = new Array();
let ids = [];
const DEFAULT_SPAWN_PLACES = [
  [1, 1],
  [1, YTILES - 2],
  [XTILES - 2, 1],
  [XTILES - 2, YTILES - 2]
];
let state = 'LOBBY';

io.on('connection', con => {
  ids.push(con.id);
  console.log(con.id, 'CONNECTED');

  io.to(con.id).emit('acceptCon', con.id);
  con.on('disconnecting', data => {
    sendToAllExcept(con.id, 'playerLeft', con.id);
    ids = ids.filter(id => id !== con.id);
    let newPlayersArray = [];
    for (let i = 0; i < ids.length; i++) {
      newPlayersArray[ids[i]] = players[ids[i]];
    }
    players = newPlayersArray;
    console.log(con.id, 'DISCONNECTED', data);
  });

  con.on('ackAcceptCon', data => {
    for (let i = 0; i < ids.length; i++) {
      if (players[ids[i]] !== undefined) {
        io.to(con.id).emit('newPlayer', {
          id: ids[i],
          payload: players[ids[i]]
        });
      }
    }
    players[con.id] = data;
    players[con.id].connected = true;
    players[con.id].id = con.id;
    sendToAllExcept(con.id, 'newPlayer', {
      id: con.id,
      payload: players[con.id]
    });
  });

  con.on('charChange', data => {
    if (players[con.id] !== undefined) {
      players[con.id].char = data;
      sendToAllExcept(con.id, 'charChanged', { id: con.id, payload: data });
    }
  });

  con.on('nameChange', data => {
    if (players[con.id] !== undefined) {
      players[con.id].name = data;
      sendToAllExcept(con.id, 'nameChanged', { id: con.id, payload: data });
    }
  });

  con.on('changeState', data => {
    if (players[con.id] !== undefined) {
      players[con.id].state = data;
      console.log('STATE CHANGE', con.id, data);
      sendToAllExcept(con.id, 'changeStated', { id: con.id, payload: data });
    }
  });

  con.on('changeBlock', data => {
    sendToAllExcept(con.id, 'changedBlock', data);
  });

  con.on('readyChange', data => {
    if (players[con.id] !== undefined) {
      players[con.id].ready = data;
      sendToAllExcept(con.id, 'readyChanged', { id: con.id, payload: data });
      let count = 0;
      for (let i = 0; i < ids.length; i++) {
        if (players[ids[i]].ready) {
          count++;
        }
      }
      console.log(ids.length, count);
      if (count === ids.length) {
        let map = [];
        let row = null;
        for (let y = 0; y < YTILES; y++) {
          row = [];
          for (let x = 0; x < XTILES; x++) {
            if (
              x === 0 ||
              x === XTILES - 1 ||
              y === 0 ||
              y === YTILES - 1 ||
              (x % 3 === 0 && y % 3 === 0)
            ) {
              row.push(1);
            } else {
              if (Math.random() * 2 > 1) {
                row.push(2);
              } else {
                row.push(0);
              }
            }
          }
          map.push(row);
        }
        let count = 0;
        while (count < ids.length && count < DEFAULT_SPAWN_PLACES.length) {
          map[DEFAULT_SPAWN_PLACES[count][0]][
            DEFAULT_SPAWN_PLACES[count][1]
          ] = 0;
          io.to(ids[count]).emit('startPos', {
            x: DEFAULT_SPAWN_PLACES[count][0],
            y: DEFAULT_SPAWN_PLACES[count][1]
          });
          sendToAllExcept(ids[count], 'movedToBlock', {
            x: DEFAULT_SPAWN_PLACES[count][0],
            y: DEFAULT_SPAWN_PLACES[count][1],
            id: ids[count]
          });
          count++;
        }
        io.sockets.emit('startGame', map);
        console.log('START GAME!');
      }
    }
  });
});

function sendToAllExcept(id, req, data) {
  for (let i = 0; i < ids.length; i++) {
    if (players[ids[i]] !== undefined) {
      if (players[ids[i]].connected === true && players[ids[i]].id !== id) {
        io.to(ids[i]).emit(req, data);
      }
    }
  }
}
