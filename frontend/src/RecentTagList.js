import React from 'react'
import PropTypes from 'prop-types'
import Chip from 'material-ui/Chip'
import Typography from 'material-ui/Typography'

const RecentTagList = ({ tagList, onSelect }) =>
    tagList.length ?
    <div className="taglist-tagcontainer">
      {tagList.map((tag, index) => 
        <Chip
          key={index}
          className="taglist-tag"
          label={tag}
          onClick={() => onSelect(tag)}
        />
      )}
    </div>
    : <Typography component="p" align="center" color="secondary" > No recent tags </Typography>


RecentTagList.propTypes = {
  tagList: PropTypes.array,
  onSelect: PropTypes.func,
}

export default RecentTagList
