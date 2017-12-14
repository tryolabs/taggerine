import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

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

  _rowRenderer = ({ index, key, style }) => (
    <div className="image-list-item" key={key} style={style}>
      {this.state.unprocessedImages[index].name}
    </div>
  )

  render() {
    return (
      <div className="App">
        <header id="header">
          <h1 className="title">{'\uD83C\uDF4A'} Taggerine</h1>
        </header>
        <div id="uploader">
          <ImageUploader uploadImages={this.uploadImages} />
          <span className="image-counter">{this.state.unprocessedImages.length} images</span>
        </div>
        <div id="uploaded-list">
          <AutoSizer>
            {({ width, height }) => (
              <List
                overscanRowCount={10}
                noRowsRenderer={() => <div className="image-list-empty">No files</div>}
                rowCount={this.state.unprocessedImages.length}
                rowHeight={50}
                rowRenderer={this._rowRenderer}
                width={width}
                height={height}
                className="image-list"
              />
            )}
          </AutoSizer>
        </div>
        <div id="tagger">
          <button onClick={this.previousImage} disabled={!this.state.taggedImages.length}>
            {'\u2190'} Prev
          </button>
          {this.state.currentImage && (
            <Tagger image={this.state.currentImage.url} tags={this.state.currentImage.tags} updateTag={this.updateTag} removeTag={this.removeTag}/>
          )}
          <button onClick={this.nextImage} disabled={!this.state.unprocessedImages.length}>
            Next {'\u2192'}
          </button>
        </div>
        <div id="recent-tags">Recent tags</div>
        <div id="tags">Tags</div>
      </div>
    )
  }
}

export default App
