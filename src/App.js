import React, { Component } from 'react'

import Tagger from './Tagger'
import ImageUploader from './ImageUploader'

import './App.css'

class App extends Component {
  state = {
    taggedImages: [],
    unprocessedImages: [],
    currentImage: null,
    __lastAction: null
  }

  nextImage = () => {
    this.setState(previousState => {
      const taggedImages = [previousState.currentImage, ...previousState.taggedImages]
      const unprocessedImages = previousState.unprocessedImages
      const newCurrentImage = unprocessedImages.shift()

      return {
        taggedImages: taggedImages,
        unprocessedImages: unprocessedImages,
        currentImage: newCurrentImage,
        __lastAction: 'next'
      }
    })
  }

  previousImage = () => {
    this.setState(previousState => {
      const taggedImages = previousState.taggedImages
      const unprocessedImages = [previousState.currentImage, ...previousState.unprocessedImages]
      const newCurrentImage = taggedImages.shift()

      return {
        taggedImages: taggedImages,
        unprocessedImages: unprocessedImages,
        currentImage: newCurrentImage,
        __lastAction: 'previous'
      }
    })
  }

  uploadImages = images => {
    this.setState(previousState => {
      const imagesMetadata = images.map(file => ({
        name: file.name,
        extension: file.extension,
        url: file.preview.url,
        file
      }))
      const intersection = imagesMetadata.filter(
        obj => previousState.taggedImages.map(i => i.name).indexOf(obj.name) === -1
      )
      return {
        currentImage: previousState.currentImage
          ? previousState.currentImage
          : intersection.shift(),
        unprocessedImages: intersection
      }
    })
  }

  updateCurrentTags = tags => {
    const currentTags = tags.map(tag => ({
      name: tag.tagName,
      x: tag.box.x(),
      y: tag.box.y(),
      width: tag.box.width(),
      height: tag.box.height()
    }))
    if (this.state.__lastAction === 'next') {
      const taggedImages = this.state.taggedImages
      taggedImages[0].tags = currentTags
      this.setState({ taggedImages: taggedImages })
    } else {
      const unprocessedImages = this.state.unprocessedImages
      unprocessedImages[0].tags = currentTags
      this.setState({ unprocessedImages: unprocessedImages })
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">{'\uD83C\uDF4A'} Taggerine</h1>
        </header>
        <div>
          <ImageUploader uploadImages={this.uploadImages} />
          <button onClick={this.previousImage} disabled={!this.state.taggedImages.length}>
            Previous
          </button>
          <button onClick={this.nextImage} disabled={!this.state.unprocessedImages.length}>
            Next
          </button>
          {this.state.currentImage && (
            <Tagger image={this.state.currentImage.url} updateTags={this.updateCurrentTags} />
          )}
        </div>
      </div>
    )
  }
}

export default App
