import React, { Component } from 'react'
import { AutoSizer, List } from 'react-virtualized'

import saveAs from 'js-file-download'
import { loadFromLocalStorage, saveToLocalStorage } from './localStorage'

import ImageList from './ImageList'
import Tagger from './Tagger'
import ImageUploader from './ImageUploader'
import UploadTags from './UploadTags'
import TrashIcon from 'react-icons/lib/fa/trash'
import RepeatIcon from 'react-icons/lib/fa/repeat'
import DownloadIcon from 'react-icons/lib/fa/download'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import CheckIcon from 'react-icons/lib/fa/check'
import Slider, { createSliderWithTooltip } from 'rc-slider'
import axios from 'axios'

import './Project.css'
import Header from './Header'

const DEFAULT_HEIGHT = 0.14
const DEFAULT_WIDTH = 0.14
const DEFAULT_TAG_VALUE = 'xywh'
const PRECISION_ERROR = '0.000001'
const API_URL = process.env.REACT_APP_API_URL

let tagId = 0

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

  _mergeTags = (newTags, oldTags) => {
    const format = this._tagFormat(newTags)
    return newTags.map(newTag => {
      const tag = oldTags.find(oldTag => {
        if (oldTag.name !== newTag.label)
          return false
        if (format === 'xywh') {
          return (
            oldTag.x === newTag.x &&
            oldTag.y === newTag.y &&
            oldTag.width === newTag.width &&
            oldTag.height === newTag.height
          )
        } else {
          return (
            oldTag.x === newTag.x_min &&
            oldTag.y === newTag.y_min &&
            Math.abs(newTag.x_max - newTag.x_min - oldTag.width) < PRECISION_ERROR &&
            Math.abs(newTag.y_max - newTag.y_min - oldTag.height) < PRECISION_ERROR
          )
        }
      })

      if (Boolean(tag))
        return tag
      else {
        let id = tagId
        tagId += 1
        if (format === 'xyxy')
          this._XYXYFormatToXYWH(tagId, newTag)
        else
          newTag.id = id
        return newTag
      }
    })
  }

  _XYXYFormatToXYWH = (id, bbox) => {
    bbox.id = id
    bbox.x = bbox.x_min
    bbox.y = bbox.y_min
    bbox.width = bbox.x_max - bbox.x_min
    bbox.height = bbox.y_max - bbox.y_min
    delete bbox.x_min
    delete bbox.y_min
    delete bbox.y_max
    delete bbox.y_min
  }

  uploadTags = tagFile => {
    let reader = new FileReader()
    reader.onload = e => {
      let tags = new Set()
      const uploadedTags = JSON.parse(e.target.result)
      const images = this.state.images.map(image => {
        const newTags = uploadedTags[image.name]
        if (Boolean(newTags)) {
          image.tags = this._mergeTags(newTags, image.tags)
          tags = new Set([...tags, ...newTags.map(t => t.label)])
        }
        return image
      })
      this.setState({ images, tags }, this.saveState)
    }
    reader.readAsText(tagFile)
  }

  downloadTags = format => {
    const xywh = format.toUpperCase() === 'XYWH'
    const toDownload = this.state.images.reduce((acc, image) => {
      let data = image.tags
      if (xywh) {
        data = image.tags.map(({ x, y, width, height, id, label }) => ({
          x_min: x,
          y_min: y,
          x_max: x + width,
          y_max: y + height,
          label
        }))
      }
      return {...acc, [image.name]: data}
    }, {})
    const content = JSON.stringify(toDownload)
    saveAs(content, 'project-name.json', 'application/json;charset=utf-8')
  }

  addTag = () => {
    this.repeatTag(`tag${tagId}`)
  }

  repeatTag = name => {
    const newTag = {
      x: 0.14,
      y: 0.14,
      label: name,
      id: tagId,
      width: this.state.bbWidth,
      height: this.state.bbHeight
    }
    tagId += 1

    const images = [...this.state.images]
    images[this.state.currentImageIndex].tags.push(newTag)

    this.setState({ images }, this.saveState)
  }

  updateTag = tag => {
    const { images, currentImageIndex } = this.state
    const tags = [...images[currentImageIndex].tags]
    tags.forEach(t => {
      if (t.id === tag.id)
        t = tag
    })

    const newImages = [...this.state.images]
    newImages[currentImageIndex].tags = tags

    this.setState({ images: newImages }, this.saveState)
  }

  removeTag = id => {
    const { images, currentImageIndex } = this.state
    const tags = [...images[currentImageIndex].tags]
    tags.filter(t => t.id !== id)

    const newImages = [...this.state.images]
    newImages[currentImageIndex].tags = tags

    this.setState({ images: newImages }, this.saveState)
  }

  removeCurrentTags = () => {
    const { images, currentImageIndex } = this.state
    const newImages = [...images]
    newImages[currentImageIndex].tags = []

    this.setState({ images: newImages }, this.saveState)
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
          onChange={e => this.updateTag({ ...tag, label: e.target.value })}
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
    const { tags } = this.state
    const tag = tags[index]
    return (
      <div className="recentTag list-item" key={key} style={style}>
        <a className="button button-link" onClick={() => this.repeatTag(tag)}>
          {tag}
        </a>
      </div>
    )
  }

  cleanAllTags = e => {
    const tags = []
    const newImages = [...this.state.images]
    newImages.forEach(image => image.tags = [])

    this.setState({ images: newImages, tags }, this.saveState)
  }

  getImages = () => {
    const projectId = this.props.match.params.project_id
    const imagesAPIURL = `${API_URL}/projects/${projectId}/images`

    return axios.get(imagesAPIURL).then(response => {
      this.setState(prevState => {
        const images = [...new Set([...prevState.images, ...response.data.images])]
        .sort((aImg, bImg) => {
          return aImg.localeCompare(bImg)
        })
        .map(imageName => ({
          name: imageName,
          url: `${imagesAPIURL}/${imageName}`,
          thumbnailURL: `${imagesAPIURL}/thumbnail/${imageName}`,
          tags: []
        }))

        return {
          images,
          totalImages:  response.data.total_images}
      })
    })
  }

  handleImageSelection = currentImageIndex => this.setState({ currentImageIndex })

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
    const currentImage = getCurrentImage(this.state)
    const currentImageTags = currentImage ? getImageTagsAsList(this.state, currentImage) : []
    const recentTags = getRecentTags(this.state)
    const { images, currentImageIndex } = this.state

    return (
      <div className="Project">
        <Header
          onUploadImage={this.uploadImages}
          onImportTags={this.uploadTags}
          onExportTags={this.downloadTags}
          onDelete={this.cleanAllTags}
        />
        <div id="uploader">
          <ImageUploader uploadImages={this.uploadImages} />
          <span className="image-counter">
            {countTaggedImages(this.state)}/{this.state.images.length} images
          </span>
        </div>
        <div id="uploaded-list">
          <ImageList imageList={images} selectedIdx={currentImageIndex} onSelect={this.handleImageSelection}/>
        </div>
        <div id="tagger">
          <AutoSizer>
            {({ width, height }) => (
              <div style={{ width, height }} className="autosized-tagger">
                <button onClick={this.prevImage} disabled={images.length <= 1}>
                  <ArrowLeftIcon />
                </button>
                {currentImage && (
                  <Tagger
                    image={currentImage}
                    updateTag={this.updateTag}
                    width={width - 60}
                    height={height}
                  />
                )}
                <button onClick={this.nextImage} disabled={images.length <= 1}>
                  <ArrowRightIcon />
                </button>
              </div>
            )}
          </AutoSizer>
        </div>
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
          <button className="button" onClick={this.addTag} key={0} disabled={!images.length}>
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
            // href={`data:application/json;charset=utf-8,${encodeURIComponent(
            //   this._generateDownloadFile()
            // )}`}
          >
            <DownloadIcon /> Download Tags
          </a>
          <UploadTags uploadTags={this.uploadTags} />
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

export default Project
