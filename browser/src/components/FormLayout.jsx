import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import {SearchAppBar} from "@mblaney/holster-browser"
import Logo from "./Logo.jsx"

const FormLayout = ({loggedIn, mode, setMode, appBar, children}) => {
  return (
    <>
      {loggedIn && <SearchAppBar mode={mode} setMode={setMode} {...appBar} />}
      <Container maxWidth="sm">
        <Box
          sx={{display: "flex", alignItems: "flex-end", gap: 1, pt: 8, pb: 4}}
        >
          <Typography
            variant="h4"
            sx={{fontSize: "clamp(1.5rem, 12.5vw - 1rem, 2.125rem)"}}
          >
            {appBar.name}
          </Typography>
          <IconButton
            aria-label="home"
            onClick={() => (window.location = "/")}
            sx={{p: 0}}
          >
            <Logo />
          </IconButton>
        </Box>
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>{children}</CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default FormLayout
