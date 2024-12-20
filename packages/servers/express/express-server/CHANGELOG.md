# @vramework/express

## 0.6.1

### Patch Changes

- c459ef5: fix: provide the express-middleware as part of server dependencies
- Updated dependencies [dee2e9f]
  - @vramework/core@0.6.1

## 0.6

Marking a major release to include channels and scheduled tasks

## 0.5.9

### Patch Changes

- 886a2fb: refactor: moving singletons (like routes and channels) to global to avoid nodemodule overrides
- 886a2fb: fix: making core routes global to avoid state overrides
- Updated dependencies [a768bad]
- Updated dependencies [886a2fb]
- Updated dependencies [886a2fb]
  - @vramework/core@0.5.28
  - @vramework/express-middleware@0.5.12

## 0.5.8

### Patch Changes

- 0f96787: refactor: dropping cjs support
- 64e4a1e: refactor: seperating core into cleaner sub-packages
- c23524a: refactor: bump to versions to ensure correct package usage
- Updated dependencies [0f96787]
- Updated dependencies [64e4a1e]
- Updated dependencies [c23524a]
  - @vramework/core@0.5.25
  - @vramework/express-middleware@0.5.10

## 0.5.7

### Patch Changes

- bba25cc: chore: updating all packages to reflect major changes
- Updated dependencies [bba25cc]
- Updated dependencies [9deb482]
- Updated dependencies [ee0c6ea]
  - @vramework/core@0.5.24
  - @vramework/express-middleware@0.5.9

## 0.5.6

### Patch Changes

- effbb4c: doc: adding readme to all packages
- Updated dependencies [effbb4c]
  - @vramework/express-middleware@0.5.6
  - @vramework/core@0.5.10

## 0.5.5

### Patch Changes

- 725723d: docs: adding typedocs
- Updated dependencies [3541ab7]
- Updated dependencies [725723d]
  - @vramework/core@0.5.9
  - @vramework/express-middleware@0.5.5

## 0.5.4

### Patch Changes

- 8d85f7e: feat: load all schemas on start optionally instead of validating they were loaded
- Updated dependencies [1876d7a]
- Updated dependencies [8d85f7e]
  - @vramework/core@0.5.8
  - @vramework/express-middleware@0.5.4

## 0.5.3

### Patch Changes

- 3b51762: refactor: not using initialize call to core
- Updated dependencies [3b51762]
  - @vramework/express-middleware@0.5.3

## 0.5.2

### Patch Changes

- 0e1f01c: refactor: removing cli config from servers entirely'

## 0.5.1

### Patch Changes

- 97900d2: fix: exporting plugins from default barrel files
- d939d46: refactor: extracting nextjs and fastify to plugins
- 45e07de: refactor: renaming packages and vramework structure
- Updated dependencies [97900d2]
- Updated dependencies [d939d46]
- Updated dependencies [45e07de]
  - @vramework/core@0.5.1
  - @vramework/express-middleware@0.5.1
