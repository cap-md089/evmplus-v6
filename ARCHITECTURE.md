# High level overview of EvMPlus code and package management

1. `apis`
	The APIs package is mostly a data packge, and contains a tree representation of the REST API that can be compiled down into data that allows for JavaScript code to easily determine how to properly call the API specified
2. `auto-api-tests`
	auto-api-tests contains different Jest tests that check that the validator "macro" works
3. `auto-client-api`
	Contains the ttypescript transforms that allow for the generation of the following:
	- Schema validators (validate input JSON based off of TypeScript types)
	- Client API endpoint definitions (take an interface and convert it into a function that calls `fetch` with all the appropriate types)
	- Server API endpoint definitions (take the same interface and allow for defining a function in a way that is closer to RPC than regular HTTP)
4. `client`
	Contains the fat client that will be sent to clients
	Generates all of the HTML that presents all the information to users, as well as calling all of the HTTP routes to acquire data to properly generate the HTML
	Additionally, the client has its own architecture:
	- `components`
		Contains general use components that may not be specific to a single page
		- `dialogues`
			Contains different components that allow for the management of modal dialogues
		- `drive`
			Contains components which display file information, and sometimes allow for modification of file information
		- `flightassign`
			Components that belong to the flight assignment admin page
		- `form-inputs`
			Different inputs (e.g. TextInput, ListEditor) that can be used to construct forms
		- `forms`
			Contains the actual form management component as well as some premade forms, such as AttendanceForm, EventForm, and TeamForm
		- `page-elements`
			General components which make up structure outside of the scope of pages of the website
	- `lib`
		Contains general, non JSX code that performs a function to handle local client data, or perform a function like uploading files
	- `pages`
		Contains different components that are mapped to different URL routes, for instance the main page at the route `/`
		- `account`
			Contains pages which are used to manage personal accounts, such as registration, MFA, signing in
		- `admin`
			Contains the different widgets on the admin page as well as pages that can be accessed under the `/admin` URL or from the admin page
			- `pages`
				Contains the different administration functions
			- `pluggables`
				The widgets that show up on the Admin page
		- `calendars`
			Contains the mobile and desktop calendars
		- `drive`
			Contains the Google Drive clone UI
		- `events`
			Contains the pages that facilitate the management of events
		- `legal`
			Contains legal notifications like the Privacy Policy and Terms and Conditions
		- `quizzer`
			Contains a CAPR 39-3 quiz for color guard competitions
		- `team`
			Similar to events, provides pages to manage and view teams
5. `common-lib`
	Contains pure, data functions that allow for the manipulation of data structures and provides common algorithms to ensure that things are computed the same on both the server and the client, e.g. permissions for an event
	- `lib`
		Contains most of the data manipulation functions for the general data types
		- `AsyncEither`
			A backbone type used by all of the server that is essentially a promise with better error handling. Replaces Promise.
	- `renderers`
		Provides functions to generate the layout for PDF or XLSX documents or notifications given certain data
	- `test`
		Contains useful functions for writing tests
	- `typings`
		Contains all of the interfaces and enums that the website uses
		- `api`
			Holds different interfaces that describe APIs. These APIs are standardized in a way that allows for the auto-client-api macros to generate client and server code to provide typechecking for an RPC like interface
6. `discord-bot`
	Provides the code that manages a Discord bot for use in different CAP Discord servers
	- `cli`
		CLI interface used for creating commands such as setupServer or updateServer
	- `commands`
		An in-Discord interface that interacts with the bot and provides the ability to execute commands within the context of a Discord server
	- `data`
		Utility functions for managing users and server data
7. `server`
	This is the package that defines a HTTP interface using Express that is exposed to the internet (or rather, to Nginx)
	- `api`
		This folder contains all of the files that represent the different RPC functions in accordance with the APIs defined in `typings/api` in `common-lib`
	- `lib`
		Some extra library functions which are designed for working with express, such as error handling or wrapping cookie data
8. `server-common`
	Consists of database APIs that should be used instead of direct interaction with the database
	- `capwatch-modules`
		Functions for importing each of the files in a CAPWATCH download
	- `member`
		- `members`
			Contains code for operating on member data types
		- `pam`
			Functions for the management of user sessions
9. `server-jest-config`
	Provides the ability to run unit tests for the server based packages
10. `util-cli`
	Implements command line scripts to help with the management of services