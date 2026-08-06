import Box from "@mui/material/Box"

const Logo = ({sx}) => (
  <Box
    component="img"
    src="/logo192.png"
    alt="RSStream"
    sx={[{width: 60, height: 60}, sx]}
  />
)

export default Logo
