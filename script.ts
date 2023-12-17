  const canvas = document.getElementById('gravityCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const scoreElement = document.getElementById('score') as HTMLSpanElement;
  const nextBallDisplay = document.getElementById('nextBall') as HTMLDivElement;
  const timerElement = document.getElementById('timer') as HTMLSpanElement;
  const startMenu = document.getElementById('startMenu') as HTMLDivElement;
  const gameOverMenu = document.getElementById('gameOverMenu') as HTMLDivElement;
  const startButton = document.getElementById('startButton') as HTMLButtonElement;
  const restartButton = document.getElementById('restartButton') as HTMLButtonElement;

  const colors = ["red", "green", "blue", "yellow", "red", "green", "blue", "yellow"];
  const gravity = 0.5;
  const groundHeight = 30;
  let groundSpeed = 1;
  let score = 0;
  let timer = 5;
  const startingTime = 5;
  let lastFrameTime = performance.now();
  let nextBallColor = colors[Math.floor(Math.random() * colors.length)];
  let balls: Ball[] = [];
  let groundSections: GroundSection[] = [];
  let gameRunning = false;

  class Ball {
    public velocityY: number = 0;
    public color: string;
    private radius: number = 20;
    private dampening: number = 0.6; // Adjusted dampening for more bounce
    private hasScored: boolean = false;
    public stopped: boolean = false; // Indicates if the ball has stopped
    public remove: boolean = false; // Flag to mark the ball for removal

    constructor(public x: number, public y: number) {
      this.color = nextBallColor; // Use the upcoming color
      nextBallColor = colors[Math.floor(Math.random() * colors.length)]; // Set next color
      updateNextBallDisplay();
    }

    draw(): void {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }

    update(deltaTime: number): void {
      if (!this.stopped) {
        this.velocityY += gravity;
        this.y += this.velocityY;

        if (this.y + this.radius >= canvas.height - groundHeight) {
          this.y = canvas.height - groundHeight - this.radius;
          this.velocityY *= -this.dampening;

          if (!this.hasScored) {
            checkColorMatch(this.x, this.color);
            this.hasScored = true;
          }

          if (Math.abs(this.velocityY) < 1) {
            this.stopped = true;
            this.remove = true; // Mark the ball for removal
          }
        } else {
          this.hasScored = false;
        }
      }
    }
  }

  class GroundSection {
    constructor(public x: number, public width: number, public color: string) {}

    draw(): void {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, canvas.height - groundHeight, this.width, groundHeight);
    }

    update(): void {
      this.x -= groundSpeed;
      if (this.x + this.width < 0) {
        let max_x = 0;
        groundSections.forEach(section => {
          if (section.x > max_x) max_x = section.x;
        });
        this.x = max_x + this.width;
      }
    }
  }


  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function setupGround(): void {
    shuffleArray(colors);
    const sectionWidth = canvas.width / colors.length;
    for (let i = 0; i < colors.length; i++) {
      groundSections.push(new GroundSection(i * sectionWidth, sectionWidth, colors[i]));
    }
    groundSections.push(new GroundSection(canvas.width, sectionWidth, "grey")); // Grey section
  }

  function updateScoreDisplay(): void {
    scoreElement.textContent = score.toString();
    timer += 1;
  }

  function updateTimerDisplay(): void {
    timerElement.textContent = timer.toFixed(1) + "s";
  }


  function checkColorMatch(ballX: number, ballColor: string): void {
    const ballCenterX = ballX + 20; // Assuming the radius of the ball is 20

    // @ts-ignore
    const groundSection = groundSections.find(section =>
      ballCenterX >= section.x && ballCenterX < section.x + section.width);

    if (groundSection && groundSection.color === ballColor) {
      score += 10;
      updateScoreDisplay();

      // Increase ground speed after every 300 points
      if (Math.floor(score / 300) > Math.floor((score - 10) / 300)) {
        groundSpeed += 0.1;
      }
    }
  }

  function updateNextBallDisplay() {
    nextBallDisplay.style.backgroundColor = nextBallColor;
    // nextBallDisplay.t = nextBallColor.toUpperCase();
  }

  function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    groundSections.forEach(section => section.draw());
    balls.forEach(ball => ball.draw());
  }

  function update(time: number): void {
    if (!gameRunning) return;

    const deltaTime = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    timer -= deltaTime;
    if (timer <= 0) {
      gameOver();
      return;
    }

    balls.forEach(ball => ball.update(deltaTime * 1000)); // Convert deltaTime back to milliseconds for ball update
    groundSections.forEach(section => section.update());
    balls = balls.filter(ball => !ball.remove);
    draw();
    updateTimerDisplay(); // Update the timer display
    requestAnimationFrame(update);
  }

  function startGame(): void {
    gameRunning = true;
    timer = startingTime;
    score = 0;
    groundSpeed = 1; // Reset ground speed to default
    updateScoreDisplay();
    updateTimerDisplay();
    lastFrameTime = performance.now();
    requestAnimationFrame(update);
    startButton.style.display = 'none';
  }

  function gameOver(): void {
    gameRunning = false;
    gameOverMenu.style.display = 'flex';
  }


  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', () => {
    gameOverMenu.style.display = 'none';
    startGame();
  });

  function canThrowNewBall(): boolean {
    return balls.every(ball => ball.stopped);
  }

  canvas.addEventListener('click', (event: MouseEvent) => {
    if (!canThrowNewBall() || !gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    balls.push(new Ball(x, y));
  });

  setupGround();
  updateNextBallDisplay();
  updateTimerDisplay();
  startMenu.style.display = 'block';
