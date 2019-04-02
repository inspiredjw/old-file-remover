const fs = require('fs');
const path = require('path');
const FileWalker = require('./file-walker');

// const DIRECTORY_NAME = path.join('D:\\', 'temp', 'ExtensionHost', 'content');
const DIRECTORY_NAME = path.join(__dirname, 'files');

const fw = new FileWalker(DIRECTORY_NAME, {
    fileCountCycle: 200,
    intervalBetweenFileCountCycle: 100,
    highWaterMark: 30,
    objectMode: true,
});

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

const now = Date.now();

const TIME_AGO_TO_EXPIRE = 2 * WEEK; // 2 weeks

// Run
let count = 0;
let willBeRemoved = 0;
let removed = 0;
fw.stream
    .on('data', stat => {
        // Remove old files
        if (now - stat.atimeMs >= TIME_AGO_TO_EXPIRE) {
            fw.stream.pause();
            willBeRemoved++;

            process.nextTick(() => {
                fs.unlink(stat.filepath, err => {
                    if (err) {
                        console.error('file removal error: ', err);
                    }
                    console.log(`Removed: ${stat.filepath}`);
                    removed++;
                    fw.stream.resume();
                });
            });
        }
    })
    .on('error', err => {
        console.error(err);
    })
    .on('end', () => {
        const removalCheck = setInterval(() => {
            if (willBeRemoved === removed) {
                clearInterval(removalCheck);
                console.log(`${removed} outdated files are removed`);
            }
        }, 100);
    });
