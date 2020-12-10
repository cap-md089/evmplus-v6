# EvMPlus.org v6

The premiere event and unit management site for Civil Air Patrol

Current units running the EventManagement+ suite:

1. [MD089 - St. Mary's Composite Squadron](https://md089.evmplus.org/)
2. [MD008 - Harford Composite Squadron](https://md008.evmplus.org/)
3. [MD003 - Frederick Composite Squadron](https://md003.evmplus.org/)

## Requirements for building and running

In order to build and run the code for production, you will need Docker installed

## Server configuration

This program depends on the following to fully function:

1. A [MySQL server](#mysql-setup) (required)
2. An [sFTP server](#sftp-setup) (required)
3. [AWS SMTP credentials](#aws-setup) (required)
4. [Google keys and calendar setup](#google-setup) (required)
5. A [Discord bot token](#discord-bot-setup) (optional)

To help with setup, see [building the CLI utilities.](#building-the-cli-utilities)

### MySQL setup

The MySQL server has to be installed, have the [X Plugin enabled](https://dev.mysql.com/doc/refman/8.0/en/x-plugin.html), a database created, and a user who can manage that database.

Once the user is created, fill in the appropriate configuration variables in `server/.env.default`, and copy the configured file to `util-cli/.env` and `server/.env`

Run `util-cli/dist/databaseSetup.js`

### sFTP setup

The following instructions will be for a Linux server

1. On the Linux server, create the desired user to store information
2. Create a SSL public and private key pair with the following command:

    `ssh-keygen -b 2048 -f filestore_access_key`

3. Copy the contents of `filestore_access_key.pub` to `~/.ssh/authorized_keys` in the user folder for the user created before
4. Ensure the SSL key is accessible to the server process.
    - If you are not using Docker, configure `server/.env` to point to the new SSL key
    - If you are using Docker, make sure `REMOTE_DRIVE_KEY_FILE` points to the new SSL key when running `docker build` and is in the repository - The 'keys' directory is ignored, so it is suggested to create the 'keys' directory and place the file in there

### AWS setup

1. [Acquire AWS credentials](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)
2. Manage the IAM user created to allow access to SMTP
3. Store the AWS credentials in `server/.env`

### Google setup

1. Service account setup
    1. Go to [the Google Cloud console](https://console.cloud.google.com/)
    2. Create a new project
    3. In the navigation menu, go to 'APIs & Services' -> 'Library'
    4. Find the Google Calendar API, and enable it
    5. In the navigation menu, go to 'IAM & Admin' -> 'Service accounts'
    6. Click 'Create service account' at the top
    7. Give it a name, and give it 'Project Owner' as a role
    8. Don't grant access to any users
    9. Back at the 'Service accounts' page, in the actions menu on the right, click 'Create key'
    10. Select JSON
    11. Save this to a google-keys directory accessible to the built docker image
        - Be sure to name it according to the following format: `${accountID}.json`, where accountID is the ID of the account you will be creating later
2. Google calendar setup
    1. Create two Google calendars, one to send to your Wing and one to use for local squadron use
    2. On each calendar, add the service account from before with the ability to 'Manage Events and Sharing'
    3. Copy the IDs of these Google calendars, they will be needed for the account setup step later

### Discord bot setup

1. [Create a bot and get its token](https://discordpy.readthedocs.io/en/latest/discord.html).
2. Store this token in the `server/.env`

## Building the CLI utilities

1. In the `util-cli` directory, run `npm install --no-package-lock`

## Building the server

In the repository directory, build the docker image:

`docker build --build-arg REMOTE_DRIVE_KEY_FILE=keys/drive-ssl-key --tag evmplus.org .`

When you change the server configuration, you will have to run this command again

## Running the server

As it is a docker image, you can run the following:

`docker run -rm --name=evmplus.org --restart=always -v /google-keys:/google-keys -p 80:3001 evmplus.org:latest`

The target of the virtual bind must be `/google-keys`; this must be a virtual mount as the Google keys change and has to persist between changes in images

### Creating an account and supplying it data

When you have all the parts together, you can run the `util-cli/dist/createAccount.js` file to create your squadron account

Once the account is created, you will need to run `util-cli/dist/importCapwatch.js` to load squadron data, providing a path to a CAPWATCH file downloaded from [here](https://www.capnhq.gov/cap.capwatch.web/splash.aspx).

**Note: this has to be done on a Linux machine.**

### Accessing the site

To access the site, you have to use a domain name that starts with the account ID you used earlier. For instance, to access the `md089` account, you would go to `md089.evmplus.org`.

## Alternatively...

If you are a unit commander or unit IT officer looking to implement this for your squadron, you can instead send an email to `eventsupport@md.cap.gov` to request an official EvMPlus.org website.

This will take advantage of the hosting and support already available, and will allow for cross unit communication with units already established under the EvMPlus.org domain.

There are no hosting fees that come with requesting an account. Regarding how to upload CAPWATCH data through the hosted option, currently an encrypted CAPWATCH file can be sent via email to `eventsupport@md.cap.gov` with the password sent via another channel established during account setup.

There is currently a feature request being worked on which will allow you as a unit commander or unit IT officer to upload your own CAPWATCH data to a evmplus.org hosted unit. [This feature request can be tracked here.](https://github.com/cap-md089/evmplus-v6/issues/48)

## Developing EvMPlus.org

The development requirements for EvMPlus.org are a bit different. The server will require the same configuration and external services as a production system, but the keys and database do not need to be the same.

1. Install required software
    - Node 13
    - Yarn
    - [Commitizen](https://github.com/commitizen/cz-cli)
    - Git
2. In the project directory, run `yarn install`
3. The environment should be set up to code
    - To start the webpack development server, go into `packages/client` and run `yarn start` to start developing the client code
    - To develop the server and its sub modules, go into the module after making changes and run `yarn run build`
    - The server will need to be started when developing the client
