import React from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'

import Dialog, {
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText
} from 'material-ui/Dialog'

const DialogHelper = ({ children, open, title, message, onConfirm, onCancel }) => (
  <Dialog
    open={open}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    {children || (
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
      </DialogContent>
    )}
    <DialogActions>
      {Boolean(onCancel) && (
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
      )}
      <Button onClick={onConfirm} color="primary">
        {Boolean(onCancel) ? 'Ok' : 'Close'}
      </Button>
    </DialogActions>
  </Dialog>
)

DialogHelper.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  allowCancel: PropTypes.bool,
  children: PropTypes.element,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func
}

export default DialogHelper
