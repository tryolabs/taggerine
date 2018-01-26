import React from 'react'
import PropTypes from 'prop-types'
import CogIcon from 'react-icons/lib/fa/cog'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import Menu, { MenuItem } from 'material-ui/Menu'
import { withStyles } from 'material-ui/styles'
import icon from './icon.png'

const menuStyles = theme => ({
  separator: {
    marginLeft: 16,
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
})

class _ProjectMenuButton extends React.Component {
  state = {
    anchorElement: null,
  }

  handleClick = event => this.setState({ anchorElement: event.currentTarget })
  handleClose = () => this.setState({ anchorElement: null })

  render() {
    const { classes } = this.props
    const anchor = this.state.anchorElement
    const ownership = anchor ? 'project-menu' : null

    return (
      <div>
        <Button
          aria-owns={ownership}
          aria-haspopup="true"
          onClick={this.handleClick}
        >
          <CogIcon size={24} color="white" />
        </Button>
        <Menu
          id="project-menu"
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.handleClose}>Upload Images</MenuItem>
          <Typography className={classes.separator}>Tags</Typography>
          <MenuItem onClick={this.handleClose}>Import</MenuItem>
          <MenuItem onClick={this.handleClose}>Export</MenuItem>
          <MenuItem onClick={this.handleClose}>Clear all</MenuItem>
        </Menu>
      </div>
    )
  }
}

_ProjectMenuButton.propTypes = {
  classes: PropTypes.object.isRequired,
  onUploadImage: PropTypes.func,
  onImportTags: PropTypes.func,
  onExportTags: PropTypes.func,
  onClearAllTags: PropTypes.func,
}

const ProjectMenuButton = withStyles(menuStyles)(_ProjectMenuButton)

const headerStyles = {
  icon: {
    maxHeight: '60%',
    maxWidth: '60%',
    paddingRight: 20,
  },
  title: {
    flex: 1,
  },
  toolbar: {
     height: 10,
  },
};

const Header = ({ classes, settingsSelected }) =>
  <AppBar>
    <Toolbar style={headerStyles.toolbar}>
      <img src={icon} alt="" style={headerStyles.icon}/>
      <Typography type="title" color="inherit" className={classes.title}>
        Taggerine
      </Typography>
      <ProjectMenuButton />
    </Toolbar>
  </AppBar>

Header.propTypes = ProjectMenuButton.propTypes

export default withStyles(headerStyles)(Header)
