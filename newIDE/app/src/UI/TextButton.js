// @flow
import * as React from 'react';
import Button from '@material-ui/core/Button';
import { Spacer } from './Grid';
import { type ButtonInterface } from './Button';

type Props = {|
  label: React.Node,
  onClick: ?(ev: any) => void | Promise<void>,
  primary?: boolean,
  allowBrowserAutoTranslate?: boolean,
  disabled?: boolean,
  keyboardFocused?: boolean,
  fullWidth?: boolean,
  icon?: React.Node,
  style?: {|
    marginTop?: number,
    marginBottom?: number,
    marginLeft?: number,
    marginRight?: number,
    margin?: number,
    flexShrink?: 0,
  |},
  target?: '_blank',
  id?: ?string,
|};

/**
 * A "text" button based on Material-UI button.
 */
const TextButton = React.forwardRef<Props, ButtonInterface>(
  (
    {
      label,
      primary,
      icon,
      keyboardFocused,
      disabled,
      id,
      allowBrowserAutoTranslate = true,
      ...otherProps
    },
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <Button
        variant="text"
        size="small"
        translate={allowBrowserAutoTranslate ? 'yes' : 'no'}
        color={primary ? 'secondary' : 'default'}
        autoFocus={keyboardFocused}
        focusRipple={focusRipple}
        disabled={disabled}
        id={id}
        {...otherProps}
        ref={ref}
      >
        {icon}
        {icon && <Spacer />}
        {label}
      </Button>
    );
  }
);

export default TextButton;
