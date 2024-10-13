const canvas = document.getElementById("myCanvas");
const ui = document.getElementById("UI");
const ctxUI = ui.getContext("2d");
const ctx = canvas.getContext("2d");

// Para que la Barra Superior ocupe todo el ancho de la pantalla
ui.width = window.innerWidth;

// De esta forma el canvas ocupa toda la pantalla
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - ui.height;

// Para no tener que hacer click para empezar a jugar;
canvas.setAttribute("tabindex", "0");
canvas.focus();

const config = {
  // Score, Hit a brick => +10
  globalScore: 0,

  // Velocidad por defecto del Rectángulo
  xSpeed: 15,

  // Valores por defecto de la bolaa
  xBallSpeed: 0, // -3
  yballSpeed: -0, // -5 / -10

  // Valores por defecto de los modifers
  yModifierSpeed: 0,

  // Variables globales para saber en que dirección se está moviendo en Rectángulo
  movingRight: false,
  movingLeft: false,

  // Variables globales para saber si el Rectángulo se va a salir del Canvas
  rectangleHitRightSide: false,
  rectangleHitLeftSide: false,

  // Variables globales para saber a cuantos FPS tenemos
  lastTime: 0,
  fps: 0,
};

const GAME_STATUS = {
  GAME_OVER: false,
  GAME_WIN: false,
  GAME_PAUSE: true,
};

const imagesSrc = {
  ball: "images/ball.png",
  rectangle: "images/defaultRectangle.png",
  heart: "images/heart.png",
};

const defaultRectangle = {
  INITIAL_RECTANGLE_X: canvas.width / 2 - 100 / 2,
  INITIAL_RECTANGLE_Y: canvas.height - 70,
  WIDTH_RECTANGLE: 100, // Large -> 150 | Big -> =
  HEIGTH_RECTANGLE: 25, // Large -> = | Big -> 25 * 2
};

// Valores por defecto del Rectángulo
const rectangle = {
  x: canvas.width / 2 - defaultRectangle.WIDTH_RECTANGLE / 2,
  y: canvas.height - 70,
  width: defaultRectangle.WIDTH_RECTANGLE,
  height: defaultRectangle.HEIGTH_RECTANGLE,
  image: loadImage(imagesSrc.rectangle),
};

const defaultBall = {
  INITIAL_BALL_X: rectangle.x + rectangle.width / 2 - 20 / 2,
  INITIAL_BALL_Y: rectangle.y - rectangle.height,
  WIDTH_BALL: 20,
  HEIGTH_BALL: 20,
};

// Valores por defecto de la Bola
const ball = {
  x: defaultBall.INITIAL_BALL_X,
  y: defaultBall.INITIAL_BALL_Y,
  width: defaultBall.WIDTH_BALL,
  height: defaultBall.HEIGTH_BALL,
  image: loadImage(imagesSrc.ball),
};

// Valores por defecto del Brick
const brick = {
  image: null,
  x: 50,
  y: 20,
  width: 100,
  height: 25,
  brickPadding: 10,
  visible: true,
};

const sounds = {
  soundBrickBreak: createAudio("audio/brickBreak.wav"),
  soundBallBounce: createAudio("audio/ballBounce.wav"),
  soundLosseHeart: createAudio("audio/losseHeart.wav"),
  soundGameOver: createAudio("audio/gameOver.wav"),
  soundWin: createAudio("audio/gameWin.wav"),
};

const colorsBrick = [
  "images/brickBlue.png",
  "images/brickBrown.png",
  "images/brickCyan.png",
  "images/brickDarkGreen.png",
  "images/brickGray.png",
  "images/brickGreen.png",
  "images/brickOrange.png",
  "images/brickPurple.png",
  "images/brickRed.png",
  "images/brickYellow.png",
];

const defaultHeart = {
  INTIAL_HEART_X: window.innerWidth - 100,
  INTIAL_HEART_Y: ui.height / 2 - 25 / 2,
  WIDTH_HEART: 30,
  HEIGTH_HEART: 25,
  MAX_HEARTS: 2,
};

const heart = {
  x: defaultHeart.INTIAL_HEART_X,
  y: defaultHeart.INTIAL_HEART_Y,
  width: defaultHeart.WIDTH_HEART,
  height: defaultHeart.HEIGTH_HEART,
  image: loadImage(imagesSrc.heart),
};

const modifersImages = {
  "images/shortChange.png": "images/shortRectangle.png",
  "images/largeChange.png": "images/largeRectangle.png",
  "images/heart.png": "images/heart.png",
};

const modifersChance = {
  shortChange: 10,
  largeChange: 5,
  heartChange: 5,
};

const defaultModifiers = {
  image: null,
  x: 0,
  y: 0,
  width: 100,
  height: 25,
  visible: false,
};

const hearts = [];
const modifiers = [];
const bricks = [];

function loadHeart() {
  for (let i = 0; i < defaultHeart.MAX_HEARTS; i++) {
    const heartX = heart.x + i * (heart.width - heart.width * 2.2);

    hearts.push({
      image: heart.image,
      x: heartX,
      y: heart.y,
      width: heart.width,
      height: heart.height,
    });
  }
}

function loadModifiersChange() {
  Object.entries(modifersImages).forEach(
    ([modifiedImageURL, originalImageURL]) => {
      let modifiedImage = loadImage(modifiedImageURL);
      let originalImage = loadImage(originalImageURL);

      let customWidth;

      customWidth = originalImage.src.includes("heart.png")
        ? heart.width
        : defaultModifiers.width;

      modifiers.push({
        image: modifiedImage,
        originalImage: originalImage,
        x: defaultModifiers.x,
        y: defaultModifiers.y,
        width: customWidth,
        height: defaultModifiers.height,
      });
    }
  );
}

// Variable Global que tiene una referencia al audio que se está reproduciendo actualmente
let currentAudio = null;

function createAudio(url) {
  const audio = new Audio(url);
  return () => {
    // Si hay un audio que está sonando, lo detenemos antes de reproducir uno nuevo.
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0; // Reinicia el audio anterior
    }

    // Reproducimos el nuevo audio y lo asignamos como el audio actual.
    audio.play();
    currentAudio = audio;
  };
}

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const defaultBrickConfig = {
  offsetTop: 50, // Espacio superior desde el borde del canvas
  offsetLeft: 0,
};

const brickStructures = [
  [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
  ],
  [
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
  ]
];

function loadInitialBricks() {
  // Seleccionar una estructura aleatoria de ladrillos
  const selectedStructure =
    brickStructures[Math.floor(Math.random() * brickStructures.length)];
  const numColumns = selectedStructure[0].length; // Longitud de la primera fila

  // Iterar sobre la estructura y crear ladrillos según el patrón
  selectedStructure.forEach((row, rowIndex) => {
    row.forEach((brickVisible, colIndex) => {
      if (brickVisible) {
        let brickImage = loadImage(
          colorsBrick[(rowIndex + colIndex) % colorsBrick.length]
        );

        defaultBrickConfig.offsetLeft =
          canvas.width / 2 -
          ((brick.width + brick.brickPadding) * numColumns) / 2;

        // Calcular la posición x e y para cada ladrillo
        const brickX =
          defaultBrickConfig.offsetLeft +
          colIndex * (brick.width + brick.brickPadding);
        const brickY =
          defaultBrickConfig.offsetTop +
          rowIndex * (brick.height + brick.brickPadding);

        // Añadir el ladrillo con su imagen y posición a la lista de ladrillos
        bricks.push({
          image: brickImage,
          x: brickX,
          y: brickY,
          width: brick.width,
          height: brick.height,
          visible: true,
        });
      }
    });
  });
}

function drawScore() {
  ctxUI.font = "35px Arial";
  ctxUI.fillStyle = "#EEEEEE";
  ctxUI.textAlign = "center";
  ctxUI.textBaseline = "middle";

  ctxUI.fillText(`Score: ${config.globalScore}`, 150, ui.height / 2 + 4);
}

function drawImage(ctx, image) {
  ctx.drawImage(image.image, image.x, image.y, image.width, image.height);
}

function drawElements() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctxUI.clearRect(0, 0, canvas.width, canvas.height);
  drawImage(ctx, ball);
  drawImage(ctx, rectangle);
  bricks
    .filter((brick) => brick.visible)
    .forEach((brick) => drawImage(ctx, brick));
  hearts.forEach((heart) => drawImage(ctxUI, heart));
  modifiers
    .filter((modifier) => modifier.visible)
    .forEach((modifier) => drawImage(ctx, modifier));
  drawScore();
}

// Función para configurar eventos de teclado
function setupKeyboardListeners() {
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "d") {
      config.movingRight = true;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      config.movingLeft = true;
    }
  });

  canvas.addEventListener("keyup", (event) => {
    if (event.key === "ArrowRight" || event.key === "d") {
      config.movingRight = false;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      config.movingLeft = false;
    }
  });
}

function getFPS(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // Convertir a segundos
  lastTime = timestamp;
  fps = Math.round(1 / deltaTime);
  console.log(fps);
}

function moveRectangle() {
  // Actualizar la posición
  if (config.movingRight) {
    rectangle.x += config.xSpeed;
  }
  if (config.movingLeft) {
    rectangle.x -= config.xSpeed;
  }

  config.rectangleHitRightSide = rectangle.x + rectangle.width > canvas.width;
  config.rectangleHitLeftSide = rectangle.x < 0;

  if (config.movingRight && config.rectangleHitRightSide) {
    rectangle.x = canvas.width - rectangle.width;
  }

  if (config.movingLeft && config.rectangleHitLeftSide) {
    rectangle.x = 0;
  }
}

function handleBallRectangleCollision() {
  const hasHitRectangle =
    rectangle.x < ball.x + ball.width &&
    rectangle.x + rectangle.width > ball.x &&
    rectangle.y < ball.y + ball.height &&
    rectangle.y + rectangle.height > ball.y;

  const ballIsMovingRight = config.xBallSpeed > 0;
  const ballIsMovingLeft = config.xBallSpeed < 0;
  const ballIsMovingDown = config.yballSpeed > 0;

  const reboteLeft =
    ballIsMovingDown &&
    hasHitRectangle &&
    config.movingLeft &&
    ballIsMovingRight;
  const reboteRight =
    ballIsMovingDown &&
    hasHitRectangle &&
    config.movingRight &&
    ballIsMovingLeft;

  reboteLeft || reboteRight
    ? ((config.xBallSpeed *= -1.2), sounds.soundBallBounce())
    : null;

  hasHitRectangle && ballIsMovingDown
    ? ((config.yballSpeed = -config.yballSpeed), sounds.soundBallBounce())
    : null;
}

function handleBallWallCollision() {
  const ballIsMovingRight = config.xBallSpeed > 0;
  const ballIsMovingLeft = config.xBallSpeed < 0;
  const ballIsMovingUp = config.yballSpeed < 0;
  const ballIsMovingDown = config.yballSpeed > 0;

  const hasHitRightSide = ball.x + ball.width > canvas.width;
  const hasHitLeftSide = ball.x < 0;
  const hasHitUpSide = ball.y < 0;
  const hasHitDownSide = ball.y + ball.height > canvas.height;

  (ballIsMovingRight && hasHitRightSide) || (ballIsMovingLeft && hasHitLeftSide)
    ? ((config.xBallSpeed = -config.xBallSpeed), sounds.soundBallBounce())
    : null;

  ballIsMovingUp && hasHitUpSide
    ? ((config.yballSpeed = -config.yballSpeed), sounds.soundBallBounce())
    : null;

  ballIsMovingDown && hasHitDownSide ? handleBallMised() : null;
}

function handleBallMised() {
  hearts.pop();
  sounds.soundLosseHeart();
  ball.x = defaultBall.INITIAL_BALL_X;
  ball.y = defaultBall.INITIAL_BALL_Y;
  config.yballSpeed = 0;
  config.xBallSpeed = 0;
  rectangle.x = defaultRectangle.INITIAL_RECTANGLE_X;
  rectangle.y = defaultRectangle.INITIAL_RECTANGLE_Y;
  GAME_STATUS.GAME_PAUSE = true;
}

function moveBall() {
  ball.y += config.yballSpeed;
  ball.x += config.xBallSpeed;

  handleBallRectangleCollision();
  handleBallWallCollision();
}

function detectBallBrickCollision() {
  bricks.forEach((brick) => {
    const isColliding =
      ball.x < brick.x + brick.width &&
      ball.x + ball.width > brick.x &&
      ball.y < brick.y + brick.height &&
      ball.y + ball.height > brick.y;
    if (brick.visible && isColliding) {
      // Invertir la dirección de la bola en el eje Y para simular el rebote
      config.yballSpeed = -config.yballSpeed;

      randomModifiers(brick.x, brick.y, brick.height);

      // Marcar el ladrillo como no visible para que desaparezca
      brick.visible = false;
      config.globalScore += 10;
      sounds.soundBrickBreak();
    }
  });
}

function handleModifierMised() {
  modifiers
    .filter((modifier) => modifier.visible && modifier.y > canvas.height)
    .forEach((modifier) => (modifier.visible = false));
}

function handleModiferRectangleCollision() {
  modifiers
    .filter((modifier) => modifier.visible)
    .forEach((modifier) => {
      if (checkCollisionModifierRectangle(modifier)) {
        // Large -> 150 | Big -> =
        // Large -> = | Big -> 25 * 2

        if (modifier.image.src.includes("shortChange")) {
          rectangle.height = defaultRectangle.HEIGTH_RECTANGLE;
          rectangle.width = defaultRectangle.WIDTH_RECTANGLE;
          rectangle.height *= 2;
          rectangle.image = modifier.originalImage;
        } else if (modifier.image.src.includes("largeChange")) {
          rectangle.height = defaultRectangle.HEIGTH_RECTANGLE;
          rectangle.width = defaultRectangle.WIDTH_RECTANGLE;
          rectangle.width = 150;
          rectangle.image = modifier.originalImage;
        } else if (modifier.image.src.includes("heart")) {
          addHeart();
        }
        modifier.visible = false;
      }
    });
}

function addHeart() {
  let i = hearts.length;
  const heartX = heart.x + i * (heart.width - defaultHeart.WIDTH_HEART * 2.2);
  i++;
  hearts.push({
    image: heart.image,
    x: heartX,
    y: heart.y,
    width: heart.width,
    height: heart.height,
  });
}

function checkCollisionModifierRectangle(modifier) {
  return (
    rectangle.x < modifier.x + modifier.width &&
    rectangle.x + rectangle.width > modifier.x &&
    rectangle.y < modifier.y + modifier.height &&
    rectangle.y + rectangle.height > modifier.y
  );
}

function detectModifierCollision() {
  modifiers.forEach((modifier) => (modifier.y += config.yModifierSpeed));

  handleModiferRectangleCollision();
  handleModifierMised();
}

function randomModifiers(x, y, height) {
  const selectedModifier = getModifierByRandomNumber();

  // Activar el modificador si existe y no está visible
  if (selectedModifier && !selectedModifier.visible) {
    activateModifier(selectedModifier, x, y, height);
  }
}

function getModifierByRandomNumber() {
  const randomNumber = parseInt(Math.random() * 100) + 1; // Número aleatorio entre 1 y 100

  if (randomNumber <= modifersChance.shortChange) {
    return modifiers[0];
  } else if (
    randomNumber <=
    modifersChance.shortChange + modifersChance.largeChange
  ) {
    return modifiers[1];
  } else if (
    randomNumber <=
    modifersChance.shortChange +
      modifersChance.largeChange +
      modifersChance.heartChange
  ) {
    return modifiers[2];
  }
  return null; // Si no cae en ningún rango, no selecciona un modificador
}

function activateModifier(modifier, x, y, height) {
  modifier.visible = true;
  modifier.x = x;
  modifier.y = y + height;
  config.yModifierSpeed = 1;
}

function continuePlaying() {
  let playing = confirm("¿Quieres seguir jugando?");
  if (playing) {
    config.globalScore = 0;
    hearts.splice(0, hearts.length);
    bricks.splice(0, bricks.length);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    GAME_STATUS.GAME_OVER = false;
    GAME_STATUS.GAME_WIN = false;
    GAME_STATUS.GAME_PAUSE = true;
    ball.x = defaultBall.INITIAL_BALL_X;
    ball.y = defaultBall.INITIAL_BALL_Y;
    config.xBallSpeed = 0;
    config.yballSpeed = 0;
    rectangle.x = defaultRectangle.INITIAL_RECTANGLE_X;
    rectangle.y = defaultRectangle.INITIAL_RECTANGLE_Y;
    main();
  }
}

function checkWin() {
  GAME_STATUS.GAME_WIN = bricks.every((brick) => !brick.visible);
  GAME_STATUS.GAME_OVER = hearts.length === 0;
}

function gameOver() {
  sounds.soundGameOver();
  ctx.fillStyle = "rgba(255,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 25px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  setTimeout(continuePlaying, 1000);
}

function gameWin() {
  sounds.soundWin();
  ctx.fillStyle = "rgb(0,100,0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 25px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Game Win", canvas.width / 2, canvas.height / 2);
  setTimeout(continuePlaying, 1000);
}

function gameLoop(timestamp) {
  if (GAME_STATUS.GAME_PAUSE) {
    if (config.movingLeft) {
      config.xBallSpeed = -3; // 3
      config.yballSpeed = -6; // -8
      GAME_STATUS.GAME_PAUSE = false;
    } else if (config.movingRight) {
      config.xBallSpeed = 3; // 3
      config.yballSpeed = -8; // -8
      GAME_STATUS.GAME_PAUSE = false;
    }
  }

  if (!GAME_STATUS.GAME_WIN && !GAME_STATUS.GAME_OVER) {
    drawElements();
    moveRectangle();
    moveBall();
    detectModifierCollision();
    detectBallBrickCollision();
    checkWin();

    //getFPS(timestamp);
    window.requestAnimationFrame(gameLoop);
  } else if (GAME_STATUS.GAME_WIN) {
    gameWin();
  } else if (GAME_STATUS.GAME_OVER) {
    gameOver();
  }
}

function main() {
  loadInitialBricks();
  loadModifiersChange();
  loadHeart();
  setupKeyboardListeners();
  gameLoop();
}

main();
