import React from 'react'
import Konva from 'konva'

import { createBoundingBox } from './utils'

import './Tagger.css'

class Tagger extends React.Component {
  addBoundingBoxes = () => {
    this.props.tags.forEach(({ x, y, width, height, name, id }) => {
      const boundingBox = createBoundingBox(
        { x: x*this._image.width(),y: y*this._image.height(), width: width*this._image.width(),
          height: height*this._image.height(), text: name, id },
        this.rearrengeBoundingBoxes,
        this.updateTag
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
      return (b.height() * b.width()) - (a.height() * a.width())
    })
    boundingBoxes.forEach((boundingBox, index) => {
      boundingBox.setZIndex(index + 1)
    })
  }

  updateTag = (unconvertedObject) => {
    const convertedObject = {
      x: unconvertedObject.x/this._image.width(),
      y: unconvertedObject.y/this._image.height(),
      width: unconvertedObject.width/this._image.width(),
      height: unconvertedObject.height/this._image.height(),
      id: unconvertedObject.id,
      name: unconvertedObject.name
    }
    this.props.updateTag(convertedObject)
  }

  addImage() {
    var img = new Image()
    img.onload = e => {
      const height = img.height
      const width = img.width

      const heightScaleFactor = this.props.height / img.height
      const widthScaleFactor = this.props.width / img.width
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
        height: newHeight
      })
      // add the shape to the layer
      this._layer.add(this._image)
      this._image.setZIndex(0)
      this.addBoundingBoxes()
    }
    img.src = this.props.image
  }

  componentDidMount() {
    this._stage = new Konva.Stage({
      container: '#canvas-container',
      width: this.props.width,
      height: this.props.height
    })

    this._layer = new Konva.Layer()
    this._stage.add(this._layer)

    this.addImage()

    this._boundingBoxes = {}
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.image !== this.props.image ||
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this._image.remove()

      Object.values(this._boundingBoxes).forEach(boundingBox => boundingBox.remove())
      this._boundingBoxes = {}

      this.addImage()
    } else if (prevProps.tags !== this.props.tags) {
      Object.values(this._boundingBoxes).forEach(boundingBox => boundingBox.remove())
      this._boundingBoxes = {}
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
