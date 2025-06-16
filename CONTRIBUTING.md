# Contributing to EvMPlus

1. [Code of Conduct](#code-of-conduct)
2. [Your First Code Contribution](#your-first-code-contribution)
    1. [Local Development](#local-development)
3. [Commits and Pull Requests](#pull-requests)

## Code of Conduct

This project and its contributions are governed by the [code of conduct](https://github.com/cap-md089/evmplus-v6/blob/master/CODE_OF_CONDUCT.md). All contributions are expected to be in line with this code.

## Your First Code Contribution

Unsure where to begin? Start by taking a look at [ARCHITECTURE.md](https://github.com/cap-md089/evmplus-v6/blob/master/ARCHITECTURE.md), and then look for issues labeled [`good first issue`](https://github.com/cap-md089/evmplus-v6/issues?q=is:issue+is:open+label:%22good+first+issue%22).

### Local Development

The software requirements for developing EvMPlus are the same as for running it in a production environment; Docker and docker-compose. It is highly recommended that you enable Docker BuildKit to build the development environment and for other builds. All of the same configuration that the production environment uses is needed, with the exception of the AWS DNS setup.

To develop Event Manager, first download a copy of this repository and create an initial build of the repository:

```
git pull https://github.com/cap-md089/evmplus-v6.git
cd evmplus-v6
git checkout development
docker-compose -f docker-compose.dev.yml up dev-setup
```

Then, you will need to configure the server with all of the same configuration options the production system needs, with the exception of the `aws_ssl_keys` file

To download CAPWATCH data to help with testing, run `docker-compose -f docker-compose.dev.yml up capwatch_update`

To start the main server and client, run `docker-compose -f docker-compose.dev.yml up -d main client_dev_server`

To build the code and watch for changes while developing, run `docker-compose -f docker-compose.dev.yml up -d build-watch`

To use either the mysqlsh or util-cli command line utilities, run `docker-compose -f docker-compose.dev.yml run mysqlsh` or `docker-compose -f docker-compose.dev.yml run util-cli` respectively.

## Commits and Pull Requests

Commits are to be styled using the conventional changelog style. This can be made easier by installing the commitizen utility globally, e.g. `npm install --global commitizen`.

All pull requests must be a single commit and address a single issue (see [how to squash commits](https://stackoverflow.com/questions/5189560/squash-my-last-x-commits-together-using-git)). Each commit will have to be tested before it can be merged, so adding unit tests, while not required at this time, are recommended. Unit tests will eventually become mandatory as they become more standardized. All branches and pull requests should be of the format `$username/issue$issueNumber`, where `$username` is your name and `$issueNumber` is the appropriate issue which the pull request is addressing.

### Testing

In order to run automated unit tests, run `yarn test` from the root of the project

To watch and re-run server-common unit tests, run `docker-compose -f docker-compose.test.yml run watch-server-common-test`