import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import SearchAppBar from "./SearchAppBar"

const Help = ({loggedIn, mode, setMode}) => {
  return (
    <>
      {loggedIn && <SearchAppBar page="help" mode={mode} setMode={setMode} />}
      <Container maxWidth="md">
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography sx={{pb: 2}} variant="h4">
                  Welcome
                </Typography>
                <Typography sx={{pb: 1}}>
                  Thanks for checking out <b>RSStream</b>!
                </Typography>
                <Typography sx={{pb: 1}}>
                  This web application aims to provide a great reading
                  experience for content from all over the web. It's designed
                  around grouping related feeds together so they can be read in
                  a Really Simple Stream.
                </Typography>
                <Typography sx={{pb: 1}}>
                  You can <Link href="/login">log in here</Link> if you have an
                  account, otherwise you will need an invite code to{" "}
                  <Link href="/register">register</Link>. You can request an{" "}
                  <Link href="/invite">invite code here</Link> and you will
                  receive a reply when it becomes available.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h6" sx={{pb: 1}}>
                  Why invite codes?
                </Typography>
                <Typography sx={{pb: 1}}>
                  Accounts are created in RSStream using a distributed database
                  called{" "}
                  <Link href="https://github.com/mblaney/holster">Holster</Link>
                  . Invite codes provide a way to control the sign up process,
                  by letting existing users decide who can create accounts.
                </Typography>
                <Typography sx={{pb: 1}}>
                  Sharing invite codes also allows a social graph of connected
                  accounts to be created. Available invite codes will appear on
                  your settings page and will be removed automatically as
                  they're claimed by new users.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h6" sx={{pb: 1}}>
                  Confirming your account
                </Typography>
                <Typography sx={{pb: 1}}>
                  New accounts need to be confirmed before they can be allocated
                  invite codes. Confirming your account is done via email, which
                  is provided during registration. Personal details such as your
                  email address and confirmation codes are encrypted when stored
                  in Holster.
                </Typography>
                <Typography sx={{pb: 1}}>
                  Having an email address associated with your account means you
                  can <Link href="/reset-password">reset your password</Link> if
                  required. This is only necessary if you're logged out and
                  can't remember your password. It would otherwise not be
                  possible to recover your account when using a distributed
                  database.
                </Typography>
                <Typography sx={{pb: 1}}>
                  Note that if you're logged in, you can change your password
                  via the <Link href="/settings">settings page</Link>.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h6" sx={{pb: 1}}>
                  Get involved
                </Typography>
                <Typography sx={{pb: 1}}>
                  RSStream is an open source project written in JavaScript using{" "}
                  <Link href="https://expressjs.com">Express</Link> and{" "}
                  <Link href="https://react.dev">React</Link>. It uses IndexedDB
                  via Holster, to create an offline first web application that
                  syncs between browsers. You can contribute and find out more
                  at{" "}
                  <Link href="https://github.com/mblaney/rsstream">
                    github.com/mblaney/rsstream
                  </Link>
                  .
                </Typography>
                <Typography sx={{pb: 1}}>
                  For more information and updates, follow{" "}
                  <Link href="https://mal.haza.website">mal.haza.website</Link>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default Help
