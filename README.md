# Pikku

Welcome to **Pikku**, a lightweight, TypeScript-powered framework that normalizes all the different ways you can interact with Node.js servers today.

You can see the documentation on [pikku.dev](https://pikku.dev)

## Brief Introduction

Pikku is designed to simplify the development of Node.js servers by providing a unified approach to handling different types of interactions. It leverages TypeScript's static typing and modern JavaScript features to offer a developer-friendly experience.

At the core of Pikku is the `APIFunction`. This function interacts with services created at server start-up (and some that are unique to a session). It handles the data it was invoked with—without needing to know whether it came from params, query, or body—and accesses the user session if the route is authenticated.

Think of it like a multi-tool that simplifies handling different types of data sources, so you don't have to worry about where the data is coming from, how to authenticate or permission against it, or if it's valid — Pikku takes care of all that for you.

## Features

- **Unified API Handling**: Simplify data handling across params, query, and body.
- **TypeScript Support**: Leverage static typing for better code quality and developer experience.
- **Flexible Integrations**: Works with Express, Fastify, uWS, Nest, and Next.js.
- **HTTP Client**: Use `@pikku/fetch` for validated API calls.
- **OpenAPI Documentation**: Automatically generate OpenAPI docs for your server routes.
- **Modular Design**: Easily integrate with existing servers using middleware and plugins.

## Getting Started

### Installation

```bash
# Installation
yarn
# Type checking
yarn tsc
# Builds
yarn build
# Changeset (for PRs)
yarn changeset
# Lint
yarn lint
# Prettify code
yarn prettier
```
