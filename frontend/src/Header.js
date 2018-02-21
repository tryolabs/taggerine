import React from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import DeleteIcon from 'material-ui-icons/DeleteForever'
import ImportExportIcon from 'material-ui-icons/ImportExport'
import ExitToAppIcon from 'material-ui-icons/ExitToApp'
import UploadIcon from 'material-ui-icons/FileUpload'
import SettingsIcon from 'material-ui-icons/Settings'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'

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

const UploadImages = ({ visibleDialog, showDialog, onClose }) => (
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.UploadImage)}>
      <UploadIcon color="primary" />
    </Button>
    <UploadImagesDialog open={visibleDialog === DialogType.UploadImage} onDismiss={onClose} />
  </div>
)

const ImportExport = ({ visibleDialog, showDialog, onClose }) => (
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.ImportExport)}>
      <ImportExportIcon color="primary" />
    </Button>
    <ImportExportDialog open={visibleDialog === DialogType.ImportExport} onDismiss={onClose} />
  </div>
)

const Delete = ({ visibleDialog, showDialog, onClose }) => (
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.Delete)}>
      <DeleteIcon color="primary" />
    </Button>
    <DialogHelper
      open={visibleDialog === DialogType.Delete}
      title="Delete all tags"
      message="Are you sure that you want to delete all the tags? This can't be undone"
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
    />
  </div>
)

const Settings = ({ visibleDialog, showDialog, onClose, onSettingsChange, settings }) => (
  <div>
    <Button dense color="inherit" onClick={showDialog(DialogType.Settings)}>
      <SettingsIcon color="primary" />
    </Button>
    <ProjectSettingsDialog
      open={visibleDialog === DialogType.Settings}
      title="Settings"
      onSettingsChange={onSettingsChange}
      settings={settings}
      onDismiss={onClose}
    />
  </div>
)

const headerStyles = {
  icon: {
    maxHeight: '60%',
    maxWidth: '60%',
    paddingRight: 20
  },
  title: {
    fontFamily: 'Rubik',
    letterSpacing: 3
  },
  projectName: {
    flex: 1,
    fontStyle: 'italic',
    paddingLeft: 20
  },
  toolbar: {
    height: 0
  }
}

class Header extends React.Component {
  state = {
    dialogType: DialogType.None
  }

  showDialog = dialog => () => this.setState({ dialogType: dialog })
  closeDialog = () => this.setState({ dialogType: DialogType.None })

  handleUploadImages = files => {
    if (Boolean(files)) this.props.onUploadImage(files)
    this.closeDialog()
  }

  handleImportExport = param => {
    if (typeof param === 'string')
      //param has the selected export format
      this.props.onExportTags(param)
    else if (typeof param === 'object') {
      //param is a file to import the tags from
      this.props.onImportTags(param)
    }
    this.closeDialog()
  }

  handleDelete = shouldDelete => {
    if (shouldDelete) this.props.onDelete()
    this.closeDialog()
  }

  handleSettingsChange = () => {
    this.closeDialog()
  }

  render() {
    const dialogType = this.state.dialogType
    return (
      <div>
        <AppBar color="secondary">
          <Toolbar style={headerStyles.toolbar}>
            <img src={icon} alt="" style={headerStyles.icon} />
            <Typography type="title" className={this.props.classes.title}>
              TAGGERINE
            </Typography>
            <Typography type="subheading" className={this.props.classes.projectName}>
              / {this.props.currentProjectName}
            </Typography>
            <UploadImages
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleUploadImages}
            />
            <ImportExport
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleImportExport}
            />
            <Delete
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              onClose={this.handleDelete}
            />
            <Settings
              visibleDialog={dialogType}
              showDialog={this.showDialog}
              settings={this.props.settings}
              onSettingsChange={this.props.onSettingsChange}
              onClose={_ => this.closeDialog()}
            />
            <div>
              <Button dense color="inherit" onClick={this.props.onExit}>
                <ExitToAppIcon color="primary" />
              </Button>
            </div>
          </Toolbar>
        </AppBar>
      </div>
    )
  }
}

Header.propTypes = {
  currentProjectName: PropTypes.string,
  onUploadImage: PropTypes.func.isRequired,
  onImportTags: PropTypes.func.isRequired,
  onExportTags: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func.isRequired
}

export default withStyles(headerStyles)(Header)
