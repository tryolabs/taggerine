import React from 'react'
import PropTypes from 'prop-types'
import TrashIcon from 'react-icons/lib/fa/trash'
import RepeatIcon from 'react-icons/lib/fa/repeat'
import { AutoSizer, List } from 'react-virtualized'


const tagListRowRenderer = ({ imageTags, onTagLabelChange, onRepeatTag, onRemoveTag }) => ({ index, key, style }) => {
  const tag = imageTags[index]
  return (
    <div className="tag-item" key={key} style={style}>
      <input
        type="text"
        defaultValue={tag.label}
        onChange={e => onTagLabelChange(index, e.target.value)}
      />
      <button className="tag-button" onClick={() => onRepeatTag(tag.label)}>
        {' '}
        <RepeatIcon />
      </button>
      <button className="tag-button" onClick={() => onRemoveTag(tag.id)}>
        {' '}
        <TrashIcon />
      </button>
    </div>
  )
}

const ImageTagList = (props) =>
  <AutoSizer>
    {({ width, height }) => (
      <List
        key={2}
        overscanRowCount={10}
        noRowsRenderer={() => <div className="tag-list-empty">No tags</div>}
        rowCount={props.imageTags.length}
        rowHeight={50}
        rowRenderer={tagListRowRenderer(props)}
        width={width}
        height={height}
        className="tag-list"
      />
    )}
  </AutoSizer>

ImageTagList.propTypes = {
  imageTags: PropTypes.array,
  onTagLabelChange: PropTypes.func,
  onRepeatTag: PropTypes.func,
  onRemoveTag: PropTypes.func,
}

export default ImageTagList
