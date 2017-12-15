import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

import { loadFromLocalStorage, saveToLocalStorage } from './localStorage'

import Tagger from './Tagger'
import ImageUploader from './ImageUploader'
import TrashIcon from 'react-icons/lib/fa/trash';
import RepeatIcon from 'react-icons/lib/fa/repeat';
import DownloadIcon from 'react-icons/lib/fa/download';
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right';
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left';
import CheckIcon from 'react-icons/lib/fa/check';


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
  const recentTags = []
  const currentImage = getCurrentImage(state)
  if (currentImage) {
    const tags = JSON.parse(JSON.stringify(state.tags))
    delete tags[currentImage.name]
    Object.values(tags).forEach(imageTagsObj => {
      Object.values(imageTagsObj).forEach(tag => recentTags.push(tag))
    })

  }
  return recentTags
}

const getImagesSorted = (state, processed, unprocessed) => {
  let allImages = []
  if (processed && unprocessed){
    allImages = state.processed.concat(state.unprocessed)  
  } else if(processed) {
    allImages = state.processed
  } else {
    allImages = state.unprocessed
  }
  
  return allImages.sort((aImg, bImg) => {
    return aImg.localeCompare(bImg);
  })
}

const isImageProcessed = (state, imageName) => {
  return (imageName in state.tags) && !!Object.keys(state.tags[imageName]).length
}

class App extends Component {
  state = {
    images: {},
    unprocessed: [],
    processed: [],
    tags: {}
  }

  saveState = () => saveToLocalStorage(this.state)

  nextImage = () => {
    console.log('nextImage')
    this.setState(prevState => {
      const currentImageName = prevState.unprocessed.shift()
      return {
        unprocessed: [...prevState.unprocessed],
        processed: [...prevState.processed, currentImageName]
      }
    }, this.saveState)
  }

  prevImage = () => {
    console.log('prevImage')
    this.setState(prevState => {
      const lastProcessedImageName = prevState.processed.pop()
      return {
        unprocessed: [lastProcessedImageName, ...prevState.unprocessed],
        processed: [...prevState.processed]
      }
    }, this.saveState)
  }

  uploadImages = images => {
    console.log('uploadImages', images)
    this.setState(prevState => {
      const newImages = images.reduce((files, file) => ({
        ...files,
        [file.name]: {
          name: file.name,
          extension: file.extension,
          url: file.preview.url,
        }
      }), {})

      const unprocessed = [...prevState.unprocessed, ...Object.keys(newImages).filter(imageName => !prevState.unprocessed.includes(imageName))]
      unprocessed.sort((aImg, bImg) => {
        return aImg.localeCompare(bImg);
      })
      return {
        images: { ...prevState.images, ...newImages },
        unprocessed: unprocessed
      }
    }, this.saveState)
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
    }, this.saveState)
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
    }, this.saveState)
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
    }, this.saveState)
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
    }, this.saveState)
  }

  _changeCurrentImage = (imageName) => {
    this.setState(prevState => {
      let result = {}
      const currentImageName = prevState.unprocessed[0]
      prevState.unprocessed.splice(0, 1)
      if (prevState.unprocessed.indexOf(imageName) >= 0) {    
        prevState.unprocessed.splice(prevState.unprocessed.indexOf(imageName), 1)
        result = {
          unprocessed: [imageName,...prevState.unprocessed],
          processed: [...prevState.processed, currentImageName]
        }
      } else if (prevState.processed.indexOf(imageName) >= 0){
        prevState.processed.splice(prevState.processed.indexOf(imageName), 1)
        result = {
          unprocessed: [imageName,...prevState.unprocessed]
        }
      } else {
        result = {
          unprocessed: [imageName]
        }
      }
      return result
    })
  }

  _uploadedListRowRenderer = ({ index, key, style }) => {
    const sortedImages = getImagesSorted(this.state, true, true)
    const imageName = sortedImages[index]
    const currentImage = getCurrentImage(this.state)
    const isCurrentImage = imageName === currentImage.name
    const isProcessed = isImageProcessed(this.state, imageName)
    const image = this.state.images[imageName]
    console.log(image)
    return (
      <div key={key} style={style}>
        <div className={isCurrentImage ? "list-item selected-image-row" : "list-item"} onClick={() => this._changeCurrentImage(imageName)}>
          <div className="image-item">
            <img className="thumbnail" src={image.url} alt={imageName} />
            <span className="image-item-name">{imageName}</span>
          </div>
          {isProcessed ? <div className="image-item"><CheckIcon /></div> : null}
        </div>
      </div>
    )
  }

  _tagListRowRenderer = ({ index, key, style }) => {
    const tagList = getImageTagsAsList(this.state, getCurrentImage(this.state).name)
    const tag = tagList[index]
    return (
      <div className="tag-item" key={key} style={style}>
        <input
          type="text"
          defaultValue={tag.name}
          onChange={e => this.updateTag({ ...tag, name: e.target.value })}
        />
        <button className="tag-button" onClick={() => this.repeatTag(tag)}> <RepeatIcon/></button>
        <button className="tag-button" onClick={() => this.removeTag(tag.id)}> <TrashIcon/></button>
      </div>
    )
  }

  _recentTagListRowRenderer = ({ index, key, style }) => {
    const recentTagList = getRecentTags(this.state)
    const tag = recentTagList[index]
    return (
      <div className="recentTag list-item" key={key} style={style} onClick={() => this.repeatTag(tag)}>
        {tag.name}
      </div>
    )
  }

  _generateDownloadFile = () => {
    return JSON.stringify(this.state.tags)
  }

  componentWillMount() {
    const prevState = loadFromLocalStorage()
    this.setState(prevState)
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
          <span className="image-counter">{this.state.processed.length}/{Object.keys(this.state.images).length} images</span>
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
          <button onClick={this.prevImage} disabled={!this.state.processed.length}>
            <ArrowLeftIcon/>
          </button>
          {currentImage && (
            <Tagger image={currentImage.url} tags={currentImageTags} updateTag={this.updateTag} />
          )}
          <button onClick={this.nextImage} disabled={this.state.unprocessed.length <= 1}>
            <ArrowRightIcon/>
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
        <div id="tag-actions">
          <button className="button" onClick={this.addTag} key={0} disabled={!this.state.unprocessed.length}>
            Add Bounding Box
          </button>
        </div>
        <div id="tags">
          <AutoSizer>
            {({ width, height }) => [
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
        <footer id="footer">
          <a
            id="download"
            className="button"
            download="tags.json"
            href={
              'data:application/json;charset=utf-8,' +
              encodeURIComponent(this._generateDownloadFile())
            }
          >
            <DownloadIcon/> Download Tags
          </a>
        </footer>
      </div>
    )
  }
}

export default App
