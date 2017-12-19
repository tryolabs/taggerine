import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

import { loadFromLocalStorage, saveToLocalStorage } from './localStorage'

import Tagger from './Tagger'
import ImageUploader from './ImageUploader'
import TrashIcon from 'react-icons/lib/fa/trash'
import RepeatIcon from 'react-icons/lib/fa/repeat'
import DownloadIcon from 'react-icons/lib/fa/download'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import CheckIcon from 'react-icons/lib/fa/check'

import './App.css'

let tagId = 0

const getImageNames = state => {
  return Object.keys(state.images).sort((aImg, bImg) => {
    return aImg.localeCompare(bImg)
  })
}

const getCurrentImage = state => {
  const imageNames = getImageNames(state)
  const currentImage = imageNames.length
    ? state.images[imageNames[state.currentImageIndex]]
    : undefined
  return currentImage
}

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
  const recentTags = new Set()
  const currentImage = getCurrentImage(state)
  if (currentImage) {
    const tags = JSON.parse(JSON.stringify(state.tags))
    delete tags[currentImage.name]
    Object.values(tags).forEach(imageTagsObj => {
      Object.values(imageTagsObj).forEach(tag => recentTags.add(tag.name))
    })
  }
  return Array.from(recentTags)
}

const isImageProcessed = (state, imageName) => {
  return imageName in state.tags && !!Object.keys(state.tags[imageName]).length
}

const countTaggedImages = state => {
  return Object.keys(state.images).reduce((accumulator, currentTag) => {
    if (isImageProcessed(state, currentTag)) {
      accumulator += 1
    }
    return accumulator
  }, 0)
}

class App extends Component {
  state = {
    images: {},
    tags: {},
    currentImageIndex: 0
  }

  saveState = () => saveToLocalStorage({ ...this.state, tagId })

  nextImage = () => {
    this.setState(prevState => {
      const imageNames = getImageNames(prevState)
      const currentImageIndex =
        imageNames.length > prevState.currentImageIndex + 1 ? prevState.currentImageIndex + 1 : 0
      return {
        currentImageIndex: currentImageIndex
      }
    }, this.saveState)
  }

  prevImage = () => {
    this.setState(prevState => {
      const imageNames = getImageNames(prevState)
      const currentImageIndex =
        prevState.currentImageIndex > 0 ? prevState.currentImageIndex - 1 : imageNames.length - 1
      return {
        currentImageIndex: currentImageIndex
      }
    }, this.saveState)
  }

  uploadImages = images => {
    this.setState(prevState => {
      const newImages = images.reduce(
        (files, file) => ({
          ...files,
          [file.name]: {
            name: file.name,
            extension: file.extension,
            url: file.preview.url
          }
        }),
        {}
      )

      return {
        images: { ...prevState.images, ...newImages }
      }
    }, this.saveState)
  }

  _changeCurrentImage = imageName => {
    this.setState(prevState => {
      const imageNames = getImageNames(prevState)
      return {
        currentImageIndex: imageNames.indexOf(imageName)
      }
    })
  }

  addTag = () => {
    const id = tagId
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)
      const newTag = { x: 0.14, y: 0.14, name: `tag${id}`, id, width: 0.14, height: 0.14 }
      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: {
            ...currentImageTags,
            [id]: newTag
          }
        }
      }
    }, this.saveState)
  }

  repeatTag = name => {
    const id = tagId
    const newTag = { x: 0.14, y: 0.14, name: `tag${id}`, id, width: 0.14, height: 0.14 }
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: {
            ...currentImageTags,
            [id]: { ...newTag, id, name }
          }
        }
      }
    }, this.saveState)
  }

  updateTag = tag => {
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)

      return {
        tags: {
          ...prevState.tags,
          [currentImage.name]: { ...currentImageTags, [tag.id]: tag }
        }
      }
    }, this.saveState)
  }

  removeTag = id => {
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
    }, this.saveState)
  }

  removeCurrentTags = () => {
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const tags = prevState.tags
      delete tags[currentImage.name]
      return {
        tags: tags
      }
    }, this.saveState)
  }

  _uploadedListRowRenderer = ({ index, key, style }) => {
    const imageNames = getImageNames(this.state)
    const imageName = imageNames[index]
    const currentImage = getCurrentImage(this.state)
    const isCurrentImage = imageName === currentImage.name
    const isProcessed = isImageProcessed(this.state, imageName)
    const image = this.state.images[imageName]
    return (
      <div key={key} style={style}>
        <div
          className={isCurrentImage ? 'list-item selected-image-row' : 'list-item'}
          onClick={() => this._changeCurrentImage(imageName)}
        >
          <div className="image-item">
            <img className="thumbnail" src={image.url} alt={imageName} />
            <span className="image-item-name">{imageName}</span>
          </div>
          {isProcessed ? (
            <div className="image-item">
              <CheckIcon />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  _tagListRowRenderer = ({ index, key, style }) => {
    const imageName = getCurrentImage(this.state).name
    const tagList = getImageTagsAsList(this.state, imageName)
    const tag = tagList[index]
    return (
      <div className="tag-item" key={`${imageName}-${key}`} style={style}>
        <input
          type="text"
          defaultValue={tag.name}
          onChange={e => this.updateTag({ ...tag, name: e.target.value })}
        />
        <button className="tag-button" onClick={() => this.repeatTag(tag.name)}>
          {' '}
          <RepeatIcon />
        </button>
        <button className="tag-button" onClick={() => this.removeTag(tag.id)}>
          {' '}
          <TrashIcon />
        </button>
      </div>
    )
  }

  _recentTagListRowRenderer = ({ index, key, style }) => {
    const recentTagList = getRecentTags(this.state)
    const tag = recentTagList[index]
    return (
      <div className="recentTag list-item" key={key} style={style}>
        <a className="button button-link" onClick={() => this.repeatTag(tag)}>
          {tag}
        </a>
      </div>
    )
  }

  _generateDownloadFile = () => {
    const entries = Object.entries(this.state.tags)
    const toDownload = entries.reduce(
      (acc, [key, value]) => ({ ...acc, [key]: Object.values(value) }),
      {}
    )
    return JSON.stringify(toDownload)
  }

  _cleanAllTags = e => {
    this.setState(() => {
      tagId = 0
      return { tags: {} }
    }, this.saveState)
  }

  componentWillMount() {
    const loaded = loadFromLocalStorage()
    if (loaded) {
      tagId = loaded.tagId
      delete loaded.tagId
      this.setState(loaded)
    }
  }

  render() {
    const currentImage = getCurrentImage(this.state)
    const currentImageTags = currentImage ? getImageTagsAsList(this.state, currentImage.name) : []
    const recentTags = getRecentTags(this.state)
    const imageNames = getImageNames(this.state)

    return (
      <div className="App">
        <header id="header">
          <h1 className="title">{'\uD83C\uDF4A'} Taggerine</h1>
        </header>
        <div id="uploader">
          <ImageUploader uploadImages={this.uploadImages} />
          <span className="image-counter">
            {countTaggedImages(this.state)}/{Object.keys(this.state.images).length} images
          </span>
        </div>
        <div id="uploaded-list">
          <AutoSizer>
            {({ width, height }) => (
              <List
                overscanRowCount={10}
                noRowsRenderer={() => <div className="image-list-empty">No files</div>}
                rowCount={Object.keys(this.state.images).length}
                rowHeight={130}
                rowRenderer={this._uploadedListRowRenderer}
                width={width}
                height={height}
                className="image-list"
              />
            )}
          </AutoSizer>
        </div>
        <div id="tagger">
          <AutoSizer>
            {({ width, height }) => (
              <div style={{ width, height }} className="autosized-tagger">
                <button onClick={this.prevImage} disabled={imageNames.length <= 1}>
                  <ArrowLeftIcon />
                </button>
                {currentImage && (
                  <Tagger
                    image={currentImage.url}
                    tags={currentImageTags}
                    updateTag={this.updateTag}
                    width={width - 60}
                    height={height}
                  />
                )}
                <button onClick={this.nextImage} disabled={imageNames.length <= 1}>
                  <ArrowRightIcon />
                </button>
              </div>
            )}
          </AutoSizer>
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
        <div id="tag-actions">
          <button className="button" onClick={this.addTag} key={0} disabled={!imageNames.length}>
            Add Bounding Box
          </button>
          <button
            className="button second-button"
            onClick={this.removeCurrentTags}
            key={1}
            disabled={!currentImageTags.length}
          >
            <TrashIcon /> Remove Bounding Boxes
          </button>
        </div>
        <div id="tags">
          <AutoSizer>
            {({ width, height }) => (
              <List
                key={2}
                overscanRowCount={10}
                noRowsRenderer={() => <div className="tag-list-empty">No tags</div>}
                rowCount={currentImageTags.length}
                rowHeight={50}
                rowRenderer={this._tagListRowRenderer}
                width={width}
                height={height}
                className="tag-list"
              />
            )}
          </AutoSizer>
        </div>
        <footer id="footer">
          <a
            id="download"
            className="button button-link"
            download="tags.json"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(
              this._generateDownloadFile()
            )}`}
          >
            <DownloadIcon /> Download Tags
          </a>
          <a
            id="clean-tags"
            className="button button-link second-button"
            onClick={this._cleanAllTags}
          >
            <TrashIcon /> Clean tags
          </a>
        </footer>
      </div>
    )
  }
}

export default App
