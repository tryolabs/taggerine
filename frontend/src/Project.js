import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { AutoSizer } from 'react-virtualized'
import FileDrop from 'react-file-drop'

import saveAs from 'js-file-download'

import ImageTagList from './ImageTagList'
import DialogHelper from './Dialogs/DialogHelper'
import ImageList from './ImageList'
import RecentTagList from './RecentTagList'
import Tagger from './Tagger'
import axios from 'axios'

import Button from 'material-ui/Button'
import Card, { CardActions, CardContent } from 'material-ui/Card'

import AddIcon from 'material-ui-icons/Add'
import ClearIcon from 'material-ui-icons/Clear'

import './Project.css'
import './FileDrop.css'
import Header from './Header'
import InitKeyBindings from './KeyBindings'

const PRECISION_ERROR = '0.000001'
const API_URL = process.env.REACT_APP_API_URL

let tagId = 0

let lastTagPos = {}

let lastTagLabel = ''

let lastTagChange = 0

let lastTagSave = 0

let syncTagsInterval = null

let dragging = false

class Project extends Component {
  state = {
    project_id: this.props.match.params.project_id,
    projectName: '',
    images: [],
    totalImages: 0,
    tags: [],
    currentImageIndex: 0,
    tagFormat: 'xywh',
    confirmDialog: {
      visible: false,
      title: '',
      message: '',
      onConfirm: null
    },
    settings: {
      bbWidth: 14,
      bbHeight: 14,
      bbNextAlign: 'h'
    }
  }

  saveSettings = () => {
    var headers: { 'content-type': 'application/json' }
    axios.post(
      `${API_URL}/projects/${this.state.project_id}/settings`,
      this.state.settings,
      headers
    )
  }

  loadSettings = () =>
    axios.get(`${API_URL}/projects/${this.state.project_id}/settings`).then(response => {
      if (response.data.status !== 'ok') {
        throw response
      }
      this.setState({
        projectName: response.data.name,
        settings: response.data.settings ? response.data.settings : this.state.settings
      })
      return response
    })

  syncCurrentTagsDB = () => this.syncImageTagsDB(this.state.images[this.state.currentImageIndex])

  syncImageTagsDB = image => {
    if (lastTagChange <= lastTagSave) {
      return Promise.resolve()
    }
    lastTagSave = Date.now()
    var imgName = image.name
    var imgTags = image.tags
    var headers: { 'content-type': 'application/json' }
    return axios.post(
      `${API_URL}/projects/${this.state.project_id}/image/${imgName}/tags`,
      imgTags,
      headers
    )
  }

  syncAllImageTags = images => {
    var headers: { 'content-type': 'application/json' }
    return axios.post(`${API_URL}/projects/${this.state.project_id}/tags`, images, headers)
  }

  cleanAllTags = e => {
    const images = [...this.state.images].map(image => ({ ...image, tags: [] }))
    this.setState({ images, tags: [] })
    return axios.delete(`${API_URL}/projects/${this.state.project_id}/tags`).then(this.getTags)
  }

  /*
   * Set flag to sync tags and bounding boxes to the API DB
   */
  tagsChanged = () => {
    lastTagChange = Date.now()
  }

  componentWillMount() {
    // Persist selected project_id in localstorage for next app open
    window.localStorage.setItem('project_id', this.state.project_id)
  }

  componentDidMount() {
    this.loadSettings()
      .then(this.getImages)
      .then(this.getTags)
      .then(() => {
        let intervalId = setInterval(() => {
          if (this.state.totalImages > this.state.images.length) {
            this.getImages().then(this.getTags)
          } else {
            clearInterval(intervalId)
            intervalId = null
          }
        }, 3000)
      })
      .catch(this.onExit)

    // Periodically check sync with DB for current image Tags
    syncTagsInterval = setInterval(() => {
      if (!dragging && lastTagChange > lastTagSave && Date.now() - lastTagChange > 2000) {
        this.syncCurrentTagsDB().then(this.getTags)
      }
    }, 1000)

    InitKeyBindings(this.nextImage, this.prevImage, this.addTag, this.repeatLastTag)
  }

  componentWillUnmount() {
    clearInterval(syncTagsInterval)
  }

  nextImage = () => {
    this.syncCurrentTagsDB().then(this.getTags)
    this.setState(prevState => {
      const currentImageIndex =
        prevState.images.length > prevState.currentImageIndex + 1
          ? prevState.currentImageIndex + 1
          : 0
      return {
        currentImageIndex: currentImageIndex
      }
    })
  }

  prevImage = () => {
    this.syncCurrentTagsDB().then(this.getTags)
    this.setState(prevState => {
      const currentImageIndex =
        prevState.currentImageIndex > 0
          ? prevState.currentImageIndex - 1
          : prevState.images.length - 1
      return {
        currentImageIndex: currentImageIndex
      }
    })
  }

  _tagFormat = newTags => {
    if (newTags.length > 0) {
      return 'x_min' in newTags[0] ? 'xyxy' : 'xywh'
    }
    return null
  }

  _equivalentTags(tag1, tag2) {
    if (tag1.label !== tag2.label) return false

    return (
      Math.abs(tag1.x - tag2.x) < PRECISION_ERROR &&
      Math.abs(tag1.y - tag2.y) < PRECISION_ERROR &&
      Math.abs(tag1.width - tag2.width) < PRECISION_ERROR &&
      Math.abs(tag1.height - tag2.height) < PRECISION_ERROR
    )
  }

  _mergeTags = (newTags, oldTags) => {
    // Convert newTags format if necessary
    const format = this._tagFormat(newTags)
    if (format === null) {
      return oldTags
    } else if (format === 'xyxy') {
      newTags = newTags.map(this._XYXYFormatToXYWH)
    }

    // Find if there's another equivalent Tag to avoid adding repeated ones
    newTags.forEach(newTag => {
      var isRepeated = oldTags.some(oldTag => this._equivalentTags(newTag, oldTag))

      if (!isRepeated) {
        newTag.id = ++tagId
        oldTags.push(newTag)
      }
    })
    return oldTags
  }

  _XYXYFormatToXYWH = bbox => {
    bbox.x = bbox.x_min
    bbox.y = bbox.y_min
    bbox.width = bbox.x_max - bbox.x_min
    bbox.height = bbox.y_max - bbox.y_min
    delete bbox.x_min
    delete bbox.y_min
    delete bbox.y_max
    delete bbox.y_min
    return bbox
  }

  /*
   * Calculate next bb position and size from previous bbox's values
   * Placement of next bbox can be configured to be vertically or horizontally aligned (bbNextAlign)
   * If canvas edges are reached, go to next row/column, or restart from top left corner.
   */
  _calculateNextBBox(tagPos) {
    var x, y, width, height

    x = this.state.settings.bbNextAlign === 'h' ? tagPos.x + tagPos.width : tagPos.x
    if (x + tagPos.width >= 1) {
      // outside screen horizontally, go to next row
      x = 0
      y = tagPos.y + tagPos.height
    } else {
      y = this.state.settings.bbNextAlign === 'v' ? tagPos.y + tagPos.height : tagPos.y
    }
    if (y + tagPos.height >= 1) {
      // outside screen vertically, go to next column
      x = tagPos.x + tagPos.width
      y = 0
    }
    if (x + tagPos.width >= 1) {
      // Still outside screen? go to top left corner
      x = 0
      y = 0
    }
    width = tagPos.width
    height = tagPos.height
    return { x, y, width, height }
  }

  calculateNextTagId = () => {
    // Find the maximum ID in all images' tags and add 1
    tagId =
      1 +
      this.state.images.reduce((prev_max_id, img) => {
        var img_max_id = img.tags.reduce(
          (prev, current) => (prev > current.id ? prev : current.id),
          0
        )
        return img_max_id > prev_max_id ? img_max_id : prev_max_id
      }, 0)
  }

  confirmDialogClose = confirmed => {
    if (confirmed && this.state.confirmDialog.onConfirm) {
      this.state.confirmDialog.onConfirm()
    }
    this.setState({ confirmDialog: { visible: false, title: '', message: '', onConfirm: null } })
  }

  confirmDialogOpen(title, message, onConfirm) {
    this.setState({
      confirmDialog: { visible: true, title, message, onConfirm, alert: onConfirm === undefined }
    })
  }

  onDrop = (files, e) => {
    var images = []
    var tagFiles = []
    var ignoredFiles = []

    // FileList doesn't allow .forEach()
    for (var i = 0; i < files.length; i++) {
      var file = files[i]
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        images.push(file)
      } else if (file.type === 'application/json') {
        tagFiles.push(file.name)
        this.uploadTags(file)
      } else {
        ignoredFiles.push(file.name)
      }
    }
    this.uploadImages(images)
    if (tagFiles.length) {
      this.confirmDialogOpen('Tag files imported', `Tags imported from JSON file(s): ${tagFiles}`)
    } else if (ignoredFiles.length) {
      this.confirmDialogOpen(
        'Files ignored',
        `Supported types: JPEG, PNG, JSON. The following files were ignored: ${ignoredFiles}.`
      )
    }
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
          .post(`${API_URL}/projects/${this.state.project_id}/images`, data, config)
          .then(this.getImages)
          .then(this.getTags)
        data = new FormData()
      }
    }
    axios
      .post(`${API_URL}/projects/${this.state.project_id}/images`, data, config)
      .then(this.getImages)
      .then(this.getTags)
  }

  uploadTags = tagFile => {
    let reader = new FileReader()
    reader.onload = e => {
      const uploadedTags = JSON.parse(e.target.result)
      const images = this.state.images.map(image => {
        const newTags = uploadedTags[image.name]
        if (newTags) {
          const result = { ...image, tags: this._mergeTags(newTags, image.tags) }
          return result
        } else return image
      })
      this.syncAllImageTags(images)
        .then(this.getImages)
        .then(this.getTags)
    }
    reader.readAsText(tagFile)
  }

  downloadTags = format => {
    const xyxy = format.toUpperCase() === 'XYXY'
    const toDownload = this.state.images.reduce((acc, image) => {
      let data = image.tags
      if (xyxy) {
        data = image.tags.map(({ x, y, width, height, id, label }) => ({
          x_min: x,
          y_min: y,
          x_max: x + width,
          y_max: y + height,
          label
        }))
      }
      return { ...acc, [image.name]: data }
    }, {})
    const content = JSON.stringify(toDownload)
    saveAs(content, `tags_${this.state.projectName}.json`, 'application/json;charset=utf-8')
  }

  addTag = () => this.repeatTag()

  repeatLastTag = () => this.repeatTag(lastTagLabel)

  repeatTag = label => {
    if (!label) label = `tag${tagId}`

    var x, y, width, height

    // Is there a previous bbox with this label?
    if (lastTagPos[label]) {
      // If a bbox with the same label exists, place new bbox next to it
      ({ x, y, width, height } = this._calculateNextBBox(lastTagPos[label]))
    } else {
      // First bbox with this label: place it in top left corner, with default w/h configured
      x = 0
      y = 0.04
      width = this.state.settings.bbWidth / 100
      height = this.state.settings.bbHeight / 100
    }
    const newTag = { x, y, width, height, label: label, id: ++tagId }
    lastTagPos[label] = newTag
    lastTagLabel = label

    const images = [...this.state.images]
    const newImage = images[this.state.currentImageIndex]
    images[this.state.currentImageIndex] = { ...newImage, tags: [...newImage.tags, newTag] }

    this.tagsChanged()
    this.setState({ images })
  }

  updateTag = tag => {
    const { images, currentImageIndex } = this.state
    const imageTags = [...images[currentImageIndex].tags]
    const tagIdx = imageTags.findIndex(t => t.id === tag.id)
    imageTags[tagIdx] = tag

    const newImages = [...images]
    newImages[currentImageIndex].tags = imageTags

    lastTagPos[tag.label] = tag
    lastTagLabel = tag.label

    this.tagsChanged()
    this.setState({ images: newImages })
  }

  updateTagLabel = (evt, tagIdx) => {
    const label = evt.target.value
    const { images, currentImageIndex } = this.state
    const image = images[currentImageIndex]

    const newTag = { ...image.tags[tagIdx], label }
    const newTags = [...image.tags]
    newTags[tagIdx] = newTag
    const newImage = { ...image, tags: newTags }
    const newImages = [...images]
    newImages[currentImageIndex] = newImage

    // Update information of last block for the new label
    lastTagPos[label] = newTag

    this.tagsChanged()
    this.setState({ images: newImages })
  }

  removeTag = id => {
    const { images, currentImageIndex } = this.state
    const imageTags = [...images[currentImageIndex].tags].filter(t => t.id !== id)

    const newImages = [...this.state.images]
    newImages[currentImageIndex].tags = imageTags

    this.tagsChanged()
    this.setState({ images: newImages })
  }

  confirmDeleteImageTags = () => {
    this.confirmDialogOpen(
      'Delete all tags from this image?',
      "Are you sure that you want to delete all bounding boxes from this image? This can't be undone.",
      // onConfirm
      () => {
        const { images, currentImageIndex } = this.state
        const image = images[currentImageIndex]
        const newImage = { ...image, tags: [] }
        const newImages = [...images]
        newImages[currentImageIndex] = newImage

        this.tagsChanged()
        this.setState({ images: newImages })
      }
    )
  }

  /*
   * Fetch all listed image files in API_URL, and mix them with the images saved in the state.
   * If an image file is not in the current state, load it anyway without tags.
   */
  getImages = () => {
    const projectId = this.state.project_id
    const imagesAPIURL = `${API_URL}/projects/${projectId}/images`

    return axios.get(imagesAPIURL).then(response => {
      this.setState(
        {
          // Fill image objects in the state from the API response
          images: response.data.images.map(imageObj => ({
            name: imageObj.name,
            url: `${imagesAPIURL}/${imageObj.name}`,
            thumbnailURL: `${imagesAPIURL}/thumbnail/${imageObj.name}`,
            tags: imageObj.tags ? imageObj.tags : []
          })),
          totalImages: response.data.total_images
        },
        this.calculateNextTagId
      )
    })
  }

  getTags = () => {
    const projectId = this.state.project_id
    const url = `${API_URL}/projects/${projectId}/tags`

    return axios.get(url).then(response => {
      this.setState({ tags: response.data.tags })
    })
  }

  handleImageSelection = currentImageIndex => {
    // sync before changing image if necessary
    this.syncCurrentTagsDB().then(this.getTags)
    this.setState({ currentImageIndex })
  }

  handleImageDelete = imageIndex => {
    var img = this.state.images[imageIndex]
    var imgName = img.name
    this.syncImageTagsDB(img) // sync before deleting if necessary

    axios
      .delete(`${API_URL}/projects/${this.state.project_id}/images/${imgName}`)
      .then(this.getTags)

    var newState = { images: [...this.state.images] }
    newState.images.splice(imageIndex, 1)
    newState.totalImages = newState.images.length

    // Move current image in case we just deleted it
    if (imageIndex === this.state.currentImageIndex)
      newState.currentImageIndex = imageIndex === 0 ? 0 : imageIndex - 1

    this.setState(newState)
    return false
  }

  onSettingsChange = newSettings => {
    this.setState({ settings: newSettings }, this.saveSettings)
  }

  onExit = () => {
    if (this.state.images.length) {
      this.syncImageTagsDB(this.state.images[this.state.currentImageIndex])
    }
    window.localStorage.removeItem('project_id')
    this.setState({ project_id: null })
  }

  onDragging = isDragging => (dragging = isDragging)

  render() {
    const { images, currentImageIndex, tags, confirmDialog } = this.state
    const currentImage = images[currentImageIndex]
    const currentImageTags = currentImage ? currentImage.tags : []

    // Check exit project
    return this.state.project_id === null ? (
      <Redirect to="/" />
    ) : (
      <div className="Project">
        <FileDrop frame={document} onDrop={this.onDrop}>
          Drop images or JSON files here to import them to the project...
        </FileDrop>
        <DialogHelper
          open={confirmDialog.visible}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => this.confirmDialogClose(true)}
          onCancel={confirmDialog.alert ? null : () => this.confirmDialogClose(false)}
        />
        <Header
          currentProjectName={this.state.projectName}
          onUploadImage={this.uploadImages}
          onImportTags={this.uploadTags}
          onExportTags={this.downloadTags}
          onDelete={this.cleanAllTags}
          onExit={this.onExit}
          onSettingsChange={this.onSettingsChange}
          settings={this.state.settings}
        />
        <Card id="uploaded-list">
          <CardContent>
            <ImageList
              imageList={images}
              selectedIdx={currentImageIndex}
              onSelect={this.handleImageSelection}
              onDelete={this.handleImageDelete}
            />
          </CardContent>
        </Card>
        <div id="tagger">
          <AutoSizer>
            {({ width, height }) => (
              <div style={{ width, height }} className="autosized-tagger">
                {currentImage && (
                  <Tagger
                    image={currentImage}
                    onDragging={this.onDragging}
                    onTagMove={this.updateTag}
                    width={width - 60}
                    height={height}
                  />
                )}
              </div>
            )}
          </AutoSizer>
        </div>
        <Card id="taglist-recentlist">
          <CardContent className="taglist-cardcontent">
            <RecentTagList tagList={tags} onSelect={this.repeatTag} />
          </CardContent>
          <CardActions className="taglist-cardactions">
            <Button color="primary" onClick={this.addTag} disabled={!images.length}>
              <AddIcon />
            </Button>
          </CardActions>
        </Card>
        <Card id="taglist-imagetags">
          <CardContent className="taglist-cardcontent">
            <ImageTagList
              imageTags={currentImageTags}
              onTagLabelChange={this.updateTagLabel}
              onRepeatTag={this.repeatTag}
              onRemoveTag={this.removeTag}
            />
          </CardContent>
          <CardActions className="taglist-cardactions">
            <Button
              color="primary"
              onClick={this.confirmDeleteImageTags}
              disabled={!currentImageTags.length}
            >
              <ClearIcon />
            </Button>
          </CardActions>
        </Card>
      </div>
    )
  }
}

export default Project
