// @ts-check
// setup canvas

const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('canvas'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

// function to generate random number

/**
 * @param {number} min
 * @param {number} max
 */
function random(min, max) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}

/**
 * @param {number} x
 * @param {number} min
 * @param {number} max
 */
function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

/**
 * @param {Bird} a
 * @param {Bird} b
 */
function distance(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} center_x
 * @param {number} center_y
 * @param {number} angle
 * @returns {[number, number]}
 */
function rotate(x, y, center_x, center_y, angle) {
    return [
        center_x + (x - center_x) * Math.cos(angle) - (y - center_y) * Math.sin(angle),
        center_y + (x - center_x) * Math.sin(angle) + (y - center_y) * Math.cos(angle)
    ]
}

const MIN_SIZE = 15;
const MAX_SIZE = 25;
const MIN_VELOCITY = -5;
const MAX_VELOCITY = 5;
let mouse_x = 0;
let mouse_y = 0;
addEventListener('mousemove', e => {
    mouse_x = e.clientX;
    mouse_y = e.clientY;
});
class Bird {
    /** @type {number} */
    x;
    /** @type {number} */
    y;
    /** @type {number} */
    velocity_x;
    /** @type {number} */
    velocity_y;
    /** @type {string} */
    color;
    /** @type {number} */
    size;
    ticks = 0;

    get neighbors() {
        return birds.toSorted((a, b) => distance(this, a) - distance(this, b)).filter(ball => ball !== this);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} velocity_x
     * @param {number} velocity_y
     * @param {string} color
     * @param {number} size
     */
    constructor(x, y, velocity_x, velocity_y, color, size) {
        this.x = x;
        this.y = y;
        this.velocity_x = velocity_x;
        this.velocity_y = velocity_y;
        this.color = color;
        this.size = size;
    }

    draw() {
        const path = new Path2D();
        const angle = Math.atan2(this.velocity_y, this.velocity_x) + Math.PI / 2;
        // ctx.beginPath();
        ctx.fillStyle = this.color;
        path.moveTo(...rotate(this.x, this.y - (this.size / 1.5), this.x, this.y, angle));
        path.lineTo(...rotate(this.x + this.size / 2, this.y + this.size / 2, this.x, this.y, angle));
        path.lineTo(...rotate(this.x - this.size / 2, this.y + this.size / 2, this.x, this.y, angle));
        path.lineTo(...rotate(this.x, this.y - (this.size / 1.5), this.x, this.y, angle));
        // ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size * (Math.sin(this.ticks / 15) * 1.1), this.size);
        // ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill(path);
        // ctx.font = '15px sans-serif';
        // ctx.fillStyle = 'white';
        // ctx.fillText('hello', this.x, this.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} factor
     */
    target(x, y, factor) {
        this.velocity_x += (x - this.velocity_x) * factor;
        this.velocity_y += (y - this.velocity_y) * factor;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} factor
     */
    avoid(x, y, factor, max_x = Infinity, max_y = Infinity) {
        if (Math.abs(this.x - x) > max_x) {
            return;
        }
        if (Math.abs(this.y - y) > max_y) {
            return;
        }
        this.velocity_x += (this.x - x) * factor;
        this.velocity_y += (this.y - y) * factor;
    }

    /**
     * @param {number} radius
     */
    get_center(radius) {
        let center_x = width / 2;
        let center_y = height / 2;
        const visual_neighbors = this.neighbors.filter(neighbor => distance(this, neighbor) < radius);
        for (const neighbor of visual_neighbors) {
            center_x += neighbor.x;
            center_y += neighbor.y;
        }
        if (visual_neighbors.length > 0) {
            center_x /= visual_neighbors.length;
            center_y /= visual_neighbors.length;
            return {
                x: center_x,
                y: center_y
            }
        }
        return {
            x: this.x,
            y: this.y
        }
    }

    target_center() {
        const center = this.get_center(50);
        this.target(center.x, center.y, 0.00005);
    }

    analyze_neighbors() {
        const min_distance = 50;
        const avoidance = 0.1;

        let move_x = 0;
        let move_y = 0;

        for (const bird of this.neighbors.filter(neighbor => distance(this, neighbor) < min_distance)) {
            move_x += this.x - bird.x;
            move_y += this.y - bird.y;
        }

        this.velocity_x += move_x * avoidance;
        this.velocity_y += move_y * avoidance;

        let avg_velocity_x = 0;
        let avg_velocity_y = 0;
        const neighbors = this.neighbors.filter(neighbor => distance(this, neighbor) < 0.05 * Math.min(width, height));
        for (const neighbor of neighbors) {
            avg_velocity_x += neighbor.velocity_x;
            avg_velocity_y += neighbor.velocity_y;
        }

        if (neighbors.length > 0) {
            avg_velocity_x /= neighbors.length;
            avg_velocity_y /= neighbors.length;
            this.target(avg_velocity_x, avg_velocity_y, 0.005);
        }
    }

    update() {
        this.ticks++;
        this.target_center();
        this.analyze_neighbors();
        this.avoid(mouse_x, mouse_y, 0.5, 125, 125);
        this.velocity_x = clamp(this.velocity_x, MIN_VELOCITY, MAX_VELOCITY);
        this.velocity_y = clamp(this.velocity_y, MIN_VELOCITY, MAX_VELOCITY);
        const margin = 100;
        if (this.x > (width - margin)) {
            this.velocity_x--;
        }
        if (this.x < margin) {
            this.velocity_x++;
        }
        if (this.y > (height - margin)) {
            this.velocity_y--;
        }
        if (this.y < margin) {
            this.velocity_y++;
        }
        if ((this.x + this.size) >= width) {
            this.velocity_x = -this.velocity_x;
        }
        if ((this.y + this.size) >= height) {
            this.velocity_y = -this.velocity_y;
        }
        if ((this.y - this.size) <= 0) {
            this.velocity_y = -this.velocity_y;
        }
        if ((this.x - this.size) <= 0) {
            this.velocity_x = -this.velocity_x;
        }
        this.x += this.velocity_x;
        this.y += this.velocity_y;
        const speed = Math.abs(Math.max(this.velocity_x, this.velocity_y)) / MAX_VELOCITY;
        this.color = `rgb(${100 * speed + 55}, ${100 * speed + 25}, ${155 * speed + 100})`;
    }
}

/** @type {Bird[]} */
let birds = [];

while (birds.length < 150) {
    const size = random(MIN_SIZE, MAX_SIZE);
    let velocity_x = random(-7, 7);
    let velocity_y = random(-7, 7);
    while (velocity_x * velocity_y === 0) {
        velocity_x = random(-7, 7);
        velocity_y = random(-7, 7);
    }
    const bird = new Bird(
        random(0 + size, width - size),
        random(0 + size, height - size),
        velocity_x,
        velocity_y,
        `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`,
        size
    );
    birds.push(bird);
}

const [chicken, flipped_chicken] = await fetch('./chicken.png').then(res => res.blob()).then(async res => {
    const bitmap = await createImageBitmap(res);
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const image_data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    for (let i = 0; i < bitmap.height; i++) {
        const section = image_data.data.slice(bitmap.width * 4 * i, bitmap.width * 4 * (i + 1));
        const pixels = [];
        const new_section = new Uint8Array(section.length);
        for (let j = 0; j < section.length / 4; j++) {
            const pixel = [];
            for (let n = 0; n < 4; n++) {
                pixel.push(section[j * 4 + n]);
            }
            pixels.push(pixel);
        }
        console.log(pixels);
        const reversed = pixels.toReversed();
        new_section.set(reversed.flat(), 0);
        image_data.data.set(new_section, bitmap.width * 4 * i);
    }
    ctx?.putImageData(image_data, 0, 0);
    canvas.remove();
    return [
        bitmap,
        await createImageBitmap(image_data)
    ]
});
let chicken_x = width / 2;
let direction = 4;

function loop() {
    // ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, width, height);
    for (const bird of birds) {
        bird.update();
        bird.draw();
    }
    ctx.drawImage(direction < 0 ? flipped_chicken : chicken, chicken_x, height * 0.92, 50, 50 * 783 / 515);
    if (chicken_x > (width - 50) || chicken_x < 50) {
        direction = -direction;
    }
    chicken_x += direction;
    // for (const ball of balls) {
    //     ball.draw();
    // }

    requestAnimationFrame(loop);
}

loop();

export {};