import React from 'react'
import PropTypes from 'prop-types'
import Konva from 'konva'

import { createBoundingBox } from './utils'

import './Tagger.css'

class Tagger extends React.Component {
  addBoundingBoxes = () => {
    Object.values(this._boundingBoxes).forEach(boundingBox => {
      boundingBox.setDraggable(false)
      boundingBox.getChildren(element => element.setDraggable(false))
      boundingBox.remove()
    })
    this._boundingBoxes = {}

    this.props.image.tags.forEach(({ x, y, width, height, label, id }) => {
      const boxAttr = {
        x: x * this._image.width(),
        y: y * this._image.height(),
        width: width * this._image.width(),
        height: height * this._image.height(),
        text: label,
        id
      }
      const boundingBox = createBoundingBox(
        boxAttr,
        this.rearrengeBoundingBoxes,
        this.boxDragEnd,
        this.props.onDragging
      )
      this._layer.add(boundingBox)
      this._boundingBoxes[id] = boundingBox
    })
    this.rearrengeBoundingBoxes()
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

  boxDragEnd = box => {
    const tag = {
      x: box.x / this._image.width(),
      y: box.y / this._image.height(),
      width: box.width / this._image.width(),
      height: box.height / this._image.height(),
      id: box.id,
      label: box.label
    }
    this.props.onTagMove(tag)
  }

  addImage() {
    if (this._image) this._image.destroy()

    Konva.Image.fromURL(this.props.image.url, konvaImage => {
      const height = konvaImage.height()
      const width = konvaImage.width()

      const heightScaleFactor = this.props.height / height
      const widthScaleFactor = this.props.width / width
      const scaleFactor =
        heightScaleFactor < widthScaleFactor ? heightScaleFactor : widthScaleFactor

      const newHeight = Math.ceil(height * scaleFactor)
      const newWidth = Math.ceil(width * scaleFactor)

      this._stage.height(newHeight)
      this._stage.width(newWidth)

      this._image = konvaImage
      this._image.position({ x: 0, y: 0 })
      this._image.size({ width: newWidth, height: newHeight })

      this._layer.add(this._image)
      this._image.setZIndex(0)
      this.addBoundingBoxes()
    })
  }

  componentDidMount() {
    this._stage = new Konva.Stage({
      container: '#canvas-container',
      width: this.props.width,
      height: this.props.height
    })

    this._layer = new Konva.Layer()
    this._stage.add(this._layer)

    this._boundingBoxes = {}
    this.addImage()
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.image.name !== this.props.image.name ||
        prevProps.width !== this.props.width ||
        prevProps.height !== this.props.height) &&
      Boolean(this._image)
    ) {
      this.addImage()
    } else if (this._image) this.addBoundingBoxes()
  }

  render() {
    return (
      <div className="tagger">
        <div id="canvas-container" />
      </div>
    )
  }
}

Tagger.propTypes = {
  onDragging: PropTypes.func,
  onTagMove: PropTypes.func,
  image: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number
}

export default Tagger
