import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer, List } from 'react-virtualized'

const recentTagListRowRenderer = (tagList, onSelect) => ({ index, key, style }) => {
  const tag = tagList[index]
  return (
    <div className="recentTag list-item" key={key} style={style}>
      <a className="button button-link" onClick={() => onSelect(tag)}>
        {tag}
      </a>
    </div>
  )
}

const RecentTagList = ({ tagList, onSelect }) =>
  <AutoSizer>
    {({ width, height }) => (
      <List
        overscanRowCount={10}
        noRowsRenderer={() => <div className="tag-list-empty">No recent tags</div>}
        rowCount={tagList.length}
        rowHeight={50}
        rowRenderer={recentTagListRowRenderer(tagList, onSelect)}
        width={width}
        height={height}
        className="inner-top-right-pannel"
      />
    )}
  </AutoSizer>

RecentTagList.propTypes = {
  tagList: PropTypes.array,
  onSelect: PropTypes.func,
}

export default RecentTagList
