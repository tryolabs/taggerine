import React from 'react'
import PropTypes from 'prop-types'
import Input from 'material-ui/Input'
import IconButton from 'material-ui/IconButton'
import List, { ListItem, ListItemSecondaryAction } from 'material-ui/List'
import Typography from 'material-ui/Typography'
import CancelIcon from 'material-ui-icons/Cancel'
import RefreshIcon from 'material-ui-icons/Refresh'

const ImageTagList = ({ imageTags, onTagLabelChange, onRepeatTag, onRemoveTag }) =>
  imageTags.length ? (
    <List>
      {imageTags.map((imageTag, index) => (
        <ListItem divider={true} dense={true} key={index}>
          <Input
            disableUnderline={true}
            className="taglist-row-label"
            value={imageTag.label}
            onChange={e => onTagLabelChange(index, e.target.value)}
          />
          <ListItemSecondaryAction>
            <IconButton>
              <RefreshIcon
                onClick={() => {
                  onRepeatTag(imageTag.label)
                }}
              />
              <CancelIcon
                onClick={() => {
                  onRemoveTag(imageTag.id)
                }}
              />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  ) : (
    <Typography component="p" align="center" color="secondary">
      {' '}
      Image has no tags{' '}
    </Typography>
  )

ImageTagList.propTypes = {
  imageTags: PropTypes.array,
  onTagLabelChange: PropTypes.func,
  onRepeatTag: PropTypes.func,
  onRemoveTag: PropTypes.func
}

export default ImageTagList
