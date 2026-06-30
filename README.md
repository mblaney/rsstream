RSStream is a local first web application that uses a distributed database in
the browser called [Holster](https://github.com/mblaney/holster). The server
runs a [Node.js](https://nodejs.org) app that listens for feed updates from
[Dobrado](https://dobrado.net) and pushes updates to the browser.

### Server

Copy this repo to a new directory and run:

 - `cd server`
 - `npm install`

Before running the server code, you need to create a host account. This is done
using the [Holster-router](https://github.com/mblaney/holster-router) package.
See the README in that project for setup instructions, then set the environment
variables listed below.

After you've created the account start the server with:
 - `node app.js`

For development this will run a server at localhost:3000, you will need to build
the front end so that it can be served, see the browser instructions below.

For production you can start with pm2:

 - `npm install pm2 -g`
 - `export NODE_ENV=production`
 - `pm2 startup` (And follow startup instructions.)
 - `pm2 start app.js --node-args="--max-old-space-size=1536"`
 - `pm2 save`

This will save your environment in `~/.pm2/dump.pm2` so that it can be used on
restarts, note that you need to run `pm2 unstartup` followed by the `pm2`
commands listed above if you modify any required environment variables.

#### Private endpoints

- `POST /private/update-feed-limit` - Update the maximum number of feeds an
  account can subscribe to. Required parameters: `code` and `limit`.

See [Holster-router](https://github.com/mblaney/holster-router) for
the full list of account management endpoints.

#### Environment variables

RSStream reads these and passes them through to Holster-router's `routerAdmin`
options:

| Variable | Description |
|---|---|
| `HOLSTER_USER_NAME` | Host account username |
| `HOLSTER_USER_PASSWORD` | Host account password |
| `HOST_STORAGE_LIMIT` | Storage limit in MB written to `.user_limit.json` on startup |
| `APP_HOST` | Server URL used in email links and stored on account data |
| `MAIL_FROM` | Sender address for outgoing email. If not set, email content is logged instead |
| `MAIL_BCC` | BCC address copied on outgoing invite request emails |
| `FEDERATED_HOSTS` | Comma-separated list of other holster-router servers to check for duplicate invite codes |

#### External configuration

RSStream relies on Dobrado for its feed processing, which is accessed via its
API. You can set it up on a subdomain and then access it via the `ADD_FEED_URL`,
`ADD_FEED_ID` and `ADD_FEED_API_KEY` environment variables. Dobrado then pushes
updates back to RSStream via the `/private/add-item` and `/private/remove-feed`
endpoints, so it will also need to be configured with the RSStream url, username
and password.

### Browser

The front end is served from the `browser/build` directory, which uses
[Vite](https://vite.dev) as the build tool. The build directory is not
included in the repo, so after cloning you will need to build it:

 - `cd browser`
 - `npm install`
 - `npm run build`

If you modify the front end you can rebuild it by running `npm run build`
from the `browser` directory.

If you would like to contribute please run: `npx prettier app.js --write` from
the server directory, or `npx prettier src --write` from the browser directory.
