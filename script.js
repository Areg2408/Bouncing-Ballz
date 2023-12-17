var canvas = document.getElementById('gravityCanvas');
var ctx = canvas.getContext('2d');
var scoreElement = document.getElementById('score');
var nextBallDisplay = document.getElementById('nextBall');
var timerElement = document.getElementById('timer');
var startMenu = document.getElementById('startMenu');
var gameOverMenu = document.getElementById('gameOverMenu');
var startButton = document.getElementById('startButton');
var restartButton = document.getElementById('restartButton');
var colors = ["red", "green", "blue", "yellow", "red", "green", "blue", "yellow"];
var gravity = 0.5;
var groundHeight = 30;
var groundSpeed = 1;
var score = 0;
var timer = 5;
var startingTime = 5;
var lastFrameTime = performance.now();
var nextBallColor = colors[Math.floor(Math.random() * colors.length)];
var balls = [];
var groundSections = [];
var gameRunning = false;
var Ball = /** @class */ (function () {
    function Ball(x, y) {
        this.x = x;
        this.y = y;
        this.velocityY = 0;
        this.radius = 20;
        this.dampening = 0.6; // Adjusted dampening for more bounce
        this.hasScored = false;
        this.stopped = false; // Indicates if the ball has stopped
        this.remove = false; // Flag to mark the ball for removal
        this.color = nextBallColor; // Use the upcoming color
        nextBallColor = colors[Math.floor(Math.random() * colors.length)]; // Set next color
        updateNextBallDisplay();
    }
    Ball.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    };
    Ball.prototype.update = function (deltaTime) {
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
            }
            else {
                this.hasScored = false;
            }
        }
    };
    return Ball;
}());
var GroundSection = /** @class */ (function () {
    function GroundSection(x, width, color) {
        this.x = x;
        this.width = width;
        this.color = color;
    }
    GroundSection.prototype.draw = function () {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, canvas.height - groundHeight, this.width, groundHeight);
    };
    GroundSection.prototype.update = function () {
        this.x -= groundSpeed;
        if (this.x + this.width < 0) {
            var max_x_1 = 0;
            groundSections.forEach(function (section) {
                if (section.x > max_x_1)
                    max_x_1 = section.x;
            });
            this.x = max_x_1 + this.width;
        }
    };
    return GroundSection;
}());
function shuffleArray(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
    }
}
function setupGround() {
    shuffleArray(colors);
    var sectionWidth = canvas.width / colors.length;
    for (var i = 0; i < colors.length; i++) {
        groundSections.push(new GroundSection(i * sectionWidth, sectionWidth, colors[i]));
    }
    groundSections.push(new GroundSection(canvas.width, sectionWidth, "grey")); // Grey section
}
function updateScoreDisplay() {
    scoreElement.textContent = score.toString();
    timer += 1;
}
function updateTimerDisplay() {
    timerElement.textContent = timer.toFixed(1) + "s";
}
function checkColorMatch(ballX, ballColor) {
    var ballCenterX = ballX + 20; // Assuming the radius of the ball is 20
    // @ts-ignore
    var groundSection = groundSections.find(function (section) {
        return ballCenterX >= section.x && ballCenterX < section.x + section.width;
    });
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
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    groundSections.forEach(function (section) { return section.draw(); });
    balls.forEach(function (ball) { return ball.draw(); });
}
function update(time) {
    if (!gameRunning)
        return;
    var deltaTime = (time - lastFrameTime) / 1000;
    lastFrameTime = time;
    timer -= deltaTime;
    if (timer <= 0) {
        gameOver();
        return;
    }
    balls.forEach(function (ball) { return ball.update(deltaTime * 1000); }); // Convert deltaTime back to milliseconds for ball update
    groundSections.forEach(function (section) { return section.update(); });
    balls = balls.filter(function (ball) { return !ball.remove; });
    draw();
    updateTimerDisplay(); // Update the timer display
    requestAnimationFrame(update);
}
function startGame() {
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
function gameOver() {
    gameRunning = false;
    gameOverMenu.style.display = 'flex';
}
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', function () {
    gameOverMenu.style.display = 'none';
    startGame();
});
function canThrowNewBall() {
    return balls.every(function (ball) { return ball.stopped; });
}
canvas.addEventListener('click', function (event) {
    if (!canThrowNewBall() || !gameRunning)
        return;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    balls.push(new Ball(x, y));
});
setupGround();
updateNextBallDisplay();
updateTimerDisplay();
startMenu.style.display = 'block';
