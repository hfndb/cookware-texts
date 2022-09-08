# Imported files and packages

## Files

Some generic files in this program were 'imported' aka copied from another project I created and maintain; [cookware-headless-ice](https://github.com/hfndb/cookware-headless-ice). These files are:
+ src/generic/config.mjs
+ src/generic/log.mjs
+ src/generic/object.mjs
+ src/generic/sys.mjs
+ src/generic/utils.mjs
+ src/generic/store/file-system/dirs.mjs
+ src/generic/store/file-system/files.mjs

Generic file(s) from [cookware-texts](https://github.com/hfndb/cookware-texts):
+ src/generic/queue.mjs
+ src/generic/store/file-system/lock.mjs


## Packages

Via these generic files, dependencies came into this project:
+ [array-sort](https://www.npmjs.com/package/array-sort)
+ [colors](https://www.npmjs.com/package/colors) for colored console output
+ [date-and-time](https://www.npmjs.com/package/date-and-time) to format and manipulate dates and times
+ [deep-diff](https://www.npmjs.com/package/deep-diff) to check and display overridden settings in project settings.json
+ [fdir](https://www.npmjs.com/package/fdir) to scan directories and files
+ [log-symbols](https://www.npmjs.com/package/log-symbols) for icons in console output
+ [q-i](https://www.npmjs.com/package/q-i) to display a colored and formatted version of objects with json structure
+ [shelljs](https://www.npmjs.com/package/shelljs) for Linux-like commands, made portable to Windows
