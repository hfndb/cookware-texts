# Notes

Notes is a lightweight [Node.js](https://en.wikipedia.org/wiki/Node.js) program (roughly 100 KB) to do something like making notes in order to retrieve those later. Not in a psyche, in memory, but in a computer. Simple, you might think.

However, not using a known [file format](https://en.wikipedia.org/wiki/File_format) or even some [database](https://en.wikipedia.org/wiki/Database) seems a taboo in view of massive infections with the 'having it easy' virus. Within this taboo area, I have used another than customary approach for preserving notes. Which also resulted in other terms, another vocabulary.

This is a **preview** of a project which is currently in the phase of active architecturing and developing. By me, since there can only be one for now.

**Project status**: Adding notes, write them from memory to disk, read them from disk to memory is finished. Updating and deleting what's already on disk still needs to be added.

## Translations

| Term             | In database terms                                     |
| ---------------- | ----------------------------------------------------- |
| Topic            | Set of tables, catalog, schema                        |
| Structure        | Table structure                                       |
| Note             | Record, row                                           |
| Part             | Column, field                                         |
| Variant          | Data type or table type (lookup or interaction)       |


Other:
+ 'Save' or 'update' became 'retain' as in retaining a note.
+ 'Open' or something like a [Select](https://en.wikipedia.org/wiki/Select_%28SQL%29) in SQL language became 'scan' as in scanning notes.

Yes, I agree. Only using other terms, words, doesn't make a program really different. In which way this program is really different than others, I for now preserve as a mystery 😄


## Variants

|                  | Remarks                                               |
| ---------------- | ----------------------------------------------------- |
| boolean          |                                                       |
| float            |                                                       |
| integer          | Autoincrement as default value included               |
| string           | Unlimited lenght like blog or text in a database      |
| date             | Now as default value and 'last updated' included      |
| datetime         | Idem dito                                             |
| array            |                                                       |
| object           |                                                       |


## Operatives

If you would view Notes as a composed organization with employees, the following operatives are active within that organization. Each of them as a 'class of their own', a profession, a specialist:

|                  | Tasks                                                                |
| ---------------- | -------------------------------------------------------------------- |
| In sight while using:                                                                   |
|                                                                                         |
| Inquirer         | Manages scanning notes and collecting report data                    |
|                                                                                         |
| Out of sight while using:                                                               |
|                                                                                         |
| Manager          | Manages file names for writing to disk, and reading                  |
| Transformer      | Transforms a note for writing to disk, and back after reading        |
|                                                                                         |
| Scribe           | A 'department' consisting of 3 operatives; Reader, Writer en Merger: |
| Reader           | Reads from the file system                                           |
| Writer           | Writes to the file system                                            |
| Merger           | Merges files generated in one or more file systems                   |


From a philosophical point of view: Several operatives within one organization acting 'together as one'. From another perspective; an independent who acts alone can be seen as one whole, or as somebody with specific parts of thinking.

From a psychological point of view: In a Culture of Users, some aiming to use others, a life is considered a 'usable' or 'ignorable' though both a 'disposable', whereby parts of that life which cannot be used from the outside will be ignored. Which of those two parts are truly valuable is a matter of perspective.

Viewed like this, philosophy from the outside can interfere with truth within a psyche like a [jammer](https://en.wikipedia.org/wiki/Jammer), a signal blocking device. What's really true is not the primary question.


## Howto

Instead of documenting in the usual way, some howto's have been added to this project as functional code examples. Which have also been used to run tests. Howto's can be found in the directory src/store/notes/howto:

+ [structure.mjs](./src/store/notes/howto/structure.mjs): Shows how to create a Topic with one or more Structures during project configuration.
+ [usage.mjs](./src/store/notes/howto/usage.mjs): Shows how to handle notes and use Inquirer after a Topic and Structures are created.
+ [cron.mjs](./src/store/notes/howto/cron.mjs): Shows how to initiate automated tasks (maintainance, reporting) using [cron](https://en.wikipedia.org/wiki/Cron).


## Read more
+ [Leading thoughts](./docs/leading-thoughts.md) before and while shaping and structuring this program
+ [Imported files and packages](./docs/imported-files-and-packages.md)
