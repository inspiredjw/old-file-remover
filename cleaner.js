const fs = require('fs');
const path = require('path');
const readdirp = require('readdirp');

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

const now = Date.now();

// MODIFY THESE VALUES
const DIRECTORY_NAME = path.join(__dirname, 'files');
const FILES_PER_CYCLE = 100; // 100 files read
const CYCLE_INTERVAL = 1000; // milliseconds

const TIME_AGO_TO_EXPIRE = 2 * WEEK; // 2 weeks

const stream = readdirp({
  root: DIRECTORY_NAME,
  fileFilter: '*.*',
});

// Run
let count = 0;
let willBeRemoved = 0;
let removed = 0;
stream
  .on('data', ({ fullPath: filepath, stat }) => {
    count++;

    // Remove old files
    if (now - stat.atimeMs >= TIME_AGO_TO_EXPIRE) {
      willBeRemoved++;
      process.nextTick(() => {
        fs.unlink(filepath, err => {
          if (err) {
            console.error('file removal error: ', err);
          }
          console.log(`Removed with throttled ${FILES_PER_CYCLE} items per cycle: ${filepath}`);
          removed++;
        });
      });
    }

    // Pause and resume the stream per cycle
    if (count % FILES_PER_CYCLE === 0) {
      stream.pause();

      setTimeout(() => {
        stream.resume();
      }, CYCLE_INTERVAL);
    }
  })
  .on('warn', err => {
    console.warn(err);
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

