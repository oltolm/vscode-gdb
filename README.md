# GDB DAP

This extension requires at least [GDB](https://sourceware.org/gdb/) 15.2.

You can get GDB for Windows from <https://github.com/ssbssa/gdb> or from [MSYS2](https://www.msys2.org/).

# Launch configuration
* `args`: If provided, this should be an array of strings. These strings are provided as command-line arguments to the inferior, as if by set args. See Arguments.
* `cwd`: If provided, this should be a string. GDB will change its working directory to this directory, as if by the cd command (see Working Directory). The launched program will inherit this as its working directory. Note that change of directory happens before the program parameter is processed. This will affect the result if program is a relative filename.
 * `env`: If provided, this should be an object. Each key of the object will be used as the name of an environment variable; each value must be a string and will be the value of that variable. The environment of the inferior will be set to exactly as passed in. See Environment.
* `program`: If provided, this is a string that specifies the program to use. This corresponds to the file command. See Files.
* `stopAtBeginningOfMainSubprogram`: If provided, this must be a boolean. When ‘True’, GDB will set a temporary breakpoint at the program’s main procedure, using the same approach as the start command. See Starting.
* `stopOnEntry`: If provided, this must be a boolean. When ‘True’, GDB will set a temporary breakpoint at the program’s first instruction, using the same approach as the starti command. See Starting.

# Attach configuration
* `pid`: The process ID to which GDB should attach. See Attach.
* `program`: If provided, this is a string that specifies the program to use. This corresponds to the file command. See Files. In some cases, GDB can automatically determine which program is running. However, for many remote targets, this is not the case, and so this should be supplied.
* `target`: The target to which GDB should connect. This is a string and is passed to the target remote command. See Connecting.
