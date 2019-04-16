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
        this.recursiveCount = 0;

        this.run(this.rootDir);
    }

    async run(root) {
        const rootStat = await stat(root);

        if (!(rootStat.isDirectory())) {
            return;
        }

        const dirs = await readdir(root);

        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            const fullpath = path.join(root, dir);

            const st = await stat(fullpath);

            if (st.isDirectory()) {
                this.recursiveCount++;
                await this.run(fullpath);
                this.recursiveCount--;
            } else {
                st.filepath = fullpath;
                this.stream.push(st);
            }

            await this.counter();
        }

        if (this.recursiveCount === 0) {
            this.stream.emit("end");
            this.stream.destroy();
        }
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