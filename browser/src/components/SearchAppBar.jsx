import {useState} from "react"
import {styled, alpha} from "@mui/material/styles"
import {red} from "@mui/material/colors"
import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import InputBase from "@mui/material/InputBase"
import MenuItem from "@mui/material/MenuItem"
import Menu from "@mui/material/Menu"
import Switch from "@mui/material/Switch"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import LightModeIcon from "@mui/icons-material/LightMode"
import MoreIcon from "@mui/icons-material/MoreVert"
import RssFeedIcon from "@mui/icons-material/RssFeed"
import SearchIcon from "@mui/icons-material/Search"

const Search = styled("div")(({theme}) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
  },
}))

const SearchIconWrapper = styled("div")(({theme}) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}))

const StyledInputBase = styled(InputBase)(({theme}) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}))

const SearchAppBar = ({
  page,
  showGroupList,
  createGroup,
  editGroup,
  createFeed,
  mode,
  setMode,
  title,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null)

  const isMenuOpen = Boolean(anchorEl)
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl)

  const handleProfileMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    handleMobileMenuClose()
  }

  const handleMobileMenuOpen = event => {
    setMobileMoreAnchorEl(event.currentTarget)
  }

  const changeMode = () => {
    sessionStorage.setItem("mode", mode === "light" ? "dark" : "light")
    setMode(mode === "light" ? "dark" : "light")
  }

  const home = () => {
    if (page === "display") {
      showGroupList(false)
    } else {
      window.location = "/"
    }
  }

  const menuId = "search-account-menu"
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      {page === "display" && (
        <>
          <MenuItem
            onClick={() => {
              handleMenuClose()
              createGroup()
            }}
          >
            Add group
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose()
              createFeed()
            }}
          >
            Add feed
          </MenuItem>
        </>
      )}
      {page !== "display" && (
        <MenuItem
          onClick={() => {
            handleMenuClose()
            window.location = "/"
          }}
        >
          Groups
        </MenuItem>
      )}
      {page !== "settings" && (
        <MenuItem
          onClick={() => {
            handleMenuClose()
            window.location = "/settings"
          }}
        >
          Settings
        </MenuItem>
      )}
      {page !== "help" && (
        <MenuItem
          onClick={() => {
            handleMenuClose()
            window.location = "/help"
          }}
        >
          Help
        </MenuItem>
      )}
    </Menu>
  )

  const mobileMenuId = "search-account-menu-mobile"
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircleIcon />
        </IconButton>
        <p>Account</p>
      </MenuItem>
      <MenuItem onClick={changeMode}>
        <IconButton size="large" color="inherit">
          {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <p>{mode === "light" ? "Dark" : "Light"} mode</p>
      </MenuItem>
    </Menu>
  )

  return (
    <Box sx={{flexGrow: 1}}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="home"
            onClick={home}
          >
            <RssFeedIcon
              sx={theme => ({
                ...theme.applyStyles("dark", {color: red[900]}),
              })}
            />
          </IconButton>
          {title ? (
            <Button
              sx={{
                color: "white",
                fontSize: "1.25em",
                textTransform: "none",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                display: "block",
              }}
              onClick={() => editGroup(title)}
            >
              {title}
            </Button>
          ) : (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{display: {xs: "none", sm: "block"}}}
            >
              rsstream
            </Typography>
          )}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{"aria-label": "search"}}
            />
          </Search>
          <Box sx={{flexGrow: 1}} />
          <Box sx={{display: {xs: "none", md: "flex"}}}>
            <Switch checked={mode === "dark"} onChange={changeMode} />
          </Box>
          <Box sx={{display: {xs: "none", md: "flex"}}}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
          <Box sx={{display: {xs: "flex", md: "none"}}}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      {renderMobileMenu}
      {renderMenu}
    </Box>
  )
}

export default SearchAppBar
