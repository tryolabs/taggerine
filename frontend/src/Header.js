import React from 'react'
import PropTypes from 'prop-types'
import CogIcon from 'react-icons/lib/fa/cog'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'
import icon from './icon.png'

const styles = {
  icon: {
    maxHeight: '60%',
    maxWidth: '60%',
    paddingRight: 20,
  },
  title: {
    flex: 1,
  },
  toolbar: {
     height: 40,
  },
};

const Header = ({ classes, settingsSelected }) =>
  <AppBar>
    <Toolbar style={styles.toolbar}>
      <img src={icon} alt="" style={styles.icon}/>
      <Typography type="title" color="inherit" className={classes.title}>
        Taggerine
      </Typography>
      <Button color="inherit" onClick={settingsSelected}>
        <CogIcon size={24} color="white" />
      </Button>
    </Toolbar>
  </AppBar>

Header.propTypes = {
  classes: PropTypes.object.isRequired,
  settingsSelected: PropTypes.func,
}

export default withStyles(styles)(Header)
