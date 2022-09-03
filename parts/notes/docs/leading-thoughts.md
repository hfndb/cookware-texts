# Leading thoughts

While me was leading me, **before** shaping and structuring this program, I was thinking about imagery, requirements. Leading thoughts became:

+ Reading notes from disk to memory, could have a lower priority than writing from memory to disk.
+ For reading from and writing to disk, the function of a [scribe](https://en.wikipedia.org/wiki/Scribe) (kinda monk) will be used. For determining file names the function of a 'manager'. As an independent, I don't like the seemingly religious idea of personnel. But thinking about that... when you dig into your memory for notes, where does divine information come from? The deeper inside, the more likely that false prophets are not actively involved 😄
+ [Vendor lock-in](https://en.wikipedia.org/wiki/Vendor_lock-in) by using a propriety [file format](https://en.wikipedia.org/wiki/File_format) should remain taboo.
+ Using [SQL-language](https://en.wikipedia.org/wiki/SQL) should remain taboo too, otherwise this program would 'smell and taste' too much like a database.
+ This program should not only work within one process, but also with multiple processes running. Even in a situation like [distributed computing](https://en.wikipedia.org/wiki/Distributed_computing) in which this program would behave like a [distributed database](https://en.wikipedia.org/wiki/Distributed_database) or [distributed data store](https://en.wikipedia.org/wiki/Distributed_data_store).
+ Generated workload for processor, memory, hard disk, network should not become excessive. Every bit counts and may be too much. Compression while reading and writing should be optional.
+ Avoiding known [file formats](https://en.wikipedia.org/wiki/File_format) could be too much of a wish. As a first setup, a plugin for handling [tsv files](https://en.wikipedia.org/wiki/Tab-separated_values) will be added. Other plugins for other formats can be added at will.
+ In order to minimize reading from disk, standardized reports can be generated, triggered by [cron](https://en.wikipedia.org/wiki/Cron) for a server, or an anarchist version of cron for a workstation, [anacron](https://en.wikipedia.org/wiki/Anacron) or [fcron](https://en.wikipedia.org/wiki/Fcron).
+ Niceties like HTML reports using templates and creating PDF versions of those should remain in queue until 'groundwork' of this program is sufficiently robust, stable.
