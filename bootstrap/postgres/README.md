This is a WIP for how you can tie all the features in vramework together.

Most likely will park this in favour of opensourcing (https://elsahafy.com/) except with english support to showcase how you can run write an app that be 
either deployed on a machine or run for development or deployed fully using serverless without having to change a line of code. This is a bit like running express
via serverless except much leaner. 

Plus theres a whole ton of other features like:
- Simple but powerfuly route based permissions API
- inferred json schemas based on API typescript singature
- session management (APIKey / Auth heads / Cookies / JWT)
- local and serverless file uploading / downloading 
- postgres crud APIs that ties that validate/autocast against database columns
- postgres transactional session management
- audit logs on all tables within a schema out of the box
- elastic search integration when deploying via serverless

