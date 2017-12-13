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
      let imagesMetadata = images.map(file => ({
        name: file.name,
        extension: file.extension,
        url: file.preview.url,
        file,
        tags: {}
      }))

      const intersection = imagesMetadata.filter(
        obj => (previousState.taggedImages.map(i => i.name).indexOf(obj.name) === -1 &&
          previousState.unprocessedImages.map(i => i.name).indexOf(obj.name) === -1 &&
          (!previousState.currentImage || previousState.currentImage.name !== obj.name))
      )
      return {
        currentImage: previousState.currentImage
          ? previousState.currentImage
          : intersection.shift(),
        unprocessedImages: previousState.unprocessedImages.concat(intersection)
      }
    })
  }

  updateTag = tag => {
    const currentImage = this.state.currentImage
    currentImage.tags[tag.id] = tag
    this.setState(currentImage: currentImage)
  }

  removeTag = id => {
    const currentImage = this.state.currentImage
    delete currentImage.tags[id]
    this.setState({currentImage: currentImage})
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
            <Tagger image={this.state.currentImage.url} tags={this.state.currentImage.tags} updateTag={this.updateTag} removeTag={this.removeTag}/>
          )}
        </div>
      </div>
    )
  }
}

export default App
