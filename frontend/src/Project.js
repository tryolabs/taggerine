import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

import { loadFromLocalStorage, saveToLocalStorage } from './localStorage'

import Tagger from './Tagger'
import ImageUploader from './ImageUploader'
import UploadTags from './UploadTags'
import TrashIcon from 'react-icons/lib/fa/trash'
import RepeatIcon from 'react-icons/lib/fa/repeat'
import DownloadIcon from 'react-icons/lib/fa/download'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import CheckIcon from 'react-icons/lib/fa/check'
import CogIcon from 'react-icons/lib/fa/cog'
import Slider, { createSliderWithTooltip } from 'rc-slider'
import axios from 'axios'

// Material-ui
import Grid from 'material-ui/Grid';

//import './Project.css'

const DEFAULT_HEIGHT = 0.14
const DEFAULT_WIDTH = 0.14
const DEFAULT_TAG_VALUE = 'xywh'
const PRECISION_ERROR = '0.000001'
const API_URL = process.env.REACT_APP_API_URL

let tagId = 0

function getImageUrl(projectId, imageName) {
  return `${API_URL}/projects/${projectId}/images/${imageName}`
}

function getThumbnailUrl(projectId, imageName) {
  return `${API_URL}/projects/${projectId}/images/thumbnail/${imageName}`
}

function percentFormatter(v) {
  return `${v} %`
}

const SliderWithTooltip = createSliderWithTooltip(Slider)

const getCurrentImage = state => {
  const currentImage = state.images.length ? state.images[state.currentImageIndex] : undefined
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
    const tags = { ...state.tags }
    delete tags[currentImage]
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

class Project extends Component {
  state = {
    images: [],
    totalImages: 0,
    tags: {},
    currentImageIndex: 0,
    showSettings: false,
    tagFormat: 'xywh',
    bbWidth: 0.14,
    bbHeight: 0.14
  }

  saveState = () => saveToLocalStorage({ ...this.state, tagId })

  nextImage = () => {
    this.setState(prevState => {
      const currentImageIndex =
        prevState.images.length > prevState.currentImageIndex + 1
          ? prevState.currentImageIndex + 1
          : 0
      return {
        currentImageIndex: currentImageIndex
      }
    }, this.saveState)
  }

  prevImage = () => {
    this.setState(prevState => {
      const currentImageIndex =
        prevState.currentImageIndex > 0
          ? prevState.currentImageIndex - 1
          : prevState.images.length - 1
      return {
        currentImageIndex: currentImageIndex
      }
    }, this.saveState)
  }

  uploadImages = images => {
    let data = new FormData()
    const batchLimit = 100

    const config = {
      headers: { 'content-type': 'multipart/form-data' }
    }

    for (var i = 0; i < images.length; i++) {
      let file = images[i]
      data.append('file[' + i + ']', file, file.name)
      if (i % batchLimit === 0 && i > 0) {
        axios
          .post(`${API_URL}/projects/${this.props.match.params.project_id}/images`, data, config)
          .then(this.getImages)
        data = new FormData()
      }
    }
    axios
      .post(`${API_URL}/projects/${this.props.match.params.project_id}/images`, data, config)
      .then(this.getImages)
  }

  _tagFormat = newTags => {
    let result = 'empty'
    if (newTags.length > 0 && 'x' in newTags[0]) {
      result = 'xywh'
    } else if (newTags.length > 0 && 'x_min' in newTags[0]) {
      result = 'xyxy'
    }
    return result
  }

  _addXYWHTags = (tags, fileName, newTags) => {
    if (fileName in tags) {
      newTags.forEach(bbox => {
        let obj = Object.values(tags[fileName]).find(obj => {
          return (
            obj.x === bbox.x &&
            obj.y === bbox.y &&
            obj.name === bbox.label &&
            obj.width === bbox.width &&
            obj.height === bbox.height
          )
        })
        if (!obj) {
          let id = tagId
          tagId += 1
          bbox.id = id
          bbox.name = bbox.label
          delete bbox.label
          tags[fileName][id] = bbox
        }
      })
    } else {
      tags[fileName] = {}
      newTags.forEach(bbox => {
        let id = tagId
        tagId += 1
        bbox.id = id
        bbox.name = bbox.label
        delete bbox.label
        tags[fileName][id] = bbox
      })
    }
  }

  _XYXYFormatToXYWH = (id, bbox) => {
    tagId += 1
    bbox.id = id
    bbox.name = bbox.label
    bbox.x = bbox.x_min
    bbox.y = bbox.y_min
    bbox.width = bbox.x_max - bbox.x_min
    bbox.height = bbox.y_max - bbox.y_min
    delete bbox.label
    delete bbox.x_min
    delete bbox.y_min
    delete bbox.y_max
    delete bbox.y_min
  }

  _addXYXYTags = (tags, fileName, newTags) => {
    if (fileName in tags) {
      newTags.forEach(bbox => {
        let obj = Object.values(tags[fileName]).find(obj => {
          return (
            obj.x === bbox.x_min &&
            obj.y === bbox.y_min &&
            obj.name === bbox.label &&
            Math.abs(bbox.x_max - bbox.x_min - obj.width) < PRECISION_ERROR &&
            Math.abs(bbox.y_max - bbox.y_min - obj.height) < PRECISION_ERROR
          )
        })
        if (!obj) {
          let id = tagId
          this._XYXYFormatToXYWH(id, bbox)
          tags[fileName][id] = bbox
        }
      })
    } else {
      tags[fileName] = {}
      newTags.forEach(bbox => {
        let id = tagId
        this._XYXYFormatToXYWH(id, bbox)
        tags[fileName][id] = bbox
      })
    }
  }

  uploadTags = tagFile => {
    let tags = { ...this.state.tags }
    let newTags = {}
    let reader = new FileReader()
    reader.onload = e => {
      let data = JSON.parse(e.target.result)
      let entries = Object.entries(data)
      newTags = entries.reduce((acc, [key, value]) => {
        if (this._tagFormat(value) === 'xywh') {
          this._addXYWHTags(acc, key, value)
        } else {
          this._addXYXYTags(acc, key, value)
        }
        return acc
      }, tags)
      this.setState({ tags: newTags }, this.saveState)
    }
    reader.readAsText(tagFile)
  }

  _changeCurrentImage = imageName => {
    this.setState(prevState => {
      return {
        currentImageIndex: prevState.images.indexOf(imageName)
      }
    })
  }

  addTag = () => {
    const id = tagId
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage.name)
      const newTag = {
        x: 0.14,
        y: 0.14,
        name: `tag${id}`,
        id,
        width: this.state.bbWidth,
        height: this.state.bbHeight
      }
      return {
        tags: {
          ...prevState.tags,
          [currentImage]: {
            ...currentImageTags,
            [id]: newTag
          }
        }
      }
    }, this.saveState)
  }

  repeatTag = name => {
    const id = tagId
    const newTag = {
      x: 0.14,
      y: 0.14,
      name: `tag${id}`,
      id,
      width: this.state.bbWidth,
      height: this.state.bbHeight
    }
    tagId += 1

    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage)

      return {
        tags: {
          ...prevState.tags,
          [currentImage]: {
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
      const currentImageTags = getImageTags(prevState, currentImage)

      return {
        tags: {
          ...prevState.tags,
          [currentImage]: { ...currentImageTags, [tag.id]: tag }
        }
      }
    }, this.saveState)
  }

  removeTag = id => {
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const currentImageTags = getImageTags(prevState, currentImage)

      delete currentImageTags[id]

      return {
        tags: {
          ...prevState.tags,
          [currentImage]: { ...currentImageTags }
        }
      }
    }, this.saveState)
  }

  removeCurrentTags = () => {
    this.setState(prevState => {
      const currentImage = getCurrentImage(prevState)
      const tags = prevState.tags
      delete tags[currentImage]
      return {
        tags: tags
      }
    }, this.saveState)
  }

  _uploadedListRowRenderer = ({ index, key, style }) => {
    const imageName = this.state.images[index]
    const currentImage = getCurrentImage(this.state)
    const isCurrentImage = imageName === currentImage
    const isProcessed = isImageProcessed(this.state, imageName)
    return (
      <div key={key} style={style}>
        <div
          className={isCurrentImage ? 'list-item selected-image-row' : 'list-item'}
          onClick={() => this._changeCurrentImage(imageName)}
        >
          <div className="image-item">
            <img
              className="thumbnail"
              src={getThumbnailUrl(this.props.match.params.project_id, imageName)}
              alt={imageName}
            />
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
    const imageName = getCurrentImage(this.state)
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
    const toDownload = entries.reduce((acc, [key, value]) => {
      let values = Object.values(value)
      let data
      if (this.state.tagFormat !== 'xywh') {
        data = values.map(({ x, y, width, height, id, name }) => ({
          x_min: x,
          y_min: y,
          x_max: x + width,
          y_max: y + height,
          label: name
        }))
      } else {
        data = values.map(({ x, y, width, height, id, name }) => ({
          x,
          y,
          width,
          height,
          label: name
        }))
      }
      return { ...acc, [key]: data }
    }, {})
    return JSON.stringify(toDownload)
  }

  _cleanAllTags = e => {
    this.setState(() => {
      tagId = 0
      return { tags: {} }
    }, this.saveState)
  }

  handleTagFormatChange = changeEvent => {
    this.setState({
      tagFormat: changeEvent.target.value
    })
  }

  handleWidthBBChange = value => {
    this.setState({
      bbWidth: value / 100
    })
  }

  handleHeightBBChange = value => {
    this.setState({
      bbHeight: value / 100
    })
  }

  getImages = () => {
    const projectId = this.props.match.params.project_id
    return axios.get(`${API_URL}/projects/${projectId}/images`).then(response => {
      this.setState(prevState => {
        const images = [...new Set([...prevState.images, ...response.data.images])]
        const imageNames = images.sort((aImg, bImg) => {
          return aImg.localeCompare(bImg)
        })
        return { 
          images: imageNames,
          totalImages:  response.data.total_images}
      })
    })
  }
  resetSettings = () => {
    this.setState({
      bbHeight: DEFAULT_HEIGHT,
      bbWidth: DEFAULT_WIDTH,
      tagFormat: DEFAULT_TAG_VALUE
    })
  }

  componentWillMount() {
    const loaded = loadFromLocalStorage()
    if (loaded) {
      tagId = loaded.tagId
      delete loaded.tagId
      this.setState(loaded)
    }
  }

  componentDidMount() {
    this.getImages().then(() => {
      let intervalId = setInterval(() => {
        if (this.state.totalImages > this.state.images.length) {
          this.getImages()
          console.log('ejecuta')
        } else {
          clearInterval(intervalId)
          intervalId = null
          console.log('termino')
        }
      }, 3000)
    })
  }

  render() {
    const projectId = this.props.match.params.project_id
    const currentImage = getCurrentImage(this.state)
    const currentImageTags = currentImage ? getImageTagsAsList(this.state, currentImage) : []
    const recentTags = getRecentTags(this.state)
    const imageNames = this.state.images

    return (
      <Grid container className="Project">
        <Grid item xs={12}>
          <Grid container>
            <Grid item>
              <h1 className="title">{'\uD83C\uDF4A'} Taggerine</h1>
            </Grid>
            <Grid item>
              <button
                onClick={() => this.setState(prevState => ({ showSettings: !prevState.showSettings }))}
              >
                <CogIcon size={24} color="white" />
              </button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container id="Content" justify="center" spacing={16}>
            <Grid item key="right-panel" xs={3} id="right-panel">
              <Grid container>
                <Grid item>
                  <ImageUploader uploadImages={this.uploadImages} />
                </Grid>
                <Grid item>
                  <span className="image-counter">
                    {countTaggedImages(this.state)}/{this.state.images.length} images
                  </span>
                </Grid>
                <Grid item>
                  <AutoSizer>
                    {({ width, height }) => (
                      <List
                        overscanRowCount={10}
                        noRowsRenderer={() => <div className="image-list-empty">No files</div>}
                        rowCount={this.state.images.length}
                        rowHeight={130}
                        rowRenderer={this._uploadedListRowRenderer}
                        width={width}
                        height={height}
                        className="image-list"
                      />
                    )}
                  </AutoSizer>
                </Grid>
              </Grid>
            </Grid>
            <Grid item key="tagger" xs={6} id="tagger">
              <Grid container>
                <Grid item>
                  <AutoSizer>
                    {({ width, height }) => (
                      <div style={{ width, height }} className="autosized-tagger">
                        <button onClick={this.prevImage} disabled={imageNames.length <= 1}>
                          <ArrowLeftIcon />
                        </button>
                        {currentImage && (
                          <Tagger
                            image={getImageUrl(projectId, currentImage)}
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
                </Grid>
              </Grid>
            </Grid>
            <Grid item key="left-panel" xs={3} id="left-panel">
              {!this.state.showSettings && (
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
                        className="inner-top-right-pannel"
                      />
                    )}
                  </AutoSizer>
                </div>
              )}
              {this.state.showSettings && (
                <div id="settings">
                  <div id="settings-container" className="inner-top-right-pannel">
                    <div id="settings-header">Settings</div>
                    <div id="settings-content">
                      <div id="tag-format">
                        <span>Select you tag format for download: </span>
                        <div className="radio">
                          <label>
                            <input
                              type="radio"
                              value="xywh"
                              onChange={this.handleTagFormatChange}
                              checked={this.state.tagFormat === 'xywh'}
                            />
                            (x, y, width, height)
                          </label>
                        </div>
                        <div className="radio">
                          <label>
                            <input
                              type="radio"
                              value="xyxy"
                              onChange={this.handleTagFormatChange}
                              checked={this.state.tagFormat === 'xyxy'}
                            />
                            (x_min, y_min, x_max, y_max)
                          </label>
                        </div>
                      </div>
                      <div id="bounding-box-size">
                        <div id="width-container">
                          <span>Bounding box width:</span>
                          <div className="slider-container">
                            <SliderWithTooltip
                              value={this.state.bbWidth * 100}
                              tipFormatter={percentFormatter}
                              onChange={this.handleWidthBBChange}
                            />
                          </div>
                        </div>
                        <div id="height-container">
                          <span>Bounding box height:</span>
                          <div className="slider-container">
                            <SliderWithTooltip
                              value={this.state.bbHeight * 100}
                              tipFormatter={percentFormatter}
                              onChange={this.handleHeightBBChange}
                            />
                          </div>
                        </div>
                      </div>
                      <div id="bounding-box-buttons">
                        <button className="button" onClick={this.resetSettings}>
                          Reset
                        </button>
                        <button
                          className="button second-button"
                          onClick={() =>
                            this.setState(prevState => ({ showSettings: !prevState.showSettings }))
                          }
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item>
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
            </Grid>
            <Grid item>
              <UploadTags uploadTags={this.uploadTags} />
            </Grid>
            <Grid item>
              <a
                id="clean-tags"
                className="button button-link second-button"
                onClick={this._cleanAllTags}
              >
                <TrashIcon /> Clean tags
              </a>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    )
  }
}

export default Project
