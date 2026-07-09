import {useState} from "react"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import {SearchAppBar} from "@mblaney/holster-browser"

const images = ["/rsstream1.png", "/rsstream2.png", "/rsstream3.png"]

const Help = ({loggedIn, mode, setMode, appBar}) => {
  const [imageIndex, setImageIndex] = useState(0)

  const prev = () => setImageIndex(i => (i + images.length - 1) % images.length)
  const next = () => setImageIndex(i => (i + 1) % images.length)

  return (
    <>
      {loggedIn && (
        <SearchAppBar
          {...appBar}
          mode={mode}
          setMode={setMode}
          menuItems={[
            {label: "Groups", onClick: () => (window.location = "/")},
            {label: "Settings", onClick: () => (window.location = "/settings")},
          ]}
        />
      )}
      <Container maxWidth="md">
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Box
                  sx={{display: "flex", alignItems: "flex-end", gap: 1, pb: 4}}
                >
                  <Typography variant="h4">Welcome</Typography>
                  <img
                    src="/logo192.png"
                    alt="RSStream"
                    style={{width: 60, height: 60}}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: {xs: "column", md: "row"},
                    gap: 2,
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{flex: 1}}>
                    <Typography sx={{pb: 1}}>
                      Thanks for checking out <b>RSStream</b>!
                    </Typography>
                    <Typography sx={{pb: 1}}>
                      This web application aims to provide a great reading
                      experience for content from all over the web. It's
                      designed around grouping related feeds together so they
                      can be read in a Really Simple Stream.
                    </Typography>
                    <Typography sx={{pb: 1}}>
                      RSStream is local first, which means when you're offline
                      you still have access to all your data. You can even log
                      in without a network connection! It can be installed as an
                      app and syncs automatically between your devices.
                    </Typography>
                    <Typography sx={{pb: 1}}>
                      Feeds update in real time as new content is published. You
                      can search locally across groups, cache podcasts for
                      offline listening, and bookmark items to read later.
                      Unread counts are optional and can be turned off per
                      group, dark mode is also supported.
                    </Typography>
                    <Typography>
                      You can <Link href="/login">log in here</Link> if you have
                      an account, otherwise you will need a login code to{" "}
                      <Link href="/register">register</Link>. You can request a{" "}
                      <Link href="/invite">login code here</Link> and you will
                      receive a reply when yours becomes available.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                      gap: 0.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={images[imageIndex]}
                      alt={`RSStream screenshot ${imageIndex + 1}`}
                      sx={{
                        width: {xs: "100%", md: 280},
                        maxHeight: 500,
                        objectFit: "cover",
                        objectPosition: "top",
                        borderRadius: 1,
                        display: "block",
                        boxShadow: 3,
                      }}
                    />
                    <Box sx={{display: "flex", alignItems: "center"}}>
                      <IconButton onClick={prev} size="small">
                        <ChevronLeftIcon />
                      </IconButton>
                      {images.map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            mx: 0.5,
                            bgcolor:
                              i === imageIndex ? "error.main" : "grey.400",
                          }}
                        />
                      ))}
                      <IconButton onClick={next} size="small">
                        <ChevronRightIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h6" sx={{pb: 1}}>
                  Why login codes?
                </Typography>
                <Typography sx={{pb: 1}}>
                  Accounts are created in RSStream using a distributed database
                  called{" "}
                  <Link href="https://github.com/mblaney/holster">Holster</Link>
                  . Login codes provide a way to map Holster accounts to a known
                  list of users. If you ever need to reset your password then
                  your Holster account details will change but your login code
                  remains the same. In a distributed system a password reset is
                  a migration from one account to another, but since your login
                  code doesn't change this can happen automatically and you
                  won't notice this as a user.
                </Typography>
                <Typography sx={{pb: 1}}>
                  If login codes are created for you they will appear on your
                  settings page to share with new users. They will be removed
                  automatically as they're claimed.
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
                  login codes. Confirming your account is done via email, which
                  is provided during registration. Personal details such as your
                  email address and confirmation codes are encrypted when stored
                  in Holster.
                </Typography>
                <Typography sx={{pb: 1}}>
                  Having an email address associated with your account means you
                  can <Link href="/reset-password">reset your password</Link> if
                  required. This is only necessary if you're logged out and
                  can't remember your password. Note that if you're logged in,
                  you can change your password via the{" "}
                  <Link href="/settings">settings page</Link>.
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
                  via Holster to store data that syncs between browsers. You can
                  contribute and find out more at{" "}
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
