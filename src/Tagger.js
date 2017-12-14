import React from 'react'
import Konva from 'konva'

import { createBoundingBox } from './utils'

import './Tagger.css'

const MAX_HEIGHT = 800
const MAX_WIDTH = 700

class Tagger extends React.Component {
  addBoundingBoxes = () => {
    this.props.tags.forEach(({ x, y, width, height, name, id }) => {
      const boundingBox = createBoundingBox(
        { x, y, width, height, text: name, id },
        this.rearrengeBoundingBoxes,
        this.props.updateTag
      )
      this._layer.add(boundingBox)
      this._boundingBoxes[id] = boundingBox
    })
    this._layer.draw()
  }

  rearrengeBoundingBoxes = () => {
    const boundingBoxes = Object.values(this._boundingBoxes)
    boundingBoxes.sort((a, b) => {
      return b.height() * b.width() - a.height() * a.width()
    })
    boundingBoxes.forEach((boundingBox, index) => {
      boundingBox.setZIndex(index + 1)
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
      })
      // add the shape to the layer
      this._layer.add(this._image)
      this._image.setZIndex(0)
      this._layer.draw()
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

    this._boundingBoxes = {}
    this.addBoundingBoxes()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.image !== this.props.image) {
      this._image.remove()

      Object.values(this._boundingBoxes).forEach(boundingBox => boundingBox.remove())
      this._boundingBoxes = {}

      this.addImage()
      this.addBoundingBoxes()
    } else if (prevProps.tags !== this.props.tags) {
      Object.values(this._boundingBoxes).forEach(boundingBox => boundingBox.remove())
      this.addBoundingBoxes()
    }
  }

  render() {
    return (
      <div className="tagger">
        <div id="canvas-container" />
      </div>
    )
  }
}

export default Tagger
