"use client"

import * as React from "react"
import { FormLabel, FormLabelProps } from "@mui/material"
import { styled } from '@mui/material/styles'

// Styled FormLabel component
const StyledLabel = styled(FormLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: "1.25rem",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  "&.Mui-disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
}))

// Label component
export type LabelProps = FormLabelProps

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ ...props }, ref) => {
    return <StyledLabel ref={ref} {...props} />
  }
)

Label.displayName = "Label"

export { Label }
