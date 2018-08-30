// const server = io.connect('http://localhost:1234');
const server = io.connect('http://178.128.45.249:1234');

const canv = document.getElementById('canv');
const ctx = canv.getContext('2d');
const img = document.createElement('img');
img.src = 'imgs/tiles.png';

const h = window.innerHeight;
const w = Math.min(window.innerHeight, 1200);
const TWOPI = 2 * Math.PI;

// game vars
const FPS = 60;
const NUM_CHARACTERS = 4;
const DEFAULT_BOMBSIZE = 2;
const DEFAULT_MAXBOMBS = 1;
const DEAFULT_SPEED = 0.15;
const DEFAULT_BOMB_LIFESPAN = 3;
const DEFAULT_EXPLOSION_LIFESPAN = 1.5;
const DEFAULT_MOVE_DURATION = FPS / 3;

// server vars
let id = null;
let otherIds = [];
let otherPlayers = new Array();

canv.height = h;
canv.width = w;
let mobile = false;
if (window.innerWidth < window.innerHeight) {
  mobile = true;
  canv.width = Math.min(window.innerHeight, 1200);
} else {
  document.getElementById('mobilectrls').style.display = 'none';
}

// interface
let moving = [false, false, false, false];
let bombing = false;
let state = 'LOBBY';
let ready = false;
let selecting = [0, null];
let pressed = false;

// map vars
const defaultMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
let gameMap = null;
const TILESIZE = 20;
const XTILES = 16;
const YTILES = 16;
const scale = Math.min(h, w) / (XTILES * TILESIZE);
let bombs = [];
let explosions = [];
let powerups = [];

// player vars
let playerx = null;
let playery = null;
let char = null;
let placingBombs = false;
let maxBombs = DEFAULT_MAXBOMBS;
let bombSize = DEFAULT_BOMBSIZE;
let moveDuration = DEFAULT_MOVE_DURATION;
let nextMove = null;
let moveTemp = null;
let alive = true;
let lastMove = 0;
let name = 'Player ' + Math.floor(Math.random() * 100);
let score = 0;

ctx.fillStyle = 'grey';
ctx.fillRect(0, 0, w, h);

let ticker = 0;
let timer = null;

function reloadGame() {
  // reset interface
  moving = [false, false, false, false];
  bombing = false;

  // reset map vars
  gameMap = defaultMap;
  bombs = [];
  explosions = [];
  powerups = [];
  fades = [];

  // reset player vars
  playerx = 2;
  playery = YTILES - 2;
  char = 1;
  placingBombs = false;
  maxBombs = DEFAULT_MAXBOMBS;
  bombSize = DEFAULT_BOMBSIZE;
  moveDuration = DEFAULT_MOVE_DURATION;
  alive = true;
  lastMove = 0;

  // map randomisation
  // for (
  //   let x = Math.round(Math.random() * 2);
  //   x < XTILES;
  //   x += Math.round(Math.random() * 2)
  // ) {
  //   for (
  //     let y = Math.round(Math.random() * 2);
  //     y < YTILES;
  //     y += Math.round(Math.random() * 2)
  //   ) {
  //     if (
  //       gameMap[y][x] === 0 &&
  //       !(playerx === Math.floor(y) && playery === Math.floor(x))
  //     ) {
  //       gameMap[y][x] = 2;
  //     }
  //   }
  // }

  ctx.font = '16px calibri';
  ctx.fillStyle = 'black';
  ctx.fillText('Game loaded, connecting to server.', 20, 35);
  ctx.fillText(
    'Game will start automatically when connection has been confirmed.',
    50,
    50
  );
  ticker = 0;
  stopTimer();
  timer = setInterval(() => {
    ctx.fillStyle = `rgba(${(128 * ticker) / 20},${(200 * ticker) / 20},128,1)`;
    ctx.fillRect(250 + ticker * 5, 27, 4, 8);
    ticker++;
    ticker = ticker % 20;
    if (ticker === 0) {
      ctx.fillStyle = 'grey';
      ctx.clearRect(250, 27, 100, 8);
    }
  }, 200);
}

function drawCircle(x, y, r = 5, stroke = 'grey', lw = 4, fill = 'black') {
  if (stroke !== null || fill !== null) {
    if (stroke !== null) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
    }
    if (fill !== null) ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWOPI);
    ctx.closePath();
    if (stroke !== null) ctx.stroke();
    if (fill !== null) ctx.fill();
  }
}

function drawBlock(blockx, blocky, xdisp, ydisp, w, h) {
  ctx.drawImage(
    img,
    blockx * 64 + 1,
    blocky * 64 + 1,
    62,
    62,
    xdisp,
    ydisp,
    w,
    h
  );
}

function addBomb(x, y) {
  if (bombs.length < maxBombs && gameMap[y][x] === 0) {
    bombs.push([x, y, bombSize, DEFAULT_BOMB_LIFESPAN * FPS]);
    changeBlock(x, y, 3);
  }
}

function explodeBomb(i) {
  let count = 0;
  let x = bombs[i][0];
  let y = bombs[i][1];
  let size = bombs[i][2];
  bombs.splice(i, 1);
  addExplosion(x, y, 0);
  let flags = [false, false, false, false];
  while (count < size) {
    if (!flags[0]) {
      if (canPlaceExplosion(x - count, y)) {
        addExplosion(x - count, y, 2, count);
        if (gameMap[y][x - count] === 2) {
          flags[0] = true;
        } else {
        }
      } else {
        flags[0] = true;
      }
    }
    if (!flags[1]) {
      if (canPlaceExplosion(x, y - count)) {
        addExplosion(x, y - count, 1, count);
        if (gameMap[y - count][x] === 2) {
          flags[1] = true;
        } else {
        }
      } else {
        flags[1] = true;
      }
    }
    if (!flags[2]) {
      if (canPlaceExplosion(x + count, y)) {
        addExplosion(x + count, y, 2, count);
        if (gameMap[y][x + count] === 2) {
          flags[2] = true;
        } else {
        }
      } else {
        flags[2] = true;
      }
    }
    if (!flags[3]) {
      if (canPlaceExplosion(x, y + count)) {
        addExplosion(x, y + count, 1, count);
        if (gameMap[y + count][x] === 2) {
          flags[3] = true;
        } else {
        }
      } else {
        flags[3] = true;
      }
    }
    count++;
  }
}

function canPlaceExplosion(x, y) {
  switch (gameMap[y][x]) {
    case 0:
    case 2:
    case 3:
    case 4:
    case 5:
      return true;
    case 1:
    case 6:
      return false;
  }
}

function canMoveHere(x, y) {
  switch (gameMap[y][x]) {
    case 0:
    case 4:
    case 5:
      return true;
    case 1:
    case 2:
    case 3:
    case 5:
    case 6:
      return false;
  }
}

function maybeDropPowerup(x, y) {
  switch (gameMap[y][x]) {
    case 2:
      return true;
    default:
      return false;
  }
}

function addExplosion(x, y, type, dir = null) {
  for (let i = 0; i < explosions.length; i++) {
    if (explosions[i][0] === x && explosions[i][1] === y) {
      if (
        testExplosion(x - 1, y) &&
        testExplosion(x + 1, y) &&
        testExplosion(x, y - 1) &&
        testExplosion(x, y + 1)
      ) {
        explosions[i][2] = 0;
      }
      return;
    }
  }
  if (dir !== null) {
    setTimeout(() => {
      addExplosion(x, y, type, null);
    }, 100 * dir);
  } else {
    let finalType = type;
    if (
      testExplosion(x - 1, y) &&
      testExplosion(x + 1, y) &&
      testExplosion(x, y - 1) &&
      testExplosion(x, y + 1)
    ) {
      finalType = 0;
    }
    explosions.push([x, y, finalType, DEFAULT_EXPLOSION_LIFESPAN * FPS]);
    if (maybeDropPowerup(x, y)) {
      changeBlock(x, y, finalType === 1 ? 6 : 7);
    } else {
      changeBlock(x, y, 4); // bomb is 3 explxosion is 4
    }
    for (let i = 0; i < bombs.length; i++) {
      if (bombs[i][0] === x && bombs[i][1] === y) {
        explodeBomb(i);
      }
    }
    for (let i = 0; i < powerups.length; i++) {
      if (powerups[i][0] === x && powerups[i][1] === y) {
        powerups.splice(i, 1);
      }
    }
  }
}

function testExplosion(x, y) {
  switch (gameMap[y][x]) {
    case 0:
      return false;
    default:
      return true;
  }
}

function removeExplosion(i, x, y) {
  explosions.splice(i, 1);
  if (gameMap[y][x] === 6 || gameMap[y][x] === 7) {
    addPowerup(x, y);
  } else {
    changeBlock(x, y, 0);
  }
}

function addPowerup(x, y) {
  if (ticker % 2 === 0) {
    powerups.push([x, y, Math.floor(Math.random() * 3)]);
    changeBlock(x, y, 5);
  } else {
    changeBlock(x, y, 0);
  }
}

function takePowerup(i) {
  for (let x = -0.5; x < 0.5; x += Math.random() * 0.5) {
    for (let y = -0.5; y < 0.5; y += Math.random() * 0.5) {
      fades.push([
        powerups[i][0] + x,
        powerups[i][1] + y,
        Math.random() * 4,
        128 + Math.random() * 128,
        128 + Math.random() * 128,
        128 + Math.random() * 128,
        Math.random() * DEFAULT_EXPLOSION_LIFESPAN * FPS
      ]);
    }
  }
  switch (powerups[i][2]) {
    case 0:
      maxBombs++;
      break;
    case 1:
      bombSize++;
      break;
    case 2:
      if (moveDuration > 6) moveDuration /= 1.2;
      break;
    case 3:
      moveDuration *= 1.2;
      break;
  }
  changeBlock(powerups[i][0], powerups[i][1], 0);
  powerups.splice(i, 1);
}

function changeBlock(x, y, val) {
  gameMap[y][x] = val;
  server.emit('changeBlock', { x, y, val });
}

function collisionCheck(x, y) {
  switch (gameMap[Math.floor(y)][Math.floor(x)]) {
    case 0:
    case 4:
    case 5:
      return true;
    default:
      return false;
  }
}

function fillInfo() {
  ctx.font = '' + 8 * scale + 'px calibri';
  ctx.fillStyle = alive ? 'blue' : 'red';
  ctx.fillText(alive ? 'alive' : 'dead', 0, 8 * scale);
  ctx.font = '' + 4 * scale + 'px calibri';
  ctx.fillStyle = 'black';
  ctx.fillText(`x: ${playerx} y: ${playery}`, XTILES * TILESIZE, 4 * scale);
  ctx.fillText(
    `moveDuration: ${moveDuration} maxBombs: ${maxBombs} bombSize: ${bombSize}`,
    XTILES * TILESIZE,
    12 * scale
  );
  ctx.fillText(
    moveTemp === null
      ? 'moveTemp: null'
      : `moveTemp: ${moveTemp[0]} ${moveTemp[1]} ${moveTemp[2]}`,
    XTILES * TILESIZE,
    16 * scale
  );
  // for (let i = 0; i < bombs.length; i++) {
  //   drawBlock(
  //     0 +
  //       Math.floor(
  //         (3 / DEFAULT_BOMB_LIFESPAN) *
  //           (DEFAULT_BOMB_LIFESPAN - bombs[i][3] / FPS)
  //       ),
  //     1,
  //     5 * scale + XTILES * TILESIZE,
  //     4 * scale + i * 4 * scale,
  //     4 * scale,
  //     4 * scale
  //   );
  //   ctx.fillText(
  //     `x:${bombs[i][0]} y:${bombs[i][1]} type:${bombs[i][2]} life:${
  //       bombs[i][3]
  //     }`,
  //     10 * scale + XTILES * TILESIZE,
  //     15 + i * 4 * scale
  //   );
  // }
  // for (let i = 0; i < explosions.length; i++) {
  //   drawBlock(
  //     explosions[i][2],
  //     2,
  //     46 * scale + XTILES * TILESIZE,
  //     4 * scale + i * 4 * scale,
  //     4 * scale,
  //     4 * scale
  //   );
  //   ctx.fillText(
  //     `expl: x:${explosions[i][0]} y:${explosions[i][1]}  type:${
  //       explosions[i][2]
  //     } life:${explosions[i][3]} expl? ${canPlaceExplosion(
  //       explosions[i][0],
  //       explosions[i][1]
  //     )}`,
  //     XTILES * TILESIZE + 52 * scale,
  //     15 + i * 4 * scale
  //   );
}

function lobbyInfo() {
  let options = ['select character>', 'change name>', '>ready!'];
  selecting[0] = (selecting[0] + options.length) % options.length;
  if (pressed && selecting[1] === null) {
    selecting[1] = 0;
    pressed = false;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, canv.width, canv.height);
  ctx.fillStyle = 'white';
  ctx.font = '20px calibri';
  ctx.fillText('NOMBERNAN FFA', TILESIZE, 2 * TILESIZE);
  for (let i = 0; i < options.length; i++) {
    ctx.fillStyle =
      ready && i === options.length - 1
        ? 'lime'
        : selecting[0] === i
          ? selecting[1] === null
            ? 'yellow'
            : 'grey'
          : 'white';
    ctx.font = '12px calibri';
    ctx.fillText(options[i], TILESIZE + TILESIZE / 2, (i / 2 + 3) * TILESIZE);
  }
  drawPlayerCards();
  if (selecting[1] !== null) {
    drawSubOptions(selecting);
    switch (selecting[0]) {
      case 0:
        selecting[1] = (selecting[1] + NUM_CHARACTERS) % NUM_CHARACTERS;
        if (pressed) {
          {
            char = selecting[1];
            selecting[1] = null;
            ticker = 0;
            pressed = false;
            server.emit('charChange', char);
          }
        }
        break;
      case options.length - 1:
        if (selecting[1] !== null && !ready) {
          ready = true;
          server.emit('readyChange', ready);
        }
        if (pressed) {
          selecting[1] = null;
        }
        break;
    }
  }
}

function drawSubOptions(selectedOpts) {
  switch (selectedOpts[0]) {
    case 0: // select character
      for (let i = 0; i < NUM_CHARACTERS; i++) {
        if (i === char) {
          drawCircle(
            (6 + i * 1.5) * TILESIZE + (TILESIZE * 1.5) / 2,
            (2 + i / 2) * TILESIZE + (TILESIZE * 1.5) / 2,
            (TILESIZE * 1.5) / 2 + 3,
            'rgba(128,255,128,0.5)',
            4,
            null
          );
          drawCircle(
            (6 + i * 1.5) * TILESIZE + (TILESIZE * 1.5) / 2,
            (2 + i / 2) * TILESIZE + (TILESIZE * 1.5) / 2,
            (TILESIZE * 1.5) / 2,
            'white',
            2,
            'rgba(0,0,0,0.6)'
          );
        }
        drawBlock(
          i === selectedOpts[1]
            ? Math.round(((ticker / FPS) * 2) % 1)
            : char === i
              ? 8 + Math.round((ticker / FPS) % 1)
              : Math.round(((ticker / FPS) * 2) % 1),

          11 - i,
          (6 + i * 1.5) * TILESIZE,
          (2 + i / 2) * TILESIZE,
          TILESIZE * 1.5,
          TILESIZE * 1.5
        );
      }
      drawCircle(
        (6 + selectedOpts[1] * 1.5) * TILESIZE + (TILESIZE * 1.5) / 2,
        (2 + selectedOpts[1] / 2) * TILESIZE + (TILESIZE * 1.5) / 2,
        (TILESIZE * 1.5) / 2 + 2,
        'yellow',
        2,
        'rgba(255,255,255,0.6)'
      );
      drawCircle(
        (6 + selectedOpts[1] * 1.5) * TILESIZE + (TILESIZE * 1.5) / 2,
        (2 + selectedOpts[1] / 2) * TILESIZE + (TILESIZE * 1.5) / 2,
        (TILESIZE * 1.5) / 2 + 3,
        'grey',
        1,
        null
      );
      drawBlock(
        Math.round(((ticker / FPS) * 2) % 1),
        11 - selectedOpts[1],
        (6 + selectedOpts[1] * 1.5) * TILESIZE,
        (2 + selectedOpts[1] / 2) * TILESIZE,
        TILESIZE * 1.5,
        TILESIZE * 1.5
      );
      break;
    case 1:
      let newName = prompt('Please enter your new name.!', name);
      if (newName !== null) {
        name = newName;
        server.emit('nameChange', name);
      }
      selecting[1] = null;
      pressed = false;
      break;
    default:
      break;
  }
}

function drawPlayerCards() {
  drawPlayerCard(2, 5, char, name, score, ready, state);
  for (let i = 0; i < otherIds.length; i++) {
    drawPlayerCard(
      2,
      5 + i + 1,
      otherPlayers[otherIds[i]].char,
      otherPlayers[otherIds[i]].name,
      otherPlayers[otherIds[i]].score,
      otherPlayers[otherIds[i]].ready,
      otherPlayers[otherIds[i]].state
    );
  }
}

function drawPlayerCard(xStart, yStart, char, name, score, ready, state) {
  ctx.fillStyle =
    state === 'LOBBY'
      ? ready
        ? 'rgba(128,255,128,0.5)'
        : 'rgba(255,255,255,0.5)'
      : 'rgba(128,128,210,0.6)';
  ctx.fillRect(xStart * TILESIZE, yStart * TILESIZE, TILESIZE * 6, TILESIZE);
  drawBlock(
    0 + (Math.round(ticker / FPS) % 8),
    11 - char,
    xStart * TILESIZE,
    yStart * TILESIZE,
    TILESIZE,
    TILESIZE
  );
  ctx.fillStyle = 'white';
  ctx.font = '20px roman';
  ctx.fillText(
    name,
    (xStart + 1) * TILESIZE,
    (yStart + 0.9) * TILESIZE,
    TILESIZE * 5
  );
  ctx.fillStyle = 'rgba(128,128,255,0.5)';
  ctx.fillRect(
    (xStart + 6.5) * TILESIZE,
    yStart * TILESIZE,
    TILESIZE * 2,
    TILESIZE
  );
  ctx.fillStyle = 'white';
  ctx.fillText(
    score,
    (xStart + 6.5) * TILESIZE,
    (yStart + 0.9) * TILESIZE,
    TILESIZE * 2
  );
  ctx.font = '8px calibri';
  ctx.fillStyle = 'lime';
  ctx.fillText(
    state,
    (xStart + 4) * TILESIZE,
    (yStart + 0.3) * TILESIZE,
    TILESIZE * 2
  );
}

function movePlayer(x, y) {
  nextMove = [x - playerx, y - playery];
}

const startTimer = () => {
  if (timer === null) {
    console.log('starting timer FPS:', FPS);
    timer = setInterval(() => {
      offset = Math.sin(ticker / (moveDuration / DEFAULT_BOMB_LIFESPAN));
      offset2 = Math.sin(ticker / (FPS / 6));
      offset3 = Math.sin(
        ticker / (DEFAULT_MOVE_DURATION / DEFAULT_BOMB_LIFESPAN)
      );

      // draw
      ctx.clearRect(0, 0, w, h);
      ctx.scale(scale, scale);
      // map
      for (let i = 0; i < XTILES; i++) {
        for (let j = 0; j < YTILES; j++) {
          drawBlock(
            gameMap[j][i],
            0,
            i * TILESIZE,
            j * TILESIZE,
            TILESIZE,
            TILESIZE
          );
        }
      }
      // bombs
      for (let i = 0; i < bombs.length; i++) {
        drawBlock(
          2 + Math.round(2 * offset3),
          1,
          bombs[i][0] * TILESIZE + bombs[i][3] / FPS,
          bombs[i][1] * TILESIZE + bombs[i][3] / FPS,
          TILESIZE - (2 * bombs[i][3]) / FPS,
          TILESIZE - (2 * bombs[i][3]) / FPS
        );
      }
      // explosions
      for (let i = 0; i < explosions.length; i++) {
        drawBlock(
          0 + explosions[i][2],
          2,
          explosions[i][0] * TILESIZE,
          explosions[i][1] * TILESIZE,
          TILESIZE,
          TILESIZE
        );
      }
      // powerups
      for (let i = 0; i < powerups.length; i++) {
        drawBlock(
          0 + powerups[i][2],
          4,
          powerups[i][0] * TILESIZE + offset2 / 2,
          powerups[i][1] * TILESIZE + offset2 / 2,
          TILESIZE - offset2,
          TILESIZE - offset2
        );
      }
      // fades
      for (let i = 0; i < fades.length; i++) {
        drawCircle(
          fades[i][0] * TILESIZE + TILESIZE / 2,
          fades[i][1] * TILESIZE + TILESIZE / 2,
          fades[i][2],
          null,
          null,
          `rgba(${fades[i][3]},${fades[i][4]},${fades[i][5]},${fades[i][6] /
            FPS})`
        );
      }

      // beginning invulnv.
      if (ticker < FPS * 10) {
        ctx.beginPath();
        drawCircle(
          playerx * TILESIZE + (2 * TILESIZE) / 5,
          playery * TILESIZE,
          TILESIZE,
          `rgba(255,${128 + offset * 128},${128 + offset * 128},${(ticker /
            FPS) *
            10})`,
          0.8,
          'rgba(255,255,255,0.3)'
        );
        ctx.closePath();
      }
      // player
      if (moveTemp !== null) {
        if (moveTemp[0] > 0) {
          lastMove = 2 + Math.abs(Math.round(offset));
        } else if (moveTemp[0] < 0) {
          lastMove = 4 + Math.abs(Math.round(offset));
        } else {
          if (moveTemp[1] < 0) {
            lastMove = 6 + Math.abs(Math.round(offset));
          } else if (moveTemp[1] > 0) {
            lastMove = 8 + Math.abs(Math.round(offset));
          } else {
            lastMove = 0 + Math.abs(Math.round(offset));
          }
        }
      }

      // other players
      for (let i = 0; i < otherIds.length; i++) {
        if (otherPlayers[otherIds[i]].moveTemp !== null) {
          if (otherPlayers[otherIds[i]].moveTemp[0] > 0) {
            otherPlayers[otherIds[i]].lastMove =
              2 + Math.abs(Math.round(offset));
          } else if (otherPlayers[otherIds[i]].moveTemp[0] < 0) {
            otherPlayers[otherIds[i]].lastMove =
              4 + Math.abs(Math.round(offset));
          } else {
            if (otherPlayers[otherIds[i]].moveTemp[1] < 0) {
              otherPlayers[otherIds[i]].lastMove =
                6 + Math.abs(Math.round(offset));
            } else if (otherPlayers[otherIds[i]].moveTemp[1] > 0) {
              otherPlayers[otherIds[i]].lastMove =
                8 + Math.abs(Math.round(offset));
            } else {
              otherPlayers[otherIds[i]].lastMove =
                0 + Math.abs(Math.round(offset));
            }
          }
        }
        drawBlock(
          otherPlayers[otherIds[i]].lastMove,
          11 - otherPlayers[otherIds[i]].char,
          otherPlayers[otherIds[i]].playerx * TILESIZE - TILESIZE / 3,
          otherPlayers[otherIds[i]].playery * TILESIZE - (2 * TILESIZE) / 3,
          TILESIZE * 1.5,
          TILESIZE * 1.5
        );
      }
      drawBlock(
        lastMove,
        11 - char,
        playerx * TILESIZE - TILESIZE / 3,
        playery * TILESIZE - (2 * TILESIZE) / 3,
        TILESIZE * 1.5,
        TILESIZE * 1.5
      );
      // debug info
      // fillInfo();
      // lobby info + option if in lobby
      if (state === 'LOBBY') {
        lobbyInfo();
      }
      ctx.scale(1 / scale, 1 / scale);

      if (state === 'PLAY') {
        // update
        // player interface
        if (alive) {
          if (moving[0]) {
            // case 'l':
            if (playerx > 0) {
              if (collisionCheck(playerx - 1, playery)) {
                movePlayer(playerx - 1, playery);
              }
            }
          } else if (moving[1]) {
            // case 'u':
            if (playery > 0) {
              if (collisionCheck(playerx, playery - 1)) {
                movePlayer(playerx, playery - 1);
              }
            }
          } else if (moving[2]) {
            // case 'r':
            if (playerx < XTILES - 1) {
              if (collisionCheck(playerx + 1, playery)) {
                movePlayer(playerx + 1, playery);
              }
            }
          } else if (moving[3]) {
            // case 'd':
            if (playery < YTILES - 1) {
              if (collisionCheck(playerx, playery + 1)) {
                movePlayer(playerx, playery + 1);
              }
            }
          } else {
            nextMove = null;
          }
          if (bombing) {
            // case 'b':
            addBomb(Math.round(playerx), Math.round(playery));
          }
          // move player
          if (moveTemp !== null) {
            playerx += moveTemp[0];
            playery += moveTemp[1];
            moveTemp[2]--;
            if (moveTemp[2] <= 0) {
              playerx = Math.round(playerx);
              playery = Math.round(playery);
              moveTemp = null;
            }
          } else {
            if (nextMove !== null) {
              if (
                collisionCheck(playerx + nextMove[0], playery + nextMove[1])
              ) {
                moveTemp = [
                  nextMove[0] / moveDuration,
                  nextMove[1] / moveDuration,
                  moveDuration
                ];
              }
              nextMove = null;
            }
          }

          // move other players
          for (let i = 0; i < otherIds.length; i++) {
            if (otherPlayers[otherIds[i]].moveTemp !== null) {
              otherPlayers[otherIds[i]].playerx +=
                otherPlayers[otherIds[i]].moveTemp[0];
              otherPlayers[otherIds[i]].playery +=
                otherPlayers[otherIds[i]].moveTemp[1];
              otherPlayers[otherIds[i]].moveTemp[2]--;
              if (otherPlayers[otherIds[i]].moveTemp[2] <= 0) {
                otherPlayers[otherIds[i]].playerx = Math.round(
                  otherPlayers[otherIds[i]].playerx
                );
                otherPlayers[otherIds[i]].playery = Math.round(
                  otherPlayers[otherIds[i]].playery
                );
                otherPlayers[otherIds[i]].moveTemp = null;
              }
            } else {
              if (otherPlayers[otherIds[i]].nextMove !== null) {
                if (
                  collisionCheck(
                    otherPlayers[otherIds[i]].playerx +
                      otherPlayers[otherIds[i]].nextMove[0],
                    otherPlayers[otherIds[i]].playery +
                      otherPlayers[otherIds[i]].nextMove[1]
                  )
                ) {
                  otherPlayers[otherIds[i]].moveTemp = [
                    otherPlayers[otherIds[i]].nextMove[0] /
                      otherPlayers[otherIds[i]].moveDuration,
                    otherPlayers[otherIds[i]].nextMove[1] /
                      otherPlayers[otherIds[i]].moveDuration,
                    otherPlayers[otherIds[i]].moveDuration
                  ];
                }
                otherPlayers[otherIds[i]].nextMove = null;
              }
            }
          }
        }

        // bombs
        for (let i = 0; i < bombs.length; i++) {
          bombs[i][3]--;
          if (bombs[i][3] <= 0) {
            explodeBomb(i);
          }
        }
        // explosions
        for (let i = 0; i < explosions.length; i++) {
          if (explosions[i][0] === playerx && explosions[i][1] === playery) {
            if (ticker > FPS * 10) {
              alive = false;
            }
          }
          explosions[i][3]--;
          if (explosions[i][3] <= 0) {
            removeExplosion(i, explosions[i][0], explosions[i][1]);
          }
        }
        // powerups
        for (let i = 0; i < powerups.length; i++) {
          if (
            powerups[i][0] === Math.round(playerx) &&
            powerups[i][1] === Math.round(playery)
          ) {
            takePowerup(i);
          }
        }
        // fades
        for (let i = 0; i < fades.length; i++) {
          fades[i][6]--;
          if (fades[i][6] <= 0) {
            fades.splice(i, 1);
          }
        }
      }
      ticker++;
    }, 1000 / FPS);
    console.log('started timer');
  }
};

const stopTimer = () => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
    console.log('stopped timer');
  }
};

canv.addEventListener('keydown', e => {
  switch (state) {
    case 'LOBBY':
      break;
    case 'PLAY':
      switch (e.key) {
        case 'a':
        case 'ArrowLeft':
          moving[0] = true;
          break;
        case 'w':
        case 'ArrowUp':
          moving[1] = true;
          break;
        case 'd':
        case 'ArrowRight':
          moving[2] = true;
          break;
        case 's':
        case 'ArrowDown':
          moving[3] = true;
          break;
        case 'b':
        case ' ':
          bombing = true;
          break;
      }
      break;
  }
});

canv.addEventListener('keyup', e => {
  switch (e.key) {
    case 'a':
    case 'ArrowLeft':
      if (state === 'PLAY') {
        moving[0] = false;
      } else {
        mobileInput('l', false);
      }
      break;
    case 'w':
    case 'ArrowUp':
      if (state === 'PLAY') {
        moving[1] = false;
      } else {
        mobileInput('u', false);
      }
      break;
    case 'd':
    case 'ArrowRight':
      if (state === 'PLAY') {
        moving[2] = false;
      } else {
        mobileInput('r', false);
      }
      break;
    case 's':
    case 'ArrowDown':
      if (state === 'PLAY') {
        moving[3] = false;
      } else {
        mobileInput('d', false);
      }
      break;
    case 'b':
    case ' ':
      if (state === 'PLAY') {
        bombing = false;
      } else {
        mobileInput('b', true);
      }
      break;
    case 'c':
      stopTimer();
      break;
    case 'x':
      startTimer();
      break;
    case 'p':
      console.log('map:');
      let final = '[';
      for (let j = 0; j < YTILES; j++) {
        let str = '[';
        for (let i = 0; i < XTILES; i++) {
          str += gameMap[j][i] + ',';
        }
        final += str.slice(0, str.length - 1) + '],';
      }
      console.log(final.slice(0, final.length - 1) + ']');
      break;
    case 'r':
      reloadGame();
      break;
  }
});

if (mobile) {
  canv.height = canv.width;
}
function mobileInput(key, up) {
  if (state === 'PLAY') {
    if (!up) {
      switch (key) {
        case 'l':
          moving[0] = true;
          break;
        case 'u':
          moving[1] = true;
          break;
        case 'r':
          moving[2] = true;
          break;
        case 'd':
          moving[3] = true;
          break;
        case 'b':
          bombing = true;
          break;
      }
    } else {
      if (key === 'b') {
        bombing = false;
      } else {
        moving = [false, false, false, false];
      }
    }
  } else if (state === 'LOBBY') {
    switch (key) {
      case 'l':
        if (selecting[1] !== null) {
          selecting[1] = null;
          pressed = false;
          if (ready) {
            ready = false;
            server.emit('readyChange', ready);
          }
        }
        break;
      case 'u':
        if (selecting[1] === null) {
          selecting[0]--;
        } else {
          selecting[1]--;
        }
        break;
      case 'r':
        if (selecting[1] === null) {
          selecting[1] = 0;
        }
        break;
      case 'd':
        if (selecting[1] === null) {
          selecting[0]++;
        } else {
          selecting[1]++;
        }
        break;
      case 'b':
        if (up) {
          pressed = true;
        }
        break;
    }
  }
}

reloadGame();
// startTimer();
const startGame = () => {
  if (id !== null) {
    startTimer();
  }
};

server.on('acceptCon', data => {
  id = data;
  stopTimer();
  startTimer();
  let myData = {
    char,
    alive,
    maxBombs,
    bombSize,
    playerx,
    playery,
    ready,
    name,
    moveDuration,
    moveTemp,
    lastMove,
    nextMove,
    score,
    state
  };
  server.emit('ackAcceptCon', myData);
});

server.on('newPlayer', data => {
  otherIds.push(data.id);
  otherPlayers[data.id] = data.payload;
  console.log('newPlayer', data);
});

server.on('playerLeft', data => {
  console.log('playerLeft', data);
  otherIds = otherIds.filter(id => id !== data);
  let newPlayersArray = [];
  for (let i = 0; i < otherIds.length; i++) {
    newPlayersArray[otherIds[i]] = otherPlayers[otherIds[i]];
  }
  otherPlayers = newPlayersArray;
});

server.on('charChanged', data => {
  console.log('charChanged', data);
  otherPlayers[data.id].char = data.payload;
});
server.on('nameChanged', data => {
  console.log('nameChanged', data);
  otherPlayers[data.id].name = data.payload;
});

server.on('readyChanged', data => {
  console.log('readyChanged', data);
  otherPlayers[data.id].ready = data.payload;
});

server.on('stateChanged', data => {
  console.log('stateChanged', data);
  otherPlayers[data.id].state = data.payload;
});

server.on('startPos', data => {
  playerx = data.x;
  playery = data.y;
});

server.on('startGame', data => {
  if (data !== undefined && data !== null) {
    gameMap = data;
    console.log(data);
    state = 'PLAY';
    ticker = 0;
    stopTimer();
    startTimer();
    server.emit('changeState', 'PLAY');
  }
});

server.on('movedToBlock', data => {
  otherPlayers[data.id].playerx = data.x;
  otherPlayers[data.id].playery = data.y;
});

server.on('changedBlock', data => {
  if (data.x < XTILES && data.y < YTILES) {
    gameMap[data.y][data.x] = data.val;
  }
});
