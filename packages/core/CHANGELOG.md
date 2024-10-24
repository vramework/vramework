## 0.0.18 - 05.09.2022

## 0.5.2

### Patch Changes

- 5e0f033: feat: adding a routes map output file to support frontend sdks in the future

## 0.5.1

### Patch Changes

- 97900d2: fix: exporting plugins from default barrel files
- d939d46: refactor: extracting nextjs and fastify to plugins
- 45e07de: refactor: renaming packages and vramework structure

## 0.4.7

### Patch Changes

- ddaf58f: feat: adding hostname to servers

## 0.4.6

### Patch Changes

- 2a2402b: republish since something went wrong

## 0.4.5

### Patch Changes

- c73afd6: this should have been published..

## 0.4.4

### Patch Changes

- 0650348: fix: export schemas using \*
- 1a708a7: refactor: renaming VrameworkCLIConfig back to VrameworkConfig
  feat: adding .end() to vramework response for servers that need it
- 642d370: fix: adding schema error logs on fail

## 0.4.3

### Patch Changes

- 94f8a74: fix: finalizing cjs and esm packages

## 0.4.2

### Patch Changes

- 28f62ea: refactor: using cjs and esm builds!
- 14783ee: fix: including all types as dependencies to avoid users needing to install them

feat: adding a maximum compute time for better error handling on lambda timeouts

## 0.0.17 - 24.08.2022

fix: use error name instead of constructor for better management of instanceof

## 0.0.10 - 21.07.2022

feat: add a transform session call incase jwt provided belongs to a third-party like aws cognito

## 0.0.9 - 26.06.2022

chore: Upgrading dependencies

## 0.0.6 - 13.04.2022

chore: Upgrading dependencies

## 0.0.5 - 19.02.2022

chore: Upgrading dependencies

## 0.0.4 - 26.09.2021

feat: Adding writeFile, readFile and deleteFile APIs

## 0.0.3 - 02.09.2021

chore: Updating dependencies

## 0.0.2 - 02.08.2021

Fix: deleting files with correct path in local files

## 0.0.1 - 27.07.2021

Fix: Using global space for schemas as it appears to not always return the same file

## 23.07.2021

### Initial Release

A package that contains vramework types
