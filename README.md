# Diskette

Diskette makes it easy to package game assets, stream those assets for your web game into a smart local cache system if available, and let you start gameplay before all the content has finished downloading. Diskette in the future will easily work with ThreeJS, EaselJS, SoundJS, and other audio/visual browser systems.

[![Build Status](https://drone.io/github.com/mzgoddard/diskettejs/status.png)](https://drone.io/github.com/mzgoddard/diskettejs/latest)

## Install

When ready, it'll be published in NPM or Bower. It has a script that runs in Node (and may get a grunt plugin and connect middleware) but its primary use is as a asset manager in the browser.

## Test

`npm test` will run jshint and testem in continue integration mode, booting a chrome and firefox window to run unittests.

## Road Map

### 0.1

- Support a development mode that loads files normally from the server.
- `convert` executable script that takes a list of files or a config file with those files listed and outputs a series of blocks that are sections of all the files concatenated as one large tape along with a metadata file for that tape. In the future this format could be structured.
- Support loading the metadata file and tape.
- Write the loaded tape data into separate values in an IndexedDB ObjectStore named after the config or metadata file.
- Read the data from that ObjectStore.
- The IndexedDB Database will be dumped on every page load.
- Multiple Diskettes will increment the IDB Database Version

### Future

- Don't chuck local data if the metadata is the same as last load.
- Check lastModified values of the metadata and upload only those changes.
- FileSystem API alternative to IDB for Chrome.

## Change Log

Nothing yet.
