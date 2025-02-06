# @vramework/ws

## 0.6.3

### Patch Changes

- 0a92fa7: refactor: pulling schema into seperate package since ajv doesnt work on cloudflare (also keeps bundle size small!)
- Updated dependencies [0a92fa7]
  - @vramework/core@0.6.7

## 0.6.2

### Patch Changes

- 09fc52c: feat: adding cloudflare and lambda websockets
  breaking change: moved subscription from channel to services and renamed to event hub
- adecb52: feat: changes required to get cloudflare functions to work
- Updated dependencies [09fc52c]
- Updated dependencies [adecb52]
  - @vramework/core@0.6.3

## 0.6.1

### Patch Changes

- adeb392: feat: more channel improvements, and adding bubble option to runners to avoid all the empty try catches
- Updated dependencies [ed45ca9]
- Updated dependencies [adeb392]
  - @vramework/core@0.6.2

## 0.6

Marking a major release to include channels and scheduled tasks

## 0.5.6

### Patch Changes

- d2f8edf: feat: adding channelId to channels for serverless compatability
- Updated dependencies [662a6cf]
- Updated dependencies [c8578ea]
- Updated dependencies [d2f8edf]
  - @vramework/core@0.5.29

## 0.5.5

### Patch Changes

- 886a2fb: refactor: moving singletons (like routes and channels) to global to avoid nodemodule overrides
- 886a2fb: fix: making core routes global to avoid state overrides
- Updated dependencies [a768bad]
- Updated dependencies [886a2fb]
- Updated dependencies [886a2fb]
  - @vramework/core@0.5.28

## 0.5.4

### Patch Changes

- ab42f18: chore: upgrading to next15 and dropping pages support
- Updated dependencies [ab42f18]
  - @vramework/core@0.5.26

## 0.5.3

### Patch Changes

- 0f96787: refactor: dropping cjs support
- 64e4a1e: refactor: seperating core into cleaner sub-packages
- c23524a: refactor: bump to versions to ensure correct package usage
- Updated dependencies [0f96787]
- Updated dependencies [64e4a1e]
- Updated dependencies [c23524a]
  - @vramework/core@0.5.25

## 0.5.2

### Patch Changes

- 8e8e816: fix: including missing packages

## 0.5.1

### Patch Changes

- bba25cc: chore: updating all packages to reflect major changes
- ee0c6ea: feat: adding ws server
- Updated dependencies [bba25cc]
- Updated dependencies [9deb482]
- Updated dependencies [ee0c6ea]
  - @vramework/core@0.5.24
