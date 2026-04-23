// @ts-check

export {};
let width = 0;
let height = 0;
/** @type {Bird[]} */
let birds = [];
/** @type {Bird[]} */
let other_birds = [];

addEventListener('message', ({ data }) => {
    switch (data.type) {
        case 'start': {
            ({ width, height } = data);

            while (birds.length < data.birds) {
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
                    `rgb(${random(0, 255)},${random(0, 255)},${random(
                        0,
                        255
                    )})`,
                    size
                );
                birds.push(bird);
            }
            break;
        }
        case 'update': {
            const { mouse, chicken, neighbors } = data;
            other_birds = neighbors;
            const response = [];
            for (const bird of birds) {
                bird.update(mouse.x, mouse.y, chicken.x);
                response.push(bird);
            }
            postMessage(response);
            break;
        }
    }
});

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

const MIN_SIZE = 15;
const MAX_SIZE = 25;
const MIN_VELOCITY = -3;
const MAX_VELOCITY = 3;

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
    #last_other_birds = other_birds;
    /** @type {Bird[] | null} */
    #last_neighbors = null;

    get neighbors() {
        if (
            this.#last_neighbors === null ||
            this.#last_other_birds !== other_birds
        ) {
            this.#last_other_birds = other_birds;
            this.#last_neighbors = [...birds, ...other_birds]
                .toSorted((a, b) => distance(this, a) - distance(this, b))
                .filter(bird => bird !== this);
        }
        return this.#last_neighbors;
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
        const visual_neighbors = this.neighbors
            .values()
            .filter(neighbor => distance(this, neighbor) < radius);
        for (const neighbor of visual_neighbors) {
            center_x += neighbor.x;
            center_y += neighbor.y;
        }
        const array = visual_neighbors.toArray();
        if (array.length > 0) {
            center_x /= array.length;
            center_y /= array.length;
            return {
                x: center_x,
                y: center_y
            };
        }
        return {
            x: this.x,
            y: this.y
        };
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

        for (const bird of this.neighbors
            .values()
            .filter(neighbor => distance(this, neighbor) < min_distance)) {
            move_x += this.x - bird.x;
            move_y += this.y - bird.y;
        }

        this.velocity_x += move_x * avoidance;
        this.velocity_y += move_y * avoidance;

        let avg_velocity_x = 0;
        let avg_velocity_y = 0;
        const neighbors = this.neighbors
            .values()
            .filter(
                neighbor =>
                    distance(this, neighbor) < 0.05 * Math.min(width, height)
            );
        for (const neighbor of neighbors) {
            avg_velocity_x += neighbor.velocity_x;
            avg_velocity_y += neighbor.velocity_y;
        }
        const array = neighbors.toArray();
        if (array.length > 0) {
            avg_velocity_x /= array.length;
            avg_velocity_y /= array.length;
            this.target(avg_velocity_x, avg_velocity_y, 0.005);
        }
    }

    /**
     * @param {number} mouse_x
     * @param {number} mouse_y
     * @param {number} chicken_x
     */
    update(mouse_x, mouse_y, chicken_x) {
        this.ticks++;
        this.target_center();
        this.analyze_neighbors();
        this.avoid(mouse_x, mouse_y, 0.5, 125, 125);
        this.avoid(chicken_x, height * 0.95, 0.05, 60);
        this.velocity_x = clamp(this.velocity_x, MIN_VELOCITY, MAX_VELOCITY);
        this.velocity_y = clamp(this.velocity_y, MIN_VELOCITY, MAX_VELOCITY);
        const margin = 100;
        if (this.x > width - margin) {
            this.velocity_x--;
        }
        if (this.x < margin) {
            this.velocity_x++;
        }
        if (this.y > height - margin) {
            this.velocity_y--;
        }
        if (this.y < margin) {
            this.velocity_y++;
        }
        if (this.x + this.size >= width) {
            this.velocity_x = -this.velocity_x;
        }
        if (this.y + this.size >= height) {
            this.velocity_y = -this.velocity_y;
        }
        if (this.y - this.size <= 0) {
            this.velocity_y = -this.velocity_y;
        }
        if (this.x - this.size <= 0) {
            this.velocity_x = -this.velocity_x;
        }
        this.x += this.velocity_x;
        this.y += this.velocity_y;
        const speed =
            Math.abs(Math.max(this.velocity_x, this.velocity_y)) / MAX_VELOCITY;
        this.color = `rgb(${100 * speed + 55}, ${100 * speed + 25}, ${
            155 * speed + 100
        })`;
    }
}

// setInterval(() => {
//     const size = random(MIN_SIZE, MAX_SIZE);
//     let velocity_x = random(-7, 7);
//     let velocity_y = random(-7, 7);
//     while (velocity_x * velocity_y === 0) {
//         velocity_x = random(-7, 7);
//         velocity_y = random(-7, 7);
//     }
//     const bird = new Bird(
//         random(0 + size, width - size),
//         random(0 + size, height - size),
//         velocity_x,
//         velocity_y,
//         `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`,
//         size
//     );
//     birds.push(bird);
// }, 10000);
