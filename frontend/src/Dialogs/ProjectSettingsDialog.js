import React from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'
import { DialogContent, DialogContentText } from 'material-ui/Dialog'
import { InputAdornment } from 'material-ui/Input'
import { MenuItem } from 'material-ui/Menu'
import DialogHelper from './DialogHelper'

/*
UploadImagesDialog: show dialog to upload images. The 'onDismiss' callback
could receive two types of input:

- An array of File objects representing the images to upload.
- No value if the dialog is canceled.
*/

class ProjectSettingsDialog extends React.Component {
  state = {bbWidth: 0, bbHeight: 0, bbNextAlign: ''}

  onConfirm = accept => () => {
      if(accept){  // New settings to parent
         this.props.onSettingsChange(this.state)
      }
      else{  // Retrieve old settings from parent
         this.setState(this.props.settings)
      }
      this.props.onDismiss()
  }

  componentWillReceiveProps(newProps) {
    if (!newProps.open)
      this.setState(newProps.settings)
  }

  handleWidthChange = evt => {
    var value = evt.target.value;
    if(value > 0 && value <= 100){
      this.setState({
        bbWidth: value
      })
    }
  }

  handleHeightChange = evt => {
    var value = evt.target.value;
    if(value > 0 && value <= 100){
      this.setState({
        bbHeight: value
      })
    }
  }

  handleNextAlignChange = (evt) => {this.setState({bbNextAlign: evt.target.value})}

  render() {
    return (
      <DialogHelper
        open={this.props.open}
        title="Project settings"
        allowCancel
        onConfirm={this.onConfirm(true)}
        onCancel={this.onConfirm(false)}
      >
        <DialogContent style={{ paddingBottom: 0 }}>
          <DialogContentText id="alert-dialog-description">
            <div className="bb-input-container">
              <TextField id="bb-width"
                         type="number"
                         label="Default box width"
                         InputLabelProps={{shrink: true, aligh: "center"}}
                         InputProps={{endAdornment:
                                      <InputAdornment position="end">%</InputAdornment>,
                                      className: "bb-input",
                                     }}
                         margin="normal"
                         value={this.state.bbWidth}
                         onChange={this.handleWidthChange}
              />
              <TextField id="bb-height"
                         type="number"
                         label="Default box height"
                         InputLabelProps={{shrink: true,}}
                         InputProps={{endAdornment:
                                      <InputAdornment position="end">%</InputAdornment>,
                                      className: "bb-input",
                                     }}
                         margin="normal"
                         value={this.state.bbHeight}
                         onChange={this.handleHeightChange}
              />
            </div>
            <TextField select
             className="bb-setting-select"
             label="New boxes alignment"
             InputLabelProps={{shrink: true,}}
             value={this.state.bbNextAlign}
             inputProps={{id: 'bb-next-align'}}
             onChange={this.handleNextAlignChange}
            >
              <MenuItem value='v'>Vertical</MenuItem>
              <MenuItem value='h'>Horizontal</MenuItem>
            </TextField>
          </DialogContentText>
        </DialogContent>
      </DialogHelper>
    )
  }
}

ProjectSettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
}

export default ProjectSettingsDialog
