const canvas = /** @type {HTMLCanvasElement} */ (
    document.querySelector('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

const pool = create_worker_pool(250, 50);

/**
 * @param {number} bird_count
 */
function create_worker_pool(bird_count, max_birds_per_worker) {
    const workers = [];
    let save = 75;
    /** @type {Map<Worker, { tick: number; birds: any[]; history: Map<number, any[]> }>} */
    const worker_data = new Map();
    for (let i = 0; i < bird_count / max_birds_per_worker; i++) {
        const worker = new Worker('./worker.js', { type: 'module' });
        worker.postMessage({
            type: 'start',
            birds: max_birds_per_worker,
            width,
            height
        });
        worker_data.set(worker, {
            tick: 0,
            birds: [],
            history: new Map([[0, []]])
        });
        worker.addEventListener('message', event => {
            const data = worker_data.get(worker);
            data.history.set(++data.tick, event.data);
            if (data.history.size > save) {
                const to_remove = data.history.keys().filter(key => key < data.tick - save);
                for (const key of to_remove) {
                    data.history.delete(key);
                }
            }
            data.birds = event.data;
        });
        workers.push(worker);
    }
    function on_response(handler) {
        const response = [];
        let queue = workers.length - 1;
        for (const worker of workers) {
            worker.addEventListener(
                'message',
                event => {
                    response.push(...event.data);
                    queue--;
                    if (queue === 0) {
                        handler(response);
                    }
                },
                { once: true }
            );
        }
    }
    const latest = () => {
        const min_tick = Math.min(...worker_data.values().map(({ tick }) => tick));
        return worker_data.values().flatMap(({ history }) => history.get(min_tick)).toArray();
    }
    return {
        send: message => {
            const min_tick = Math.min(...worker_data.values().map(({ tick }) => tick));
            for (const worker of workers) {
                const ticks_behind = worker_data.get(worker).tick - min_tick;
                if (save < ticks_behind + 50) {
                    save += (ticks_behind - save) / 2;
                }
                // console.log(save, ticks_behind);
                const birds = [];
                for (const [key, value] of worker_data) {
                    if (key === worker) {
                        continue;
                    }
                    birds.push(...value.history.get(min_tick));
                }
                worker.postMessage({
                    ...message,
                    neighbors: birds
                });
            }
        },
        get latest() {
            return latest();
        },
        on_response,
        await_response: handler => {
            const { promise, resolve } = Promise.withResolvers();
            on_response(response => {
                handler(response);
                resolve();
            });
            return promise;
        }
    };
}

let mouse_x = 0;
let mouse_y = 0;
addEventListener('mousemove', e => {
    mouse_x = e.clientX;
    mouse_y = e.clientY;
});

const [chicken, flipped_chicken] = await fetch('./chicken.png')
    .then(res => res.blob())
    .then(async res => {
        const bitmap = await createImageBitmap(res);
        const canvas = document.createElement('canvas');
        document.body.append(canvas);
        const ctx = /** @type {CanvasRenderingContext2D} */ (
            canvas.getContext('2d')
        );
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(bitmap, 0, 0);
        const image_data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        canvas.remove();
        return [bitmap, await createImageBitmap(image_data)];
    });

let chicken_x = width / 2;
let direction = 4;

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
        center_x +
            (x - center_x) * Math.cos(angle) -
            (y - center_y) * Math.sin(angle),
        center_y +
            (x - center_x) * Math.sin(angle) +
            (y - center_y) * Math.cos(angle)
    ];
}

let update_message = {
    type: 'update',
    chicken: {
        x: 0,
        y: height * 0.92
    },
    mouse: {
        x: 0,
        y: 0
    }
}
function update() {
    update_message.chicken.x = chicken_x;
    update_message.mouse.x = mouse_x;
    update_message.mouse.y = mouse_y;
    pool.send(update_message);
}

pool.send(update());

function loop() {
    // ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, width, height);
    for (const { size, x, y, color, velocity_x: dx, velocity_y: dy } of pool.latest) {
        const path = new Path2D();
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        // ctx.beginPath();
        ctx.fillStyle = color;
        path.moveTo(...rotate(x, y - size / 1.5, x, y, angle));
        path.lineTo(...rotate(x + size / 2, y + size / 2, x, y, angle));
        path.lineTo(...rotate(x - size / 2, y + size / 2, x, y, angle));
        path.lineTo(...rotate(x, y - size / 1.5, x, y, angle));
        // ctx.rect(x - size / 2, y - size / 2, size * (Math.sin(ticks / 15) * 1.1), size);
        // ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill(path);
    }
    ctx.drawImage(
        direction < 0 ? flipped_chicken : chicken,
        chicken_x,
        height * 0.92,
        50,
        (50 * 783) / 515
    );
    if (chicken_x > width - 50 || chicken_x < 50) {
        direction = -direction;
    }
    chicken_x += direction;
    pool.send(update());
    requestAnimationFrame(loop);
}

loop();
