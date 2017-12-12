import React from 'react'
import Konva from 'konva'
import { scaleOrdinal, schemeCategory10 } from 'd3-scale'

import { createBoundingBox, createLabel } from './utils'

const MAX_HEIGHT = 800
const MAX_WIDTH = 700

let tagId = 0
const colors = scaleOrdinal(schemeCategory10)

class Tagger extends React.Component {
  state = {
    tags: []
  }

  addBoundingBox = e => {
    const tag = `tag${tagId}`
    tagId += 1
    const color = colors(tagId)

    const boundingBox = createBoundingBox({ x: 100, y: 100, tag, color })
    this._layer.add(boundingBox)

    this._layer.draw()

    this.setState(prevState => ({
      ...prevState,
      tags: [...prevState.tags, { name: tag, box: boundingBox, tag, color }]
    }))
  }

  removeBoundingBox = tag => {
    const shapes = this._layer.find(`.${tag}`)
    const newTags = this.state.tags.filter(obj => tag !== obj.name)
    for (let shape of shapes) {
      shape.remove()
    }
    this.setState({ tags: newTags })
    this._layer.draw()
  }

  renameBoundingBox = e => {
    const tag = this.state.tags.filter(obj => e.target.id === obj.name)[0]
    tag.tag = e.target.value
    const boundingBox = tag.box
    boundingBox.get('Label')[0].remove()
    boundingBox.add(createLabel({ text: e.target.value, color: tag.color }))
    this._layer.draw()
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
      // add the shape to the layer
      this._layer.add(
        new Konva.Image({
          x: 0,
          y: 0,
          image: img,
          width: newWidth,
          height: newHeight,
          name: 'currentImage'
        })
      )
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
    const container = this._stage.getContent()
    container.style.borderColor = 'black'
    container.style.borderWidth = '3px'
    container.style.borderStyle = 'solid'
    container.style.margin = 'auto'

    this._layer = new Konva.Layer()
    this._stage.add(this._layer)

    this.addImage()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.image !== this.props.image) {
      const images = this._layer.find('.currentImage')
      for (let image of images) {
        image.remove()
      }
      this.addImage()
      this.props.updateTags(this.state.tags)
      this.setState({ tags: [] })
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
            <li key={tag.name}>
              {
                <input
                  type="text"
                  id={tag.name}
                  defaultValue={tag.tag}
                  onChange={e => this.renameBoundingBox(e)}
                />
              }
              <button onClick={() => this.removeBoundingBox(tag.name)}> Remove Bounding Box</button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export default Tagger
