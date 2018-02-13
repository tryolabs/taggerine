import React from 'react'
import PropTypes from 'prop-types'

import CheckIcon from 'react-icons/lib/fa/check'
import { AutoSizer, List } from 'react-virtualized'

const imageListRowRenderer = (imageList, selectedIdx, onSelect) => ({ index, key, style }) => {
  const image = imageList[index]
  const isCurrentImage = index === selectedIdx
  const isProcessed = image.tags.length > 0
  return (
    <div key={key} style={style}>
      <div
        className={isCurrentImage ? 'list-item selected-image-row' : 'list-item'}
        onClick={() => onSelect(index)}
      >
        <div className="image-item">
          <img className="thumbnail" src={image.thumbnailURL} alt={image.name} />
          <span className="image-item-name">{image.name}</span>
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

const imagesTagged = imageList => imageList.filter(image => image.tags.length > 0).length

const ImageList = ({ imageList, selectedIdx, onSelect }) => (
  <AutoSizer>
    {({ width, height }) => (
      <div style={{ width: width, height: height }}>
        <span className="image-counter">
          {imagesTagged(imageList)}/{imageList.length} images
        </span>
        <List
          overscanRowCount={10}
          noRowsRenderer={() => <div className="image-list-empty">No files</div>}
          rowCount={imageList.length}
          rowHeight={130}
          rowRenderer={imageListRowRenderer(imageList, selectedIdx, onSelect)}
          width={width}
          height={height - 20}
          className="image-list"
        />
      </div>
    )}
  </AutoSizer>
)

ImageList.propTypes = {
  imageList: PropTypes.array,
  selectedIdx: PropTypes.number,
  onSelect: PropTypes.func
}

export default ImageList
