---
'@vramework/express-middleware': patch
'@vramework/fastify-plugin': patch
'@vramework/fastify': patch
'@vramework/uws-handler': patch
'@vramework/aws-services': patch
'@vramework/uws': patch
'@vramework/azure-functions': patch
'@vramework/lambda': patch
'@vramework/jose': patch
'@vramework/pino': patch
'@vramework/next': patch
'@vramework/schema-ajv': patch
'@vramework/ws': patch
'@vramework/schedule': patch
'@vramework/core': patch
---

refactor: pulling schema into seperate package since ajv doesnt work on cloudflare (also keeps bundle size small!)
