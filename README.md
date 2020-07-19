# CAPUnit.com v6

The event and unit management site for Civil Air Patrol

Current units running the CAPUnit suite:

1. [MD001 - Maryland Wing](https://md001.capunit.com/)
2. [MD089 - St. Mary's Composite Squadron](https://md089.capunit.com/)
3. [MD008 - Harford Composite Squadron](https://md008.capunit.com/)
4. [MD003 - Frederick Composite Squadron](https://md003.capunit.com/)
5. [MD007 - Calvert Cadet Squadron](https://md007.capunit.com/)

## Requirements for building and running

In order to build and run the code for production, you will need Docker installed

## Server configuration

This program depends on the following to fully function:

1. A [MySQL server](#mysql-setup) (required)
2. An [sFTP server](#sftp-setup) (required)
3. [AWS SMTP credentials](#aws-setup) (required)
4. A [Discord bot token](#discord-bot-setup) (optional)

To help with setup, see [building the CLI utilities.](#building-the-cli-utilities)

### MySQL setup

The MySQL server has to be installed, have the [X Plugin enabled](https://dev.mysql.com/doc/refman/8.0/en/x-plugin.html), a database created, and a user who can manage that database.

Once the user is created, fill in the appropriate configuration variables in `server/.env.default`, and copy the configured file to `util-cli/.env` and `server/.env`

Run `util-cli/dist/databseSetup.js`

### sFTP setup

### AWS setup

1. [Acquire AWS credentials](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)
2. Manage the IAM user created to allow access to SMTP
3. Store the AWS credentials in `server/.env`

### Discord bot setup

1. [Create a bot and get its token](https://discordpy.readthedocs.io/en/latest/discord.html).
2. Store this token in the `server/.env`

## Building the server

In the repository directory, build the docker image:

`docker build --tag capunit-com .`

When you change the server configuration, you will have to run this command again

## Building the CLI utilities

1. In the `util-cli` directory, run `npm install --no-package-lock`

## Running the server

As it is a docker image, you can just run the following:

`docker run --publish 3001:3001 -d --name capunit-com capunit-com:1.0`
