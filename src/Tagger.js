import React from 'react'
import Konva from 'konva'

import { createBoundingBox, createLabel } from './utils'

const MAX_HEIGHT = 800
const MAX_WIDTH = 700

let tagId = 0

class Tagger extends React.Component {
  state = {
    tags: []
  }

  addBoundingBox = e => {
    const id = `tag${tagId}`
    tagId += 1

    const boundingBox = createBoundingBox({ x: 100, y: 100, text: id, id }, [this.rearrengeBoundingBoxes])
    this._layer.add(boundingBox)

    this._layer.draw()

    this.setState(prevState => ({
      ...prevState,
      tags: [...prevState.tags, { text: id, box: boundingBox, id, color: boundingBox.color }]
    }), this.rearrengeBoundingBoxes)
  }

  removeBoundingBox = tag => {
    const newTags = this.state.tags.filter(obj => tag.id !== obj.id)
    tag.box.remove()
    this.setState({ tags: newTags }, this.rearrengeBoundingBoxes)
    this._layer.draw()
  }

  renameBoundingBox = e => {
    const tag = this.state.tags.filter(obj => e.target.id === obj.id)[0]
    tag.text = e.target.value
    const boundingBox = tag.box
    boundingBox.label.remove()
    const label = createLabel({ text: tag.text, color: tag.color })
    boundingBox.add(label)
    boundingBox.label = label
    this._layer.draw()
  }

  repeatBoundingBox = tag => {
    const id = `tag${tagId}`
    tagId += 1
    const boundingBox = createBoundingBox({ x: 100, y: 100, width: tag.box.width(),
      height: tag.box.height(), text: tag.text, id, color: tag.color }, [this.rearrengeBoundingBoxes])
    this._layer.add(boundingBox)
    this._layer.draw()
    this.setState(prevState => ({
      ...prevState,
      tags: [...prevState.tags, { text: tag.text, box: boundingBox, id, color: boundingBox.color }]
    }), this.rearrengeBoundingBoxes)
  }

  addBoundingBoxes = () => {
    const newTags = []
    this.props.tags.forEach(({ x, y, width, height, name }) => {
      const id = `tag${tagId}`
      tagId += 1
      const boundingBox = createBoundingBox({ x, y, width, height, text: name, id },
        [this.rearrengeBoundingBoxes])
      this._layer.add(boundingBox)
      newTags.push({ text: name, box: boundingBox, id, color: boundingBox.color })
    })
    this.setState({tags: newTags})
    this.rearrengeBoundingBoxes()
    this._layer.draw()
  }

  rearrengeBoundingBoxes = () => {
    const tags = this.state.tags
    tags.sort((a, b) => {
      return (b.box.height()*b.box.width()) - (a.box.height()*a.box.width())
    })
    tags.forEach((tag, index) => {
      tag.box.setZIndex(index + 1)
    })
  }

  addImage() {
    var img = new Image()
    img.onload = e => {
      const height = img.height
      const width = img.width

      const heightScaleFactor = MAX_HEIGHT / img.height
      const widthScaleFactor = MAX_WIDTH / img.width
      const scaleFactor =
        heightScaleFactor < widthScaleFactor ? heightScaleFactor : widthScaleFactor

      const newHeight = Math.ceil(height * scaleFactor)
      const newWidth = Math.ceil(width * scaleFactor)

      this._stage.height(newHeight)
      this._stage.width(newWidth)
      this._image = new Konva.Image({
          x: 0,
          y: 0,
          image: img,
          width: newWidth,
          height: newHeight,
          name: 'currentImage'
        })
      // add the shape to the layer
      this._layer.add(this._image)
      this._image.setZIndex(0)
      this._layer.draw()
      this.addBoundingBoxes()
    }
    img.src = this.props.image
  }

  componentDidMount() {
    this._stage = new Konva.Stage({
      container: '#canvas-container',
      width: MAX_WIDTH,
      height: MAX_HEIGHT
    })

    this._layer = new Konva.Layer()
    this._stage.add(this._layer)

    this.addImage()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.image !== this.props.image) {
      this._image.remove()
      for (let tag of this.state.tags) {
        tag.box.remove()
      }
      this.props.updateTags(this.state.tags)
      this.setState({ tags: [] })
      this.addImage()
    }
  }

  componentWillUnmount() {
    this.props.updateTags(this.state.tags)
  }

  render() {
    return (
      <div>
        <div id="canvas-container" />
        <hr />
        <button onClick={this.addBoundingBox}>Add Bounding Box</button>
        <hr />
        <ul>
          {this.state.tags.map(tag => (
            <li key={tag.id}>
              {
                <input
                  type="text"
                  id={tag.id}
                  defaultValue={tag.text}
                  onChange={e => this.renameBoundingBox(e)}
                />
              }
              <button onClick={() => this.repeatBoundingBox(tag)}> Repeat Bounding Box</button>
              <button onClick={() => this.removeBoundingBox(tag)}> Remove Bounding Box</button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export default Tagger
