"use client"

import * as React from "react"
import {
  Dialog as MuiDialog,
  DialogProps as MuiDialogProps,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { styled } from '@mui/material/styles'

// Styled components
const StyledDialog = styled(MuiDialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1, 2, 2),
  },
}))

// Dialog component
export type DialogProps = MuiDialogProps

const Dialog = ({ children, ...props }: DialogProps) => (
  <StyledDialog {...props}>{children}</StyledDialog>
)
Dialog.displayName = "Dialog"

// Dialog Title component
export interface DialogTitleProps {
  children?: React.ReactNode
  onClose?: () => void
}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogTitleProps>(
  ({ children, onClose, ...props }, ref) => (
    <DialogTitle ref={ref} {...props} sx={{ m: 0, p: 2 }}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  )
)
DialogHeader.displayName = "DialogHeader"

// Dialog Content component
export interface DialogContentProps {
  children?: React.ReactNode
}

export const DialogBody = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, ...props }, ref) => (
    <DialogContent ref={ref} {...props}>
      {children}
    </DialogContent>
  )
)
DialogBody.displayName = "DialogBody"

// Dialog Description component
export interface DialogDescriptionProps {
  children?: React.ReactNode
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ children, ...props }, ref) => (
    <DialogContentText ref={ref} {...props}>
      {children}
    </DialogContentText>
  )
)
DialogDescription.displayName = "DialogDescription"

// Dialog Footer component
export interface DialogFooterProps {
  children?: React.ReactNode
}

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ children, ...props }, ref) => (
    <DialogActions ref={ref} {...props}>
      {children}
    </DialogActions>
  )
)
DialogFooter.displayName = "DialogFooter"

export { Dialog }
