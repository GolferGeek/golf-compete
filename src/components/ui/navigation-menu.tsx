"use client"

import * as React from "react"
import { 
  Box, 
  Button, 
  MenuItem, 
  Popper, 
  Grow, 
  Paper, 
  MenuList, 
  ClickAwayListener,
  ButtonProps
} from "@mui/material"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { styled } from '@mui/material/styles'
import Link from "next/link"

// Styled components
const NavButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

// Navigation Menu
export interface NavigationMenuProps {
  children?: React.ReactNode
  className?: string
}

const NavigationMenu = React.forwardRef<HTMLDivElement, NavigationMenuProps>(
  ({ children, className, ...props }, ref) => (
    <Box 
      ref={ref} 
      className={className} 
      sx={{ 
        position: 'relative', 
        zIndex: 10, 
        display: 'flex', 
        maxWidth: 'max-content', 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
      {...props}
    >
      {children}
    </Box>
  )
)
NavigationMenu.displayName = "NavigationMenu"

// Navigation Menu List
export interface NavigationMenuListProps {
  children?: React.ReactNode
  className?: string
}

const NavigationMenuList = React.forwardRef<HTMLDivElement, NavigationMenuListProps>(
  ({ children, className, ...props }, ref) => (
    <Box 
      ref={ref} 
      className={className} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'row', 
        listStyle: 'none', 
        margin: 0, 
        padding: 0, 
        gap: 1 
      }}
      component="ul"
      {...props}
    >
      {children}
    </Box>
  )
)
NavigationMenuList.displayName = "NavigationMenuList"

// Navigation Menu Item
const NavigationMenuItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ children, ...props }, ref) => (
    <Box component="li" ref={ref} sx={{ position: 'relative' }} {...props}>
      {children}
    </Box>
  )
)
NavigationMenuItem.displayName = "NavigationMenuItem"

// Navigation Menu Trigger
export interface NavigationMenuTriggerProps extends ButtonProps {
  children?: React.ReactNode
}

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  ({ children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const anchorRef = React.useRef<HTMLButtonElement>(null)

    // Sync the forwarded ref with our local ref
    React.useImperativeHandle(ref, () => anchorRef.current!, []);

    const handleToggle = () => {
      setOpen((prevOpen) => !prevOpen)
    }

    const handleClose = (event: Event | React.SyntheticEvent) => {
      if (
        anchorRef.current &&
        anchorRef.current.contains(event.target as HTMLElement)
      ) {
        return
      }
      setOpen(false)
    }

    return (
      <>
        <NavButton
          ref={anchorRef}
          onClick={handleToggle}
          endIcon={<KeyboardArrowDownIcon sx={{ 
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)'
          }} />}
          {...props}
        >
          {children}
        </NavButton>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom-start' ? 'left top' : 'left bottom',
              }}
            >
              <Paper sx={{ mt: 1, boxShadow: 3 }}>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                  >
                    {/* Simple menu items instead of trying to clone children */}
                    {React.Children.map(children, (child) => {
                      if (React.isValidElement(child)) {
                        return (
                          <MenuItem onClick={handleClose}>
                            {child}
                          </MenuItem>
                        );
                      }
                      return child;
                    })}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </>
    )
  }
)
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

// Navigation Menu Content
export interface NavigationMenuContentProps {
  children?: React.ReactNode
  className?: string
}

const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  ({ children, className, ...props }, ref) => (
    <Box 
      ref={ref} 
      className={className} 
      sx={{ 
        position: { md: 'absolute' }, 
        top: 0, 
        left: 0, 
        width: { xs: '100%', md: 'auto' },
        zIndex: 1
      }}
      {...props}
    >
      {children}
    </Box>
  )
)
NavigationMenuContent.displayName = "NavigationMenuContent"

// Navigation Menu Link
export interface NavigationMenuLinkProps {
  href: string
  children?: React.ReactNode
  className?: string
}

const NavigationMenuLink = ({ href, children, className, ...props }: NavigationMenuLinkProps) => (
  <Link href={href} passHref legacyBehavior>
    <a className={className} {...props}>
      <NavButton>
        {children}
      </NavButton>
    </a>
  </Link>
)
NavigationMenuLink.displayName = "NavigationMenuLink"

// Navigation Menu Viewport
export interface NavigationMenuViewportProps {
  children?: React.ReactNode
  className?: string
}

const NavigationMenuViewport = React.forwardRef<HTMLDivElement, NavigationMenuViewportProps>(
  ({ children, className, ...props }, ref) => (
    <Box 
      ref={ref} 
      className={className} 
      sx={{ 
        position: 'relative', 
        mt: 1.5, 
        overflow: 'hidden', 
        borderRadius: 1, 
        border: 1, 
        borderColor: 'divider', 
        boxShadow: 3
      }}
      {...props}
    >
      {children}
    </Box>
  )
)
NavigationMenuViewport.displayName = "NavigationMenuViewport"

// Navigation Menu Indicator
export interface NavigationMenuIndicatorProps {
  children?: React.ReactNode
  className?: string
}

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, NavigationMenuIndicatorProps>(
  ({ children, className, ...props }, ref) => (
    <Box 
      ref={ref} 
      className={className} 
      sx={{ 
        position: 'relative', 
        top: '100%', 
        zIndex: 1, 
        display: 'flex', 
        height: '1.5px', 
        alignItems: 'flex-end', 
        justifyContent: 'center', 
        overflow: 'hidden'
      }}
      {...props}
    >
      {children}
    </Box>
  )
)
NavigationMenuIndicator.displayName = "NavigationMenuIndicator"

export const navigationMenuTriggerStyle = () => ({
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
  lineHeight: '1.25rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'action.hover',
    color: 'text.primary',
  },
  '&:focus': {
    backgroundColor: 'action.focus',
    color: 'text.primary',
    outline: 'none',
  },
})

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
