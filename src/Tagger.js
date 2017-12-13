import React from 'react'
import Konva from 'konva'

import { createBoundingBox, createLabel } from './utils'

const MAX_HEIGHT = 800
const MAX_WIDTH = 700

let tagId = 0

class Tagger extends React.Component {
  state = {}

  addBoundingBox = e => {
    const id = `tag${tagId}`
    tagId += 1

    const boundingBox = createBoundingBox({ x: 100, y: 100, text: id, id },
      this.rearrengeBoundingBoxes, this.updateTag)
    this._layer.add(boundingBox)

    this._layer.draw()

    this.props.updateTag({name: id, id, x: boundingBox.x(), y: boundingBox.y(),
      width: boundingBox.width(), height: boundingBox.height()})

    this._boundingBoxes[id] = boundingBox
  }

  removeBoundingBox = tag => {
    this._boundingBoxes[tag.id].remove()
    this.props.removeTag(tag.id)
    this._layer.draw()
  }

  renameBoundingBox = e => {
    const currentTag = this.props.tags[e.target.id]
    currentTag.name = e.target.value
    this.props.updateTag(currentTag)
    const boundingBox = this._boundingBoxes[e.target.id]
    boundingBox.label.remove()
    const label = createLabel({ text: currentTag.name, color: boundingBox.color })
    boundingBox.add(label)
    boundingBox.label = label
    this._layer.draw()
  }

  repeatBoundingBox = tag => {
    const id = `tag${tagId}`
    tagId += 1
    const originalBoundingBox = this._boundingBoxes[tag.id]
    const boundingBox = createBoundingBox(
      {
        x: 100,
        y: 100,
        width: tag.width,
        height: tag.height,
        text: tag.name,
        id,
        color: originalBoundingBox.color
      },
      this.rearrengeBoundingBoxes,
      this.updateTag
    )
    this._layer.add(boundingBox)
    this._layer.draw()

    this.updateTag({name: id, id, x: boundingBox.x(), y: boundingBox.y(),
      width: boundingBox.width(), height: boundingBox.height()})
  }

  addBoundingBoxes = () => {
    Object.values(this.props.tags).forEach(({ x, y, width, height, name }) => {
      const id = `tag${tagId}`
      tagId += 1
      const boundingBox = createBoundingBox({ x, y, width, height, text: name, id }, 
        this.rearrengeBoundingBoxes, this.updateTag)
      this._layer.add(boundingBox)
      this._boundingBoxes[id] = boundingBox
    })
    this._layer.draw()
  }

  updateTag = (id, text, x, y, width, height) => {
    this.props.updateTag({id, name: text, x, y, width, height})
  }

  rearrengeBoundingBoxes = () => {
    const tags = Object.values(this._boundingBoxes)
    tags.sort((a, b) => {
      return b.height() * b.width() - a.height() * a.width()
    })
    tags.forEach((box, index) => {
      box.setZIndex(index + 1)
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
    this._boundingBoxes = {}
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
      for (let box of this._boundingBoxes) {
        box.remove()
      }
      this._boundingBoxes = {}
      this.addImage()
    } else if (prevProps.tags !== this.props.tags) {
      for (let box of this._boundingBoxes) {
        box.remove()
      }
      this.addBoundingBoxes()
    }
  }

  render() {
    return (
      <div>
        <div id="canvas-container" />
        <hr />
        <button onClick={this.addBoundingBox}>Add Bounding Box</button>
        <hr />
        <ul>
          {Object.values(this.props.tags).map(tag => (
            <li key={tag.id}>
              {
                <input
                  type="text"
                  id={tag.id}
                  defaultValue={tag.name}
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
