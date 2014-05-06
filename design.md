## user facing

### Diskette
- promise

#### set config
- config( '/path.json' ) promise
- fromdir( '/path' ) promise

#### raw data
- read( path, type ) promise
- url( path ) promise
- blob( path ) promise
- array( path ) promise

#### css and json with paths in the diskette replaced with urls to data in diskette
+ plugin( name, pluginFn ) this
- file( path, [filterFn] ) promise
- css( path, [filterFn] ) promise
- dom( path, [filterFn] ) promise
- json( path, [filterFn] ) promise

## internals

### DisketteLoad
+ getInstance() DisketteLoad
- load( path, format ) promise
DisketteNodeLoad
DisketteXHRLoad

### DisketteBlockRange
+ constructor( blockPromise, start, end )
<!-- promise of the given region in the parent blockPromise -->
- promise
- start
- end

### DisketteFileConfig

### DisketteConfig
- definition( path ) promise
- promise promise
DisketteDevConfig
DisketteTapeConfig
DisketteMultiConfig

### DisketteFileHandler
<!-- Write ranges to store. -->
+ constructor( storeFile, ranges )
- ranges
- promise

### DisketteStoreFile
- init() this
- setMeta( obj ) this
- getMeta() obj
- append( content ) this
- promise

### DisketteStore
+ constructor( config )
- file( path ) StoreFile
- deleteFile( path )
- config

DisketteMemoryStore
DisketteIndexedDBStore
DisketteFileSystemStore
