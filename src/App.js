import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

import Tagger from './Tagger'
import ImageUploader from './ImageUploader'

import './App.css'

let tagId = 0

const getCurrentImage = state =>
  state.unprocessed.length ? state.images[state.unprocessed[0]] : undefined

const getImageTags = (state, imageName) => {
  return state.tags[imageName] || {}
}

const getImageTagsAsList = (state, imageName) =>
  Object.entries(getImageTags(state, imageName))
    .sort(([aId], [bId]) => aId - bId)
    .map(([id, tag]) => ({
      ...tag,
      id
    }))

const getRecentTags = state => {
  const tags = []
  Object.values(state.tags).forEach(imageTagsObj => {
    Object.values(imageTagsObj).forEach(tag => tags.push(tag))
  })

  return tags.slice(0, 10)
}

class App extends Component {
  state = {
    images: {},
    unprocessed: [],
    processed: [],
    tags: {}
  }

  nextImage = () => {
    console.log('nextImage')
    this.setState(prevState => {
      const currentImageName = prevState.unprocessed.shift()
      return {
        unprocessed: [...prevState.unprocessed],
        processed: [...prevState.processed, currentImageName]
      }
    })
  }

  prevImage = () => {
    console.log('prevImage')
    this.setState(prevState => {
      const lastProcessedImageName = prevState.processed.pop()
      return {
        unprocessed: [lastProcessedImageName, ...prevState.unprocessed],
        processed: [...prevState.processed]
      }
    })
  }

  uploadImages = images => {
    console.log('uploadImages', images)
    this.setState(prevState => {
      const newImages = {}
      images.forEach(file => {
        newImages[file.name] = {
          name: file.name,
          extension: file.extension,
          url: file.preview.url,
          file
        }
      })

      return {
        images: { ...prevState.images, ...newImages },
        unprocessed: [
          ...prevState.unprocessed,
          ...Object.keys(newImages).filter(imageName => !prevState.unprocessed.includes(imageName))
        ]
      }
    })
  }

  addTag = () => {
    console.log('addTag')
    const id = tagId
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: {
            ...currentImageTags,
            [id]: { x: 100, y: 100, name: `tag${id}`, id, width: 100, height: 100 }
          }
        }
      }
    })
  }

  repeatTag = tag => {
    console.log('repeatTag')
    const id = tagId
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: {
            ...currentImageTags,
            [id]: { ...tag, id }
          }
        }
      }
    })
  }

  updateTag = tag => {
    console.log('updateTag', tag)
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: { ...currentImageTags, [tag.id]: tag }
        }
      }
    })
  }

  removeTag = id => {
    console.log('removeTag', id)
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      delete currentImageTags[id]

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: { ...currentImageTags }
        }
      }
    })
  }

  _uploadedListRowRenderer = ({ index, key, style }) => {
    const imageName = this.state.processed.concat(this.state.unprocessed)[index]
    const currentImage = getCurrentImage(this.state)
    const isCurrentImage = imageName === currentImage.name
    const isProcessed = this.state.processed.includes(imageName)

    return (
      <div className="image-list-item" key={key} style={style}>
        {this.state.processed.concat(this.state.unprocessed)[index]}
        {isProcessed ? ' P' : null}
        {isCurrentImage ? ' A' : null}
      </div>
    )
  }

  _tagListRowRenderer = ({ index, key, style }) => {
    const tagList = getImageTagsAsList(this.state, getCurrentImage(this.state).name)
    const tag = tagList[index]
    return (
      <div key={key} style={style}>
        <input
          type="text"
          defaultValue={tag.name}
          onChange={e => this.updateTag({ ...tag, name: e.target.value })}
        />
        <button onClick={() => this.repeatTag(tag)}> Repeat Bounding Box</button>
        <button onClick={() => this.removeTag(tag.id)}> Remove Bounding Box</button>
      </div>
    )
  }

  _recentTagListRowRenderer = ({ index, key, style }) => {
    const recentTagList = getRecentTags(this.state)
    const tag = recentTagList[index]
    return (
      <div key={key} style={style}>
        {tag.name}
        <button onClick={() => this.repeatTag(tag)}> Repeat Bounding Box</button>
      </div>
    )
  }

  render() {
    const currentImage = getCurrentImage(this.state)
    const currentImageTags = currentImage ? getImageTagsAsList(this.state, currentImage.name) : []
    const recentTags = getRecentTags(this.state)

    return (
      <div className="App">
        <header id="header">
          <h1 className="title">{'\uD83C\uDF4A'} Taggerine</h1>
        </header>
        <div id="uploader">
          <ImageUploader uploadImages={this.uploadImages} />
          <span className="image-counter">{Object.keys(this.state.images).length} images</span>
        </div>
        <div id="uploaded-list">
          <AutoSizer>
            {({ width, height }) => (
              <List
                overscanRowCount={10}
                noRowsRenderer={() => <div className="image-list-empty">No files</div>}
                rowCount={Object.keys(this.state.images).length}
                rowHeight={50}
                rowRenderer={this._uploadedListRowRenderer}
                width={width}
                height={height}
                className="image-list"
              />
            )}
          </AutoSizer>
        </div>
        <div id="tagger">
          <button onClick={this.prevImage} disabled={!this.state.processed.length}>
            {'\u2190'} Prev
          </button>
          {currentImage && (
            <Tagger
              image={currentImage.url}
              tags={currentImageTags}
              updateTag={this.updateTag}
            />
          )}
          <button onClick={this.nextImage} disabled={!this.state.unprocessed.length}>
            Next {'\u2192'}
          </button>
        </div>
        <div id="recent-tags">
          <AutoSizer>
            {({ width, height }) => (
              <List
                overscanRowCount={10}
                noRowsRenderer={() => <div className="tag-list-empty">No recent tags</div>}
                rowCount={recentTags.length}
                rowHeight={50}
                rowRenderer={this._recentTagListRowRenderer}
                width={width}
                height={height}
                className="recent-tag-list"
              />
            )}
          </AutoSizer>
        </div>
        <div id="tags">
          <AutoSizer>
            {({ width, height }) => [
              <button onClick={this.addTag} key={0}>
                Add Bounding Box
              </button>,
              <List
                key={1}
                overscanRowCount={10}
                noRowsRenderer={() => <div className="tag-list-empty">No tags</div>}
                rowCount={currentImageTags.length}
                rowHeight={50}
                rowRenderer={this._tagListRowRenderer}
                width={width}
                height={height}
                className="tag-list"
              />
            ]}
          </AutoSizer>
        </div>
      </div>
    )
  }
}

export default App
