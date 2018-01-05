import React from 'react'
import Files from 'react-files'

import './ImageUploader.css'

const ImageUploader = props => (
      <Files
        onChange={files => props.uploadImages(files)}
        onError={(error, file) => console.log('error code ' + error.code + ': ' + error.message)}
        accepts={['image/png', 'image/jpeg']}
        multiple
        minFileSize={0}
        clickable
      >
        Drop files here or click to upload
      </Files>
)

export default ImageUploader
