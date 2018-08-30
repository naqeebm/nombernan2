const canv = document.getElementById('canv');
const ctx = canv.getContext('2d');
const img = document.createElement('img');
img.src = 'imgs/tiles.png';

const h = window.innerHeight;
const w = window.innerWidth;
const TWOPI = 2 * Math.PI;

// game vars
const FPS = 60;
const DEFAULT_BOMBSIZE = 2;
const DEFAULT_MAXBOMBS = 1;
const DEAFULT_SPEED = 0.15;
const DEFAULT_BOMB_LIFESPAN = 3;
const DEFAULT_EXPLOSION_LIFESPAN = 1.5;
const DEFAULT_MOVE_DURATION = FPS / 3;

canv.height = h;
canv.width = w;
let mobile = false;
if (w < h) {
  mobile = true;
}

// interface
let moving = [false, false, false, false];
let bombing = false;

// map vars
let defaultMap = [
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
const TILESIZE = 20;
const XTILES = 16;
const YTILES = 16;
const scale = Math.min(h, w) / (XTILES * TILESIZE);
let bombs = [];
let explosions = [];
let powerups = [[4, 2, 0], [5, 2, 1], [6, 2, 2], [7, 2, 3]];

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

ctx.fillStyle = 'grey';
ctx.fillRect(0, 0, w, h);

let ticker = 0;
let timer = null;

function reloadGame() {
  // reset interface
  moving = [false, false, false, false];
  bombing = false;

  // reset map vars
  defaultMap = [
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
  bombs = [];
  explosions = [];
  powerups = [];
  fades = [];

  // reset player vars
  playerx = 1;
  playery = 1;
  char = 1;
  placingBombs = false;
  maxBombs = DEFAULT_MAXBOMBS;
  bombSize = DEFAULT_BOMBSIZE;
  moveDuration = DEFAULT_MOVE_DURATION;
  alive = true;
  lastMove = 0;

  // map randomisation
  for (
    let x = Math.round(Math.random() * 2);
    x < XTILES;
    x += Math.round(Math.random() * 2)
  ) {
    for (
      let y = Math.round(Math.random() * 2);
      y < YTILES;
      y += Math.round(Math.random() * 2)
    ) {
      if (
        defaultMap[y][x] === 0 &&
        !(playerx === Math.floor(y) && playery === Math.floor(x))
      ) {
        defaultMap[y][x] = 2;
      }
    }
  }

  ctx.fillStyle = 'grey';
  ctx.fillRect(0, 0, w, h);
  ctx.font = '16px calibri';
  ctx.fillStyle = 'black';
  ctx.fillText('game ready, start timer to begin.', 20, 35);
  ctx.fillText('(tap game or press x).', 50, 50);
  ticker = 0;
  stopTimer();
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
  if (bombs.length < maxBombs && defaultMap[y][x] === 0) {
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
        if (defaultMap[y][x - count] === 2) {
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
        if (defaultMap[y - count][x] === 2) {
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
        if (defaultMap[y][x + count] === 2) {
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
        if (defaultMap[y + count][x] === 2) {
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
  switch (defaultMap[y][x]) {
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
  switch (defaultMap[y][x]) {
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
  switch (defaultMap[y][x]) {
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
  switch (defaultMap[y][x]) {
    case 0:
      return false;
    default:
      return true;
  }
}

function removeExplosion(i, x, y) {
  explosions.splice(i, 1);
  if (defaultMap[y][x] === 6 || defaultMap[y][x] === 7) {
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
  defaultMap[y][x] = val;
}

function collisionCheck(x, y) {
  switch (defaultMap[Math.floor(y)][Math.floor(x)]) {
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
            defaultMap[j][i],
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
      drawBlock(
        lastMove,
        11 - char,
        playerx * TILESIZE - TILESIZE / 3,
        playery * TILESIZE - (2 * TILESIZE) / 3,
        TILESIZE * 1.5,
        TILESIZE * 1.5
      );
      // debug info
      fillInfo();
      ctx.scale(1 / scale, 1 / scale);

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
            if (collisionCheck(playerx + nextMove[0], playery + nextMove[1])) {
              moveTemp = [
                nextMove[0] / moveDuration,
                nextMove[1] / moveDuration,
                moveDuration
              ];
            }
            nextMove = null;
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
});

canv.addEventListener('keyup', e => {
  switch (e.key) {
    case 'a':
    case 'ArrowLeft':
      moving[0] = false;
      break;
    case 'w':
    case 'ArrowUp':
      moving[1] = false;
      break;
    case 'd':
    case 'ArrowRight':
      moving[2] = false;
      break;
    case 's':
    case 'ArrowDown':
      moving[3] = false;
      break;
    case 'b':
    case ' ':
      bombing = false;
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
          str += defaultMap[j][i] + ',';
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

reloadGame();
