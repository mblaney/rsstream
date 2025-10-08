RSStream is a local first web application that uses a distributed database in
the browser called [Holster](https://github.com/mblaney/holster). The server
runs a [Node.js](https://nodejs.org) app that listens for feed updates from
[Dobrado](https://dobrado.net) and pushes updates to the browser.

### Server

Copy this repo to a new directory and run:

 - `cd server`
 - `npm install`

Before running the server code, you need to create a host account. This isn't
done within the app because it's possible for Holster to create multiple
accounts under the same username. This needs to be avoided because all account
data is stored under a single host account.

To create the host account you can use the Node [REPL](https://nodejs.org/en/learn/command-line/how-to-use-the-nodejs-repl), which is also great for inspecting
your Holster data via the API:

```
const {default: Holster} = await import("@mblaney/holster/src/holster.js")
const holster = Holster()
const user = holster.user()
user.create("host", "password", console.log)

// Next log in to the host account and create an invite code so that you can
// create your first user account:
user.auth("host", "password", console.log)
const enc = await holster.SEA.encrypt({code: "admin", owner: ""}, user.is)

// Wait for encrypt to finish and then put the data:
user.get("available").next("invite_codes").put(enc, true, console.log)
```

Here `console.log` is being used as the callback function and will log `null` if
the account was created. Make sure you provide a real username and password!

Export the `HOLSTER_USER_NAME` and `HOLSTER_USER_PASSWORD` environment variables
to match the details you provided above. All private data created in Holster
relies on these credentials, so keep them safe.

After you've created the account start the server with:
 - `node app.js`

For production you can start with pm2:

 - `npm install pm2 -g`
 - `export NODE_ENV=production`
 - `pm2 startup` (And follow startup instructions.)
 - `pm2 start app.js --node-args="--max-old-space-size=1536"`
 - `pm2 save`

This will save your environment in `~/.pm2/dump.pm2` so that it can be used on
restarts, note that you need to run `pm2 unstartup` followed by the `pm2`
commands listed above if you modify any required environment variables.

The credentials are also used to access private endpoints, for example to
allocate invite codes to an account you can run:

`curl -i -H 'Content-Type: application/json' -u <HOLSTER_USER_NAME>:<HOLSTER_USER_PASSWORD> -d '{"code": "<code>"}' localhost:3000/private/create-invite-codes`

The value `<code>` is the account code that you want to allocate the new invite
codes to. You can set the number of invite codes to create for an account by
adding `"count": <number>` to the request, otherwise one code will be created.

If you have sendmail available on your server you can export `MAIL_FROM` and
`MAIL_BCC` to send email to your users. If `MAIL_FROM` is not set then the
same information will be logged so that you have access to it.
(See `~/.pm2/logs/app-out.log` if you're using pm2.) Export `APP_HOST` to
create links that point to a server other than localhost.

RSStream relies on Dobrado for its feed processing, which is accessed via it's
API. You can set it up on a subdomain and then access it via the `ADD_FEED_URL`,
`ADD_FEED_ID` and `ADD_FEED_API_KEY` environment variables. Dobrado then pushes
updates back to RSStream via the `/private/add-item` and `/private/removed-feed`
endpoints, so it will also need to be configured with the RSStream url, username
and password.

### Browser

The front end is served from the `browser/build` directory, which was created
with `npx create-react-app browser --template cra-template-pwa`.

If you modify the front end you can rebuild it by running:

 - `cd browser`
 - `npm install`
 - `npm run build`

If you would like to contribute please run: `npx prettier app.js --write` from
the server directory, or `npx prettier src --write && npm run build` from the
browser directory.
