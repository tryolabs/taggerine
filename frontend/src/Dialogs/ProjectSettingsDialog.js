import React from 'react'
import PropTypes from 'prop-types'
import { DialogContent, DialogContentText } from 'material-ui/Dialog'
import DialogHelper from './DialogHelper'

/*
UploadImagesDialog: show dialog to upload images. The 'onDismiss' callback
could receive two types of input:

- An array of File objects representing the images to upload.
- No value if the dialog is canceled.
*/

const initialState = {
  name: null,
}

class UploadImagesDialog extends React.Component {
  state = initialState

  onConfirm = shouldUpload => () => {
    if (shouldUpload && this.state.name)
      this.props.onDismiss(this.state)
    else
      this.props.onDismiss()
  }

  componentWillReceiveProps(newProps) {
    if (!newProps.open)
      this.setState(initialState)
  }

  render() {
    return (
      <DialogHelper
        open={this.props.open}
        title="Project settings"
        allowCancel
        onConfirm={this.onConfirm(true)}
        onCancel={this.onConfirm(false)}
      >
        <DialogContent style={{ paddingBottom: 0 }}>
          <DialogContentText id="alert-dialog-description">
            Under construction
          </DialogContentText>
        </DialogContent>
      </DialogHelper>
    )
  }
}

UploadImagesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
}

export default UploadImagesDialog
