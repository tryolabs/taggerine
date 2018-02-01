import React from 'react'
import Konva from 'konva'

import { createBoundingBox } from './utils'

import './Tagger.css'

class Tagger extends React.Component {
  addBoundingBoxes = () => {
    this.props.image.tags.forEach(({ x, y, width, height, label, id }) => {
      const boundingBox = createBoundingBox(
        { x: x*this._image.width(),y: y*this._image.height(), width: width*this._image.width(),
          height: height*this._image.height(), text: label, id },
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
      label: unconvertedObject.name
    }
    this.props.updateTag(convertedObject)
  }

  addImage() {
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
      this._image.position({x: 0, y: 0})
      this._image.size({width: newWidth, height: newHeight})

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

    this.addImage()

    this._boundingBoxes = {}
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.image.name !== this.props.image.name ||
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this._image.destroy()

      Object.values(this._boundingBoxes).forEach(boundingBox => boundingBox.remove())
      this._boundingBoxes = {}

      this.addImage()
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
