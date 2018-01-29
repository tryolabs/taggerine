import React from 'react'
import PropTypes from 'prop-types'
import Typography from 'material-ui/Typography'
import { DialogContent } from 'material-ui/Dialog'
import DialogHelper from './DialogHelper'

/*
UploadImages: show dialog to upload images. the 'onDismiss' callback is called
with a list of files or with no value if the dialog is cancel
*/

const initialState = {
  selectedFiles: null,
  uploadSize: null,
}

class UploadImages extends React.Component {
  state = initialState

  onFilesSelected = event => {
    event.preventDefault()

    let selectedFiles = Array.from(event.target.files)
    let size = selectedFiles.reduce((acc, file) => file.size + acc, 0)

    let units = 0
    while (size > 1024) {
      size = Math.floor(size / 1024)
      units += 1
    }

    let uploadSize = `${size}${['bytes', 'Kb', 'Mb', 'Gb', 'T'][units]}`
    this.setState({ uploadSize, selectedFiles })
  }

  onConfirm = shouldUpload => {
    if (shouldUpload && this.state.selectedFiles)
      this.props.onDismiss(this.state.selectedFiles)
    else
      this.props.onDismiss()
  }

  componentWillReceiveProps(newProps) {
    if (!newProps.open)
      this.setState(initialState)
  }

  render() {
    const uploadSize = this.state.uploadSize
    return (
      <DialogHelper
        open={this.props.open}
        title="Upload images"
        allowCancel
        onConfirm={() => this.onConfirm(true)}
        onCancel={() => this.onConfirm(false)}
      >
        <DialogContent style={{ paddingBottom: 0 }}>
          <input
            onChange={this.onFilesSelected}
            accept={['image/png', 'image/jpeg']}
            multiple
            type="file"
          />
          <Typography type='caption' style={{ paddingTop: 10 }}>
            {Boolean(uploadSize)
              ? `Total size: ${uploadSize}`
              : 'Select some files to upload'}
          </Typography>
        </DialogContent>
      </DialogHelper>
    )
  }
}

UploadImages.propTypes = {
  open: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
}

export default UploadImages
