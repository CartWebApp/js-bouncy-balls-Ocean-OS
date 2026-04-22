// // setup canvas

// const canvas = document.querySelector('canvas');
// const ctx = canvas.getContext('2d');

// const width = (canvas.width = window.innerWidth);
// const height = (canvas.height = window.innerHeight);

// // function to generate random number

// /**
//  * @param {number} min
//  * @param {number} max
//  */
// function random(min, max) {
//     const num = Math.floor(Math.random() * (max - min + 1)) + min;
//     return num;
// }

// function clamp(x, min, max) {
//     return Math.min(Math.max(x, min), max);
// }

// const MIN_SIZE = 15;
// const MAX_SIZE = 25;

// class Ball {
//     /** @type {number} */
//     x;
//     /** @type {number} */
//     y;
//     /** @type {number} */
//     velocity_x;
//     /** @type {number} */
//     velocity_y;
//     /** @type {string} */
//     color;
//     /** @type {number} */
//     size;
//     /** @type {Ball | null} */
//     last_collision = null;
//     clone_debounce = 100;
//     last_clone = 0;
//     ticks = 0;
//     dead = false;

//     constructor(x, y, velocity_x, velocity_y, color, size) {
//         this.x = x;
//         this.y = y;
//         this.velocity_x = velocity_x;
//         this.velocity_y = velocity_y;
//         this.color = color;
//         this.size = size;
//     }

//     draw() {
//         ctx.beginPath();
//         ctx.fillStyle = this.color;
//         ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
//         ctx.fill();
//     }

//     update() {
//         this.ticks++;
//         if (+this.size.toFixed(2) === 0) {
//             const size = random(MIN_SIZE, MAX_SIZE);
//             let velocity_x = random(-7, 7);
//             let velocity_y = random(-7, 7);
//             while (velocity_x * velocity_y === 0) {
//                 velocity_x = random(-7, 7);
//                 velocity_y = random(-7, 7);
//             }
//             Object.assign(this, new Ball(
//                 random(0 + size, width - size),
//                 random(0 + size, height - size),
//                 velocity_x,
//                 velocity_y,
//                 `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`,
//                 size
//             ));
//         }
//         if ((this.x + this.size) >= width) {
//             this.velocity_x = -this.velocity_x;
//         }
//         if ((this.y + this.size) >= height) {
//             this.velocity_y = -this.velocity_y;
//         }
//         if ((this.y - this.size) <= 0) {
//             this.velocity_y = -this.velocity_y;
//         }
//         if ((this.x - this.size) <= 0) {
//             this.velocity_x = -this.velocity_x;
//         }
//         this.x += this.velocity_x;
//         this.y += this.velocity_y;
//         // this.x += this.velocity_x * Math.sin(this.x - width / 2);
//         // this.y += this.velocity_y * Math.sin(this.y - height / 2);
//         this.velocity_x *= 0.99999999;
//         this.velocity_y *= 0.99999999;
//         this.size *= 0.999;
//     }

//     collision_detect() {
//         let collided = false;
//         for (const ball of balls) {
//             if (ball === this || this.last_collision === ball || ball.last_collision === this) {
//                 continue;
//             }
//             const dx = this.x - ball.x;
//             const dy = this.y - ball.y;
//             const distance = Math.sqrt(dx * dx + dy * dy);
//             if (distance < this.size + ball.size) {
//                 collided = true;
//                 this.last_collision = ball;
//                 if (this.ticks - this.last_clone > this.clone_debounce) {
//                     if (Math.max(this.size, ball.size) < MIN_SIZE) {
//                         // ball.dead = true;
//                         // this.dead = true;
//                         this.last_clone = this.ticks;
//                         ball.last_clone = ball.ticks;
//                         const child = new Ball(this.x, this.y, Math.max(this.velocity_x, ball.velocity_x), Math.max(this.velocity_y, ball.velocity_y), this.color, Math.min(this.size, ball.size) * 1.5);
//                         child.last_clone = child.last_clone;
//                         balls.push(child);
//                     } else {
//                         if (this.size > MAX_SIZE || ball.size > MAX_SIZE) {
//                             this.dead = true;
//                             ball.dead = true;
//                         }
//                         this.last_clone = this.ticks;
//                         ball.last_clone = ball.ticks;
//                         const child = new Ball(this.x, this.y, random(-7, 7), random(-7, 7), this.color, this.size * 0.75);
//                         child.last_clone = child.last_clone;
//                         balls.push(child);
//                     }
//                 }
//                 // ball.collided = true;
//                 // balls.push(child);
//                 ball.color = this.color = `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`;
//                 this.velocity_x = -this.velocity_x;
//                 this.velocity_y = -this.velocity_y;
//                 ball.velocity_x = -ball.velocity_x;
//                 ball.velocity_y = -ball.velocity_y;
//                 this.velocity_x *= 1.0001;
//                 this.velocity_y *= 1.0001;
//                 ball.velocity_x *= 1.0001;
//                 ball.velocity_y *= 1.0001;
//                 this.velocity_x = clamp(this.velocity_x, -7, 7);
//                 this.velocity_y = clamp(this.velocity_y, -7, 7);
//                 ball.velocity_x = clamp(ball.velocity_x, -7, 7);
//                 ball.velocity_y = clamp(ball.velocity_y, -7, 7);
//                 this.size *= 1.00001;
//             }
//         }
//         if (!collided) {
//             this.last_collision = null;
//         }
//     }
// }

// let balls = [];

// while (balls.length < 25) {
//     const size = random(MIN_SIZE, MAX_SIZE);
//     let velocity_x = random(-7, 7);
//     let velocity_y = random(-7, 7);
//     while (velocity_x * velocity_y === 0) {
//         velocity_x = random(-7, 7);
//         velocity_y = random(-7, 7);
//     }
//     const ball = new Ball(
//         random(0 + size, width - size),
//         random(0 + size, height - size),
//         velocity_x,
//         velocity_y,
//         `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`,
//         size
//     );
//     balls.push(ball);
// }

// function loop() {
//     // ctx.clearRect(0, 0, width, height);
//     ctx.fillStyle = 'rgba(0,0,0,0.25)';
//     ctx.fillRect(0, 0, width, height);
//     for (const ball of balls) {
//         ball.update();
//     }
//     for (const ball of balls) {
//         ball.collision_detect();
//     }
//     balls = balls.filter(ball => !ball.dead);
//     for (const ball of balls) {
//         ball.draw();
//     }

//     requestAnimationFrame(loop);
// }

// loop();
