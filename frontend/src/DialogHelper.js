import React from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'

import Dialog, {
  DialogActions,
  DialogTitle,
} from 'material-ui/Dialog'

const DialogHelper = ({ children, open, title, allowCancel, onConfirm, onCancel }) =>
  <Dialog
    open={open}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    {children}
    <DialogActions>
      {Boolean(allowCancel) &&
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
      }
      <Button onClick={onConfirm} color="primary">
        {Boolean(allowCancel) ? "Ok" : "Close"}
      </Button>
    </DialogActions>
  </Dialog>

DialogHelper.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  allowCancel: PropTypes.bool,
  children: PropTypes.element,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}

export default DialogHelper
