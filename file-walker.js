const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

function delay(ms) {
    return new Promise(_ => setTimeout(_, ms));
}

class FileWalker {
    constructor(rootDir, options) {
        this.rootDir = rootDir;
        this.options = {
            fileCountCycle: 100,
            intervalBetweenFileCountCycle: 100,
            highWaterMark: 5,
            objectMode: true,
            ...options,
        };
        this.stream = new Readable({
            read(size) {
            },
            highWaterMark: this.options.highWaterMark,
            objectMode: this.options.objectMode,
        });
        this.count = 0;

        this.run();
    }

    async run() {
        const dirs = await readdir(this.rootDir);

        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            const fulldir = path.join(this.rootDir, dir);
            const files = await readdir(fulldir);

            for (let j = 0 ; j < files.length; j++) {
                const file = files[j];
                const fullfile = path.join(fulldir, file);
                const st = await stat(fullfile);
                st.filepath = fullfile;
                this.stream.push(st);

                await this.counter();
            }
            await this.counter();
        }

        this.stream.emit("end");
        this.stream.destroy();
    }

    async counter() {
        this.count++;
        if (this.count % this.options.fileCountCycle === 0) {
            this.stream.pause();
            await delay(this.options.intervalBetweenFileCountCycle);
            this.stream.resume();
        }
    }
}

module.exports = FileWalker;