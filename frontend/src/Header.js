import React from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import DeleteIcon from 'material-ui-icons/DeleteForever'
import ImportExportIcon from 'material-ui-icons/ImportExport'
import UploadIcon from 'material-ui-icons/FileUpload'
import SettingsIcon from 'material-ui-icons/Settings'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'
import {
  DialogContent,
  DialogContentText,
} from 'material-ui/Dialog'

import DialogHelper from './Dialogs/DialogHelper'
import ImportExportDialog from './Dialogs/ImportExport'
import UploadImagesDialog from './Dialogs/UploadImagesDialog'
import ProjectSettingsDialog from './Dialogs/ProjectSettingsDialog'

import icon from './icon.png'

const DialogType = Object.freeze({
  None: 0,
  DeleteTags: 1,
  ImportExport: 2,
  UploadImage: 3,
  Settings: 4
})

const UploadImages = ({ visibleDialog, showDialog, onClose }) =>
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.UploadImage)}>
      <UploadIcon />
    </Button>
    <UploadImagesDialog
      open={visibleDialog === DialogType.UploadImage}
      onDismiss={onClose}
    />
  </div>

const ImportExport = ({ visibleDialog, showDialog, onClose }) =>
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.ImportExport)}>
      <ImportExportIcon />
    </Button>
    <ImportExportDialog
      open={visibleDialog === DialogType.ImportExport}
      onDismiss={onClose}
    />
  </div>

const Delete = ({ visibleDialog, showDialog, onClose }) =>
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.Delete)}>
      <DeleteIcon />
    </Button>
    <DialogHelper
      open={visibleDialog === DialogType.Delete}
      title="Delete all tags"
      message="Are you sure that you want to delete all the tags? This can't be undo"
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
    />
  </div>

const Settings = ({ visibleDialog, showDialog, onClose }) =>
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.Settings)}>
      <SettingsIcon />
    </Button>
    <DialogHelper
      open={visibleDialog === DialogType.Settings}
      title="Settings"
      onConfirm={() => onClose(true)}
    >
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Here will go the project settings...
        </DialogContentText>
      </DialogContent>
    </DialogHelper>
  </div>

const headerStyles = {
  icon: {
    maxHeight: '60%',
    maxWidth: '60%',
    paddingRight: 20,
  },
  title: {
    fontFamily: 'Rubik',
    letterSpacing: 3,
    color: 'inherit',
  },
  projectName: {
    flex: 0.9,
    color: 'lightgrey',
    fontStyle: 'italic',
  },
  toolbar: {
     height: 0,
  },
};

class Header extends React.Component {
  state = {
    dialogType: DialogType.None,
  }

  showDialog = dialog => () => this.setState({ dialogType: dialog })
  closeDialog = () => this.setState({ dialogType: DialogType.None })

  handleUploadImages = shouldUpload => {
    if (shouldUpload)
      this.props.onUploadImage()
    this.closeDialog()
  }

  handleImportExport = action => {
    if (action === 'import')
      this.props.onImportTags()
    else if (action === 'export') {
      this.props.onExportTags()
    }
    this.closeDialog()
  }

  handleDelete = shouldDelete => {
    if (shouldDelete)
      this.props.onDelete()
    this.closeDialog()
  }

  handleSettingsChange = shouldUpdate => {
    if (shouldUpdate)
      this.props.onSettingsChange()
    this.closeDialog()
  }

  render() {
    const dialogType = this.state.dialogType
    return (
      <div>
        <AppBar>
          <Toolbar style={headerStyles.toolbar}>
            <img src={icon} alt="" style={headerStyles.icon}/>
            <Typography type="title" className={this.props.classes.title}>
              TAGGERINE
            </Typography>
            <div style={{ flex: 0.1 }}/>
            <Typography type="subheading" className={this.props.classes.projectName}>
              / Awesome project
            </Typography>
            <UploadImages
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleUploadImages} />
            <ImportExport
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleImportExport} />
            <Delete
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleDelete} />
            <Settings
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={_ => this.closeDialog()} />
          </Toolbar>
        </AppBar>
      </div>
    )
  }
}

Header.propTypes = {
  onUploadImage: PropTypes.func.isRequired,
  onImportTags: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
}

export default withStyles(headerStyles)(Header)
