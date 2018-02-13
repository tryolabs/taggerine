import React from 'react'
import PropTypes from 'prop-types'
import Radio, { RadioGroup } from 'material-ui/Radio'
import { FormLabel, FormControl, FormControlLabel } from 'material-ui/Form'
import DialogHelper from './DialogHelper'
import { DialogContent } from 'material-ui/Dialog'
import ExpansionPanel, {
  ExpansionPanelDetails,
  ExpansionPanelSummary
} from 'material-ui/ExpansionPanel'
import Typography from 'material-ui/Typography'
import ExpandMoreIcon from 'material-ui-icons/ExpandMore'

/*
ImportExportDialog: show a dialog to import or export tags. The 'onDismiss' callback
could receive three types of input:

- A File object to import tags from
- A string representing the format selected for export the tags
- No value if the dialog is canceled
*/

const initialState = {
  format: 'XYWH',
  file: null,
  operation: null
}

class ImportExport extends React.Component {
  state = initialState

  onFormatChange = (_, format) => this.setState({ format })
  onFilesSelected = event => {
    event.preventDefault()
    let file = event.target.files[0]
    this.setState({ file })
  }

  onPanelExpaned = panel => (_, expanded) => this.setState({ operation: expanded ? panel : null })

  onConfirm = confirm => () => {
    if (!confirm) this.props.onDismiss()
    else {
      const { operation, file, format } = this.state

      if (operation === 'import' && Boolean(file)) this.props.onDismiss(file)
      else if (operation === 'export') this.props.onDismiss(format)
      else this.props.onDismiss()
    }
  }

  componentWillReceiveProps(newProps) {
    if (!newProps.open) this.setState(initialState)
  }

  render() {
    const operation = this.state.operation
    return (
      <DialogHelper
        open={this.props.open}
        title="Import / Export"
        allowCancel
        onConfirm={this.onConfirm(true)}
        onCancel={this.onConfirm(false)}
      >
        <DialogContent style={{ padding: 10 }}>
          <ExpansionPanel
            expanded={operation === 'import'}
            onChange={this.onPanelExpaned('import')}
          >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Import</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <Typography>
                <input onChange={this.onFilesSelected} accept=".json" multiple type="file" />
              </Typography>
            </ExpansionPanelDetails>
          </ExpansionPanel>
          <ExpansionPanel
            expanded={operation === 'export'}
            onChange={this.onPanelExpaned('export')}
          >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Export</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <FormControl>
                <FormLabel focused>Format: select the content format</FormLabel>
                <RadioGroup
                  aria-label="format"
                  name="format"
                  value={this.state.format}
                  onChange={this.onFormatChange}
                >
                  <FormControlLabel
                    value="XYWH"
                    control={<Radio />}
                    label="Top left, width and height (x, y, width, height)"
                  />
                  <FormControlLabel
                    value="XYXY"
                    control={<Radio />}
                    label="Top left, bottom right (x_min, y_min, x_max, y_max)"
                  />
                </RadioGroup>
              </FormControl>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </DialogContent>
      </DialogHelper>
    )
  }
}

ImportExport.propTypes = {
  open: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired
}

export default ImportExport
