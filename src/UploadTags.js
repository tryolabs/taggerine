import React from 'react'
import Files from 'react-files'
import './UploadTags.css'

class UploadTags extends React.Component {
  onFilesChange = files => {
    this.props.uploadTags(files[0])
  }

  onFilesError = (error, file) => {
    console.log('error code ' + error.code + ': ' + error.message)
  }

  render() {
    return (
      <Files
        onChange={this.onFilesChange}
        onError={this.onFilesError}
        accepts={['application/json']}
        clickable
      >
        Upload tags
      </Files>
    )
  }
}

export default UploadTags