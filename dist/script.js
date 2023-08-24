/**
 * Represents the main game logic and components.
 */
class Game {
  /**
   * Initializes a new game instance.
   * @param {string} canvasId - The ID of the canvas element.
   */
  constructor(canvasId) {
    this.initializeCanvas(canvasId);
    this.initializeGameComponents();
    this.initializeInvaderComponents();
    this.addEventListeners();
    this.gameLoop();
    this.rounds = 1;
  }

  initializeInvaderComponents() {
    this.invaderDirection = 1; // 1 pour la droite, -1 pour la gauche
    this.invaderSpeed = 2; // Vitesse de déplacement de l'invader
    this.isInvaderMoving = false; // Indicateur pour savoir si l'invader est en mouvement
    this.lasers = []; // Liste pour stocker les lasers actifs
    this.invaderStopTime = this.getRandomTime();
    this.invaderMoveTime = this.getRandomTime();
    this.invaderCurrentTime = 0;
  }

  /**
   * Initializes the canvas and its context.
   * @param {string} canvasId - The ID of the canvas element.
   */
  initializeCanvas(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Initializes the main game components.
   */
  initializeGameComponents() {
    this.ball = new Ball(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.015
    );
    this.paddle = new Paddle(
      this.canvas.width / 2 - 40,
      this.canvas.height - 25,
      this.canvas.width * 0.15,
      8
    );
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.initBricks();
    this.hue = 120; // Initial hue for green
    this.fallingHeart = null;
    this.fallingBonus = null;
    this.bonusActive = false;
    this.bonusTriggeredLives = new Set();
    this.bricksMoving = false;
    this.bricksMoveDirection = Math.random() < 0.5 ? -1 : 1;
    this.messages = [];
    this.invaderPhase = false;
    this.invaderCount = 0;
  }

  /**
   * Initializes bricks for the game.
   */
  initBricks() {
    const numRows = this.getRandomNumRows();
    const numCols = this.getRandomNumCols();
    const brickWidth = this.canvas.width / numCols - 5;
    const brickHeight = 15;

    this.bricksMoving = false;

    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        this.addBrickBasedOnType(i, j, brickWidth, brickHeight);
      }
    }

    this.addMovingBrickToLastRow(numRows, numCols, brickWidth, brickHeight);
  }

  /**
   * Returns a random number of rows for bricks.
   * @returns {number} - Number of rows.
   */
  getRandomNumRows() {
    return Math.floor(Math.random() * 8) + 5;
  }

  /**
   * Returns a random number of columns for bricks.
   * @returns {number} - Number of columns.
   */
  getRandomNumCols() {
    return Math.floor(Math.random() * 10) + 10;
  }

  getRandomTime() {
    // Retourne un temps aléatoire entre 1 et 3 secondes
    return 1000 * (Math.random() * 2 + 1);
  }

  /**
   * Adds a brick to the game based on a random type.
   * @param {number} i - The row index.
   * @param {number} j - The column index.
   * @param {number} brickWidth - The width of the brick.
   * @param {number} brickHeight - The height of the brick.
   */
  addBrickBasedOnType(i, j, brickWidth, brickHeight) {
    const brickType = Math.random();
    let brick;

    if (brickType < 0.5) {
      brick = new Brick(
        j * (brickWidth + 5),
        i * (brickHeight + 5) + 40,
        brickWidth,
        brickHeight
      );
    } else if (brickType < 0.75) {
      brick = new GoldenBrick(
        j * (brickWidth + 5),
        i * (brickHeight + 5) + 40,
        brickWidth,
        brickHeight
      );
    } else {
      brick = new SilverBrick(
        j * (brickWidth + 5),
        i * (brickHeight + 5) + 40,
        brickWidth,
        brickHeight
      );
    }

    this.bricks.push(brick);
  }

  /**
   * Adds a moving brick to the last row.
   * @param {number} numRows - The total number of rows.
   * @param {number} numCols - The total number of columns.
   * @param {number} brickWidth - The width of the brick.
   * @param {number} brickHeight - The height of the brick.
   */
  addMovingBrickToLastRow(numRows, numCols, brickWidth, brickHeight) {
    const lastRowIndex = this.bricks.length - numCols;
    const randomCol = Math.floor(Math.random() * numCols);
    const movingBrick = new MovingBrick(
      randomCol * (brickWidth + 5),
      (numRows - 1) * (brickHeight + 5) + 40,
      brickWidth,
      brickHeight
    );
    this.bricks[lastRowIndex + randomCol] = movingBrick;
  }

  /**
   * Adds necessary event listeners for game controls.
   */
  addEventListeners() {
    // Handle paddle movement with mouse
    window.addEventListener("mousemove", (e) => {
      this.paddle.x = e.clientX - this.paddle.width / 2;
    });

    // Handle paddle movement with touch
    window.addEventListener("touchmove", (e) => {
      this.paddle.x = e.touches[0].clientX - this.paddle.width / 2;
    });
  }

  /**
   * Main game loop.
   */
  gameLoop() {
    this.update();
    this.draw();
    if (this.lives > 0) {
      requestAnimationFrame(() => this.gameLoop());
    } else {
      this.gameOver();
    }
  }

  /**
   * Updates game state.
   */
  update() {
    let pointsWon = 0;
    const lastBrickTouched = this.handleBrickCollision();

    this.checkForNewHeart(pointsWon, lastBrickTouched);
    this.handleFallingItems();
    this.reinitializeBricksIfNoneLeft();
    if (this.bricks.length === 0 && heartMatrix.length > 0) {
      this.msg("You broke my heart! :'-(");
      heartMatrix = []; // Reset the heart matrix so the message doesn't keep appearing
    }
    this.checkAndActivateBonus(lastBrickTouched);
    this.moveBricksIfRequired();
    this.updateHue();

    if (this.isInvaderMoving) {
      this.moveInvader();
    }

    this.updateLasers();

    this.messages.forEach((message) => message.update());
    this.messages = this.messages.filter((message) => message.visible);
  }

  moveInvader() {
    this.invaderCurrentTime += 16.67;

    if (this.isInvaderMoving) {
      for (let brick of this.bricks) {
        brick.x += this.invaderSpeed * this.invaderDirection;
      }

      const leftMostBrick = Math.min(...this.bricks.map((b) => b.x));
      const rightMostBrick = Math.max(...this.bricks.map((b) => b.x + b.width));

      if (leftMostBrick <= 0) {
        this.invaderDirection = 1;
        // Ajustez la position de tous les briques pour qu'elles ne dépassent pas la limite gauche
        const overlap = -leftMostBrick;
        for (let brick of this.bricks) {
          brick.x += overlap;
        }
      } else if (rightMostBrick >= this.canvas.width) {
        this.invaderDirection = -1;
        // Ajustez la position de tous les briques pour qu'elles ne dépassent pas la limite droite
        const overlap = this.canvas.width - rightMostBrick;
        for (let brick of this.bricks) {
          brick.x += overlap;
        }
      }

      if (this.invaderCurrentTime > this.invaderMoveTime) {
        // this.isInvaderMoving = false;
        this.invaderCurrentTime = 0;
      }
    } else {
      if (this.invaderCurrentTime > this.invaderStopTime) {
        this.isInvaderMoving = true;
        this.invaderDirection = Math.random() < 0.5 ? -1 : 1;
        this.invaderCurrentTime = 0;
      }
    }
    if (Math.random() < 0.01) {
      const canonBricks = this.bricks.filter(
        (brick) => brick instanceof CanonBrick
      );
      if (canonBricks.length > 0) {
        const randomBrick =
          canonBricks[Math.floor(Math.random() * canonBricks.length)];
        const laserX = randomBrick.x + randomBrick.width / 2;
        const laserY = randomBrick.y + randomBrick.height;
        this.lasers.push(new Laser(laserX, laserY));
      }
    }
  }

  /**
   * Reinitializes bricks if none are left.
   */
  // reinitializeBricksIfNoneLeft() { TODO : debug this version
  //   const roundsIntervalForInvaderPhase = 2;
  //   if (this.bricks.length === 0) {
  //     this.rounds++;
  //     // console.log("Rounds : " + this.rounds);
  //     if (Math.random() < 1) { // 0.1
  //       this.bricksMoving = false;
  //       this.initHeartBricks();
  //       this.msg("Love is in the air!");
  //     } else if (this.rounds % roundsIntervalForInvaderPhase === 0) {
  //       // nbre de rounds
  //       // console.log("Invader Phase");
  //       this.invaderPhase = true;
  //       this.invaderCount++;
  //       this.initInvaderBricks();
  //     } else {
  //       // console.log("Normal Phase");
  //       if (this.invaderCount === 1) {
  //         this.msg("You saved us !");
  //       } else {
  //         this.msg("you saved us again");
  //       }
  //       this.invaderPhase = false;
  //       this.initBricks();
  //       this.isInvaderMoving = false;
  //     }
  //   }
  // }
  reinitializeBricksIfNoneLeft() {
    const roundsIntervalForInvaderPhase = 2;
    if (this.bricks.length === 0) {
      this.rounds++;
      // console.log("Rounds : " + this.rounds);
      if (this.rounds % roundsIntervalForInvaderPhase === 0) {
        // nbre de rounds
        // console.log("Invader Phase");
        this.invaderPhase = true;
        this.invaderCount++;
        this.initInvaderBricks();
      } else {
        // console.log("Normal Phase");
        if (this.invaderCount === 1) {
          this.msg("You saved us !");
        } else {
          this.msg("you saved us again");
        }
        this.invaderPhase = false;
        this.initBricks();
        this.isInvaderMoving = false;
      }
    }
  }

  initInvaderBricks() {
    const invaderMatrix = [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1]
    ];
    const brickWidth = (this.canvas.width / invaderMatrix[0].length - 5) / 4;
    const brickHeight = brickWidth;

    if (this.invaderCount === 1) {
      this.msg("Oh No !!! Please save the earth !!");
    } else {
      this.msg("Another invader !!! Please save the earth again !!");
    }

    this.deactivateBonus();
    this.bricksMoving = false;

    this.bricks = [];
    for (let i = 0; i < invaderMatrix.length; i++) {
      for (let j = 0; j < invaderMatrix[i].length; j++) {
        if (invaderMatrix[i][j] === 1) {
          let brick;
          if (i === invaderMatrix.length - 1) {
            // Si c'est la dernière ligne
            brick = new CanonBrick(
              j * (brickWidth + 5),
              i * (brickHeight + 5) + 40,
              brickWidth,
              brickHeight
            );
          } else {
            const brickType = Math.random();
            if (brickType < 0.5) {
              brick = new Brick(
                j * (brickWidth + 5),
                i * (brickHeight + 5) + 40,
                brickWidth,
                brickHeight
              );
            } else if (brickType < 0.75) {
              brick = new GoldenBrick(
                j * (brickWidth + 5),
                i * (brickHeight + 5) + 40,
                brickWidth,
                brickHeight
              );
            } else {
              brick = new SilverBrick(
                j * (brickWidth + 5),
                i * (brickHeight + 5) + 40,
                brickWidth,
                brickHeight
              );
            }
          }
          this.bricks.push(brick);
        }
      }
    }
    this.isInvaderMoving = true;
  }

  initHeartBricks() {
    console.log("init Heart Bricks");
    const heartMatrix = [
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0]
    ];

    const brickWidth = (this.canvas.width / heartMatrix[0].length - 5) / 8;
    const brickHeight = brickWidth;

    this.bricks = [];
    for (let i = 0; i < heartMatrix.length; i++) {
      for (let j = 0; j < heartMatrix[i].length; j++) {
        if (heartMatrix[i][j] === 1) {
          let brick;
          if (i === 0 || i === heartMatrix.length - 1) {
            brick = new SilverBrick(
              j * (brickWidth + 5),
              i * (brickHeight + 5) + 40,
              brickWidth,
              brickHeight
            );
          } else {
            this.addBrickBasedOnType(i, j, brickWidth, brickHeight);
          }
          this.bricks.push(brick);
        }
      }
    }
  }

  updateLasers() {
    for (let i = 0; i < this.lasers.length; i++) {
      const laser = this.lasers[i];
      laser.update();

      if (
        laser.y + laser.height > this.paddle.y &&
        laser.x + laser.width > this.paddle.x &&
        laser.x < this.paddle.x + this.paddle.width
      ) {
        this.lasers.splice(i, 1);
        this.lives--;
        this.msg("Beware the lazers, it hurts !!");
        if (this.lives <= 0) {
          this.gameOver();
        }
      } else if (
        laser.y + laser.height > this.canvas.height ||
        laser.y + laser.height * this.maxTrailLength < 0
      ) {
        // Ajout de la condition pour supprimer les lasers hors de l'écran par le haut
        this.lasers.splice(i, 1);
      }
    }
  }

  /**
   * Checks conditions and activates bonus if required.
   * @param {Brick|null} lastBrickTouched - The last brick touched by the ball.
   */
  checkAndActivateBonus(lastBrickTouched) {
    if (
      this.lives % 5 === 0 &&
      !this.fallingBonus &&
      lastBrickTouched &&
      !this.bonusTriggeredLives.has(this.lives)
    ) {
      this.fallingBonus = new Bonus(
        lastBrickTouched.x + lastBrickTouched.width / 2,
        lastBrickTouched.y + lastBrickTouched.height
      );
      this.bonusTriggeredLives.add(this.lives);
    }
  }

  /**
   * Moves bricks horizontally if required.
   */
  moveBricksIfRequired() {
    if (this.bricksMoving) {
      this.moveBricksHorizontally();
    }
  }

  /**
   * Updates the hue value.
   */
  updateHue() {
    this.hue += 1;
    if (this.hue > 360) this.hue = 0;
  }

  /**
   * Handles ball collision with bricks.
   * @returns {Brick|null} - The last brick touched by the ball.
   */
  /**
   * Handles ball collision with bricks.
   * @returns {Brick|null} - The last brick touched by the ball.
   */
  handleBrickCollision() {
    let lastBrickTouched = null;
    let pointsWon = 0;

    this.updateBallAndPaddle();

    this.bricks.forEach((brick, index) => {
      if (this.isBallCollidingWithBrick(brick)) {
        lastBrickTouched = brick;
        pointsWon += this.processBrickCollision(brick, index);
      }
    });

    this.score += pointsWon;
    this.checkForHeartDrop(pointsWon);

    return lastBrickTouched;
  }

  /**
   * Updates the ball and paddle positions.
   */
  updateBallAndPaddle() {
    this.ball.update(this.canvas, this.paddle, () => {
      this.lives--;
      if (this.lives > 0) {
        this.ball.reset(this.canvas);
      }
    });
    this.paddle.update(this.canvas);
  }

  /**
   * Checks if the ball is colliding with a given brick.
   * @param {Brick} brick - The brick to check against.
   * @returns {boolean} - True if colliding, false otherwise.
   */
  isBallCollidingWithBrick(brick) {
    return (
      this.ball.y - this.ball.radius < brick.y + brick.height &&
      this.ball.y + this.ball.radius > brick.y &&
      this.ball.x + this.ball.radius > brick.x &&
      this.ball.x - this.ball.radius < brick.x + brick.width
    );
  }

  /**
   * Processes the collision of the ball with a given brick.
   * @param {Brick} brick - The brick the ball collided with.
   * @param {number} index - The index of the brick in the bricks array.
   * @returns {number} - Points won from the collision.
   */
  processBrickCollision(brick, index) {
    let points = 0;
    this.ball.dy = -this.ball.dy;

    if (brick instanceof GoldenBrick) {
      points += 20;
      this.bricks.splice(index, 1);
    } else if (brick instanceof SilverBrick) {
      brick.hits++;
      if (brick.hits === 2) {
        points += 15;
        this.bricks.splice(index, 1);
      }
    } else if (brick instanceof MovingBrick) {
      this.bricksMoving = true;
      this.bricks.splice(index, 1);
      this.msg(
        "You spin me right round, baby, right round Like a record, baby, right round, round, round..."
      );
    } else if (brick instanceof CanonBrick) {
      if (brick.hit()) {
        // Si la brique a été touchée 8 fois
        points += 10;
        this.bricks.splice(index, 1);
      }
    } else {
      points += 10;
      this.bricks.splice(index, 1);
    }

    if (this.bonusActive) {
      points += this.handleBonusExplosion();
    }

    return points;
  }

  msg(txt) {
    this.messages.push(
      new Message(
        String(txt),
        this.canvas.width,
        this.canvas.height / 2,
        4,
        `hsl(${this.hue}, 100%, 50%)`
      )
    );
  }

  /**
   * Handles the explosion effect when a bonus is active.
   * @returns {number} - Additional points won from the explosion.
   */
  handleBonusExplosion() {
    let points = 0;
    const explosionRadius = (this.canvas.width + this.canvas.height) * 0.085;

    this.bricks = this.bricks.filter((brick) => {
      const dx = brick.x + brick.width / 2 - this.ball.x;
      const dy = brick.y + brick.height / 2 - this.ball.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < explosionRadius) {
        points += 10;
        return false;
      }
      return true;
    });

    return points;
  }

  /**
   * Checks and initializes a new heart if conditions are met.
   * @param {number} pointsWon - The points won during the collision.
   */
  checkForHeartDrop(pointsWon) {
    if (
      checkHundredsIncrease(this.score - pointsWon, pointsWon) &&
      !this.fallingHeart
    ) {
      this.fallingHeart = new Heart(this.ball.x, this.ball.y);
    }
  }

  /**
   * Moves all bricks horizontally based on the current move direction.
   * Bricks that move out of the canvas on one side reappear on the opposite side.
   */
  moveBricksHorizontally() {
    // Define the amount by which each brick should move
    const moveAmount = 5;

    // Iterate over each brick to update its position
    this.bricks.forEach((brick) => {
      // Adjust the brick's x-coordinate based on the move direction
      brick.x += this.bricksMoveDirection * moveAmount;

      // If the brick has moved out of the canvas on the left side
      if (brick.x < 0 - brick.width) {
        // Make it reappear on the right side
        brick.x = this.canvas.width;
      }
      // If the brick has moved out of the canvas on the right side
      else if (brick.x > this.canvas.width) {
        // Make it reappear on the left side
        brick.x = 0 - brick.width;
      }
    });
  }

  /**
   * Checks and initializes a new heart if conditions are met.
   * @param {number} pointsWon - The points won during the collision.
   * @param {Brick|null} lastBrickTouched - The last brick touched by the ball.
   */
  checkForNewHeart(pointsWon, lastBrickTouched) {
    if (
      checkHundredsIncrease(this.score - pointsWon, pointsWon) &&
      !this.fallingHeart &&
      lastBrickTouched
    ) {
      this.fallingHeart = new Heart(
        lastBrickTouched.x + lastBrickTouched.width / 2,
        lastBrickTouched.y + lastBrickTouched.height
      );
    }
  }

  /**
   * Handles the falling heart's movement and collision.
   */
  handleFallingHeart() {
    if (this.fallingHeart) {
      this.fallingHeart.update();

      if (
        this.fallingHeart.y + this.fallingHeart.size * 12 > this.paddle.y &&
        this.fallingHeart.x > this.paddle.x &&
        this.fallingHeart.x < this.paddle.x + this.paddle.width
      ) {
        this.lives++;
        this.fallingHeart = null;
        if (this.lives == 10) {
          this.msg("More lives than a cat !");
        }

        // Check for bonus drop when a new life is gained and lives are a multiple of 5
        if (this.lives % 5 === 0 && !this.bonusTriggeredLives.has(this.lives)) {
          this.fallingBonus = new Bonus(this.ball.x, this.ball.y);
          this.bonusTriggeredLives.add(this.lives);
        }
      } else if (this.fallingHeart.y > this.canvas.height) {
        this.fallingHeart = null;
      }
    }
  }

  /**
   * Handles the falling items' movement and collision.
   */
  handleFallingItems() {
    const handleItem = (item) => {
      if (!item) return null; // Check if the object isd defined

      item.update();
      if (
        item.y + item.size * 8 > this.paddle.y &&
        item.x > this.paddle.x &&
        item.x < this.paddle.x + this.paddle.width
      ) {
        if (item instanceof Heart) {
          this.lives++;
          if (this.lives == 10) {
            this.msg("More lives than a cat !");
          }
        } else if (item instanceof Bonus) {
          this.activateBonus();
        }
        return null;
      } else if (item.y > this.canvas.height) {
        return null;
      }
      return item;
    };

    this.fallingHeart = handleItem(this.fallingHeart);
    this.fallingBonus = handleItem(this.fallingBonus);
  }

  /**
   * Renders game components.
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ball.draw(this.ctx);
    this.paddle.draw(this.ctx);
    this.bricks.forEach((brick) => brick.draw(this.ctx));

    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // Use the hue property
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx.fillText(`Lives: ${this.lives}`, this.canvas.width - 150, 30);

    // draw Message
    this.messages.forEach((message) => message.draw(this.ctx));

    // Draw falling heart
    if (this.fallingHeart) {
      this.fallingHeart.draw(this.ctx, this.hue);
    }

    if (this.fallingBonus) {
      this.fallingBonus.draw(this.ctx, this.hue);
    }

    // Invader lasers
    for (let laser of this.lasers) {
      laser.draw(this.ctx);
    }
  }

  /**
   * Displays the game over screen.
   */
  gameOver() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // Use the hue property
    this.ctx.fillText(
      "Game Over",
      this.canvas.width / 2 - 75,
      this.canvas.height / 2 - 20
    );
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2 - 75,
      this.canvas.height / 2 + 20
    );

    // Add an event listener to restart the game on click
    this.canvas.addEventListener("click", this.restartGame.bind(this), {
      once: true
    });
  }

  /**
   * Restarts the game.
   */
  restartGame() {
    // Reset game properties
    this.score = 0;
    this.lives = 3;
    this.initBricks();
    this.ball.reset(this.canvas);
    this.gameLoop();
  }

  /**
   * Activates the bonus mode.
   */
  activateBonus() {
    this.bonusActive = true;
    this.ball.isGlowing = true;
    this.paddle.isGlowing = true;
    this.msg("Kaboom !!!");
    setTimeout(() => {
      this.deactivateBonus();
    }, 30000); // Désactive après 30 secondes
  }

   /**
   * Deactivates the bonus mode.
   */
  deactivateBonus() {
    this.bonusActive = false;
    this.ball.isGlowing = false;
    this.paddle.isGlowing = false;
  }
}

/**
 * Represents the ball in the game.
 */
class Ball {
  /**
   * Initializes a new ball instance.
   * @param {number} x - The x-coordinate of the ball's center.
   * @param {number} y - The y-coordinate of the ball's center.
   * @param {number} radius - The radius of the ball.
   */
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = 4;
    this.dx = this.speed;
    this.dy = -this.speed;
    this.hue = 240; // Initial hue for blue
  }

  /**
   * Resets the ball to the center of the canvas.
   * @param {Object} canvas - The canvas element.
   */
  reset(canvas) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.dx = this.speed;
    this.dy = -this.speed;
  }

  /**
   * Updates the ball's position and handles collisions.
   * @param {Object} canvas - The canvas element.
   * @param {Object} paddle - The paddle object.
   * @param {Function} onMiss - Callback function when the ball misses the paddle.
   */
  update(canvas, paddle, onMiss) {
    this.x += this.dx;
    this.y += this.dy;

    // Ball collision with walls
    if (this.x < 0 || this.x > canvas.width) this.dx = -this.dx;
    if (this.y < 0) this.dy = -this.dy;
    if (this.y > canvas.height) {
      onMiss();
    }

    // Ball collision with paddle
    if (
      this.y + this.radius > paddle.y &&
      this.x > paddle.x &&
      this.x < paddle.x + paddle.width
    ) {
      this.dy = -this.speed;
    }

    // hue
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
  }

  /**
   * Renders the ball on the canvas.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    if (this.isGlowing) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = `hsl(${(this.hue + 180) % 360}, 100%, 50%)`;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fill();
    ctx.closePath();

    ctx.shadowBlur = 0; // Reset
  }
}

/**
 * Represents the paddle in the game.
 */
class Paddle {
  /**
   * Initializes a new paddle instance.
   * @param {number} x - The x-coordinate of the paddle's top-left corner.
   * @param {number} y - The y-coordinate of the paddle's top-left corner.
   * @param {number} width - The width of the paddle.
   * @param {number} height - The height of the paddle.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hue = 240;
  }

  /**
   * Updates the paddle's position based on boundaries and adjusts its hue.
   * @param {Object} canvas - The canvas element.
   */
  update(canvas) {
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
  }

  /**
   * Renders the paddle on the canvas.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    if (this.isGlowing) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsl(${(this.hue + 180) % 360}, 100%, 50%)`;
    }

    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fill();
    ctx.closePath();

    ctx.shadowBlur = 0; // Reset
  }
}

/**
 * Represents a brick in the game.
 */
class Brick {
  /**
   * Initializes a new brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hue = 0; // Initial hue for red
  }

  /**
   * Renders the brick on the canvas with a hue shift.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Represents a special golden brick in the game, which has additional effects or rewards.
 * Extends the basic Brick class.
 */
class GoldenBrick extends Brick {
  /**
   * Initializes a new golden brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.hue = 50; // Hue for golden color
  }

  /**
   * Overrides the draw method to render the golden brick on the canvas with a hue shift and a special power-up symbol (e.g., a small star).
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    super.draw(ctx);
    // Draw the star for the golden brick
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.5, this.y + this.height * 0.2);
    ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.8);
    ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.3);
    ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.3);
    ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.8);
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
  }
}

/**
 * Represents a special silver brick in the game, which requires multiple hits to be destroyed.
 * Extends the basic Brick class.
 */
class SilverBrick extends Brick {
  /**
   * Initializes a new silver brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.hue = 0; // Hue for silver color
    this.hits = 0; // Number of hits taken
  }

  /**
   * Overrides the draw to render the silver brick on the canvas. The brick's color changes after the first hit.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    if (this.hits === 1) {
      ctx.fillStyle = `hsl(${this.hue}, 0%, 60%)`; // Darker silver after hit
    } else {
      ctx.fillStyle = `hsl(${this.hue}, 0%, 75%)`; // Original silver color
    }
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Represents a moving brick in the game.
 * This brick type visually indicates its ability to move by displaying horizontal arrows.
 * It extends the basic properties and behaviors of a regular brick.
 */
class MovingBrick extends Brick {
  /**
   * Constructs a new instance of the MovingBrick.
   * @param {number} x - The x-coordinate of the top-left corner of the brick.
   * @param {number} y - The y-coordinate of the top-left corner of the brick.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    // Set the hue to a color opposite to that of regular bricks for distinction
    this.hue = 180;
  }

  /**
   * Draws the moving brick on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   */
  draw(ctx) {
    super.draw(ctx);

    // Draw a horizontal double arrow to indicate the brick's moving ability

    // Draw the main line of the arrow
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.5);
    ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.5);
    ctx.stroke();

    // Draw the left arrowhead
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.4);
    ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.5);
    ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.6);
    ctx.fill();

    // Draw the right arrowhead
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.7, this.y + this.height * 0.4);
    ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.5);
    ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.6);
    ctx.fill();
  }
}

class CanonBrick extends Brick {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.hits = 0;
    this.maxHits = 8;
    this.colors = [
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "indigo",
      "violet",
      "pink"
    ];
  }

  draw(ctx) {
    ctx.fillStyle = this.colors[this.hits];
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    ctx.closePath();
  }

  hit() {
    this.hits++;
    if (this.hits >= this.maxHits) {
      return true; // La brique doit être détruite
    }
    return false; // La brique ne doit pas être détruite
  }
}

/**
 * Represents a bonus item in the game.
 * This bonus is visually represented by a pattern of pixels and can provide special abilities or points to the player.
 */
class Bonus {
  /**
   * Constructs a new instance of the Bonus.
   * @param {number} x - The x-coordinate of the top-left corner of the bonus.
   * @param {number} y - The y-coordinate of the top-left corner of the bonus.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2; // Defines the falling speed of the bonus item
    this.size = 3; // Size of each pixel in the bonus pattern

    // A 2D array representing the pixel pattern of the bonus item.
    // 1 indicates a filled pixel, and 0 indicates an empty space.
    this.bonusPixels = [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1]
    ];
  }

  /**
   * Updates the position of the bonus item based on its speed.
   */
  update() {
    this.y += this.speed;
  }

  /**
   * Draws the bonus item on the canvas using its pixel pattern.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   * @param {number} hue - The hue value for the bonus color.
   */
  draw(ctx, hue) {
    // Iterate over the bonus pixel pattern
    for (let i = 0; i < this.bonusPixels.length; i++) {
      for (let j = 0; j < this.bonusPixels[i].length; j++) {
        // If the pixel is filled (value is 1)
        if (this.bonusPixels[i][j] === 1) {
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`; // Set the fill color based on the provided hue
          ctx.fillRect(
            this.x + j * this.size,
            this.y + i * this.size,
            this.size,
            this.size
          );
        }
      }
    }
  }
}

class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 10;
    this.speed = 4;
    this.color = "green";
    this.trail = []; // Ajout de l'historique de positions
    this.maxTrailLength = 10; // Longueur maximale de la trainée
  }

  update() {
    this.y += this.speed;

    // Ajoute la position actuelle à l'historique
    this.trail.push({ x: this.x, y: this.y });

    // Limite la longueur de l'historique pour éviter qu'il ne devienne trop long
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Dessine la trainée
    let opacity = 0.5; // Opacité initiale
    const decrement = 0.5 / this.trail.length; // Diminution de l'opacité pour chaque segment de la trainée

    for (let i = 0; i < this.trail.length - 1; i++) {
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`; // Utilise une couleur RGBA pour inclure l'opacité
      ctx.fillRect(this.trail[i].x, this.trail[i].y, this.width, this.height);
      opacity -= decrement;
    }
  }
}

class Message {
  constructor(text, x, y, speed, color) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.visible = true;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.text.length * 10 < 0) {
      // 10 est une estimation de la largeur d'un caractère, à ajuster selon la police utilisée
      this.visible = false;
    }
  }

  draw(ctx) {
    ctx.font = "30px Arial";
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
  }
}

/**
 * Draws a heart shape on the canvas using a pixelated approach.
 * @param {number} x - The x-coordinate of the top-left corner of the heart.
 * @param {number} y - The y-coordinate of the top-left corner of the heart.
 * @param {number} size - The size of each pixel square.
 * @param {string} color - The color of the heart.
 */
function drawHeart(ctx, x, y, size, color) {
  // console.log(drawHeart);
  const heartPixels = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  for (let i = 0; i < heartPixels.length; i++) {
    for (let j = 0; j < heartPixels[i].length; j++) {
      if (heartPixels[i][j] === 1) {
        ctx.fillStyle = color;
        ctx.fillRect(x + j * size, y + i * size, size, size);
      }
    }
  }
}

/**
 * Checks if the score has increased by a multiple of 100.
 * @param {number} oldScore - The previous score before the points were added.
 * @param {number} pointsWon - The points recently won.
 * @returns {boolean} - Returns true if the score has increased by a multiple of 100, otherwise false.
 */
function checkHundredsIncrease(oldScore, pointsWon) {
  const newScore = oldScore + pointsWon;

  const oldHundreds = Math.floor(oldScore / 100);
  const newHundreds = Math.floor(newScore / 100);

  return newHundreds > oldHundreds;
}

/**
 * Represents a heart object in the game.
 * The heart can move downwards and can be drawn on the canvas.
 */
class Heart {
  /**
   * Creates a new Heart instance.
   * @param {number} x - The x-coordinate of the top-left corner of the heart.
   * @param {number} y - The y-coordinate of the top-left corner of the heart.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.size = 3;
  }

  /**
   * Updates the position of the heart based on its speed.
   */
  update() {
    this.y += this.speed;
  }

  /**
   * Draws the heart on the canvas using the provided context and hue.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   * @param {number} hue - The hue value for the heart's color.
   */
  draw(ctx, hue) {
    drawHeart(ctx, this.x, this.y, this.size, `hsl(${hue}, 100%, 50%)`);
  }
}

document.getElementById("startScreen").addEventListener("click", function () {
  this.style.display = "none";
  document.getElementById("gameCanvas").style.display = "block";
  new Game("gameCanvas");
});

function requestFullScreen() {
  if (!document.fullscreenElement) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      /* Firefox */
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      /* IE/Edge */
      document.documentElement.msRequestFullscreen();
    }
  }
}

document.addEventListener("click", requestFullScreen);