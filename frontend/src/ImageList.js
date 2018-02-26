import React from 'react'
import PropTypes from 'prop-types'
import LazyLoad from 'react-lazyload'

import { withStyles } from 'material-ui/styles'
import Typography from 'material-ui/Typography'
import Card, { CardMedia } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import Tooltip from 'material-ui/Tooltip'
import CancelIcon from 'material-ui-icons/Cancel'
import BeenhereIcon from 'material-ui-icons/Beenhere'

const styles = theme => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  card: { margin: 4, cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  media: { height: 120 },
  closeButton: { position: 'absolute', top: -10, right: -10 },
  tagIcon: { position: 'absolute', top: -12, left: -14 },
  activeImage: { background: 'black', padding: 1 }
})

const TaggedIcon = ({ display, classes }) =>
  display ? (
    <div className={classes.tagIcon}>
      <IconButton color="secondary">
        <BeenhereIcon />
      </IconButton>
    </div>
  ) : (
    <div />
  )

const ImageList = ({ imageList, selectedIdx, onSelect, onDelete, classes }) =>
  imageList.length ? (
    <div className={classes.list}>
      {imageList.map((image, index) => (
        <LazyLoad height={120} offset={1200} overflow unmountIfInvisible key={image.name}>
          <Tooltip className={classes.tooltip} placement="right-end" title={image.name}>
            <Card className={classes.card} onClick={() => onSelect(index)}>
              <div className={index === selectedIdx ? classes.activeImage : ''}>
                <TaggedIcon display={image.tags.length} classes={classes} />
                <div className={classes.closeButton}>
                  <IconButton
                    color="secondary"
                    onClick={e => {
                      e.stopPropagation()
                      onDelete(index)
                    }}
                  >
                    <CancelIcon />
                  </IconButton>
                </div>
                <CardMedia image={image.thumbnailURL} className={classes.media} />
              </div>
            </Card>
          </Tooltip>
        </LazyLoad>
      ))}
    </div>
  ) : (
    <Typography component="p" align="center" color="secondary">
      No images uploaded
    </Typography>
  )

ImageList.propTypes = {
  imageList: PropTypes.array,
  selectedIdx: PropTypes.number,
  onSelect: PropTypes.func,
  onDelete: PropTypes.func,
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(ImageList)
