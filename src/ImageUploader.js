import React from 'react'
import Files from 'react-files'

class ImageUploader extends React.Component {
  onFilesChange = files => {
    this.props.uploadImages(files)
  }

  onFilesError = (error, file) => {
    console.log('error code ' + error.code + ': ' + error.message)
  }

  render() {
    return (
      <Files
        onChange={this.onFilesChange}
        onError={this.onFilesError}
        accepts={['image/png', 'image/jpeg']}
        multiple
        minFileSize={0}
        clickable
      >
        Drop files here or click to upload
      </Files>
    )
  }
}

export default ImageUploader
