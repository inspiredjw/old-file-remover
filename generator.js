const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const Promise = require('bluebird');
const Utimes = require('@ronomon/utimes');

const nFolders = 100;
const itemsPerDir = 100;
const timeAgo = 1000 * 60 * 60 * 24 * 30;
const getTimeAgoTimestamp = (now = Date.now(), ago = timeAgo) => now - ago;
const directoryName = 'files';

(async () => {
  // clean up first
  rimraf.sync(path.join(__dirname, directoryName));
  console.log('files cleaned up');

  // create directory
  const rootDirPath = path.join(__dirname, directoryName);
  if (!fs.existsSync(rootDirPath)) {
    fs.mkdirSync(rootDirPath);
  }

  // generate files
  const oldTime = getTimeAgoTimestamp();
  const oldTime2 = getTimeAgoTimestamp(Date.now(), 1000 * 60);
  for (let i = 0; i < nFolders; i++) {
    // create a folder
    const dirPath = path.join(rootDirPath, `folder-${i}`);
    if (!fs.existsSync(dirPath)) {
      console.log(dirPath);
      fs.mkdirSync(dirPath);
    }

    // generate items
    for (let j = 0; j < itemsPerDir; j++) {
      const filepath = path.join(dirPath, `file-${j}.dummy`);
      console.log(filepath);
      fs.writeFileSync(filepath, ' ');
      const utimeSetPromise = Promise.defer();
      const t = j % 2 === 0 ? oldTime2 : oldTime;
      Utimes.utimes(
        filepath,
        t, // create time
        t, // modified time
        t, // access time
        () => {
          utimeSetPromise.resolve();
        },
      );
      await utimeSetPromise.promise;
    }
  }

  console.log(`${nFolders * itemsPerDir} files are created with ${timeAgo} ms ago from current time`);
})();
