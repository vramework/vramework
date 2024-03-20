CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA "app";

--- JWT ---
CREATE SEQUENCE "app".jwt_secret_seq START 1 INCREMENT 1;
CREATE TABLE "app"."jwt_secret" ( 
  "keyid" text PRIMARY KEY NOT NULL DEFAULT nextval('"app".jwt_secret_seq'::text), 
  "secret" text NOT NULL
);
INSERT INTO "app".jwt_secret ("secret") VALUES ('the-ultimate-secret');

--- Enums
CREATE TABLE "app"."user" ( 
  "user_id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "last_updated_at" timestamp DEFAULT now() NOT NULL,
  "email" text UNIQUE NOT NULL, 
  "emails_sent" int NOT NULL DEFAULT 0,
  "last_email_sent_at" timestamp
);
