// @flow
import * as React from 'react';

import muiDecorator from '../ThemeDecorator';
import paperDecorator from '../PaperDecorator';

import MainFrameToolbar, {
  type MainFrameToolbarProps,
  type ToolbarInterface,
} from '../../MainFrame/Toolbar';
import IconButton from '../../UI/IconButton';
import DebugIcon from '../../UI/CustomSvgIcons/Debug';

export default {
  title: 'MainFrameToolbar',
  component: MainFrameToolbar,
  decorators: [paperDecorator, muiDecorator],
};

const fakeEditorToolbar = (
  <span
    style={{
      flex: 1,
      display: 'flex',
      justifyContent: 'flex-end',
    }}
  >
    <IconButton size="small" tooltip={'Test tooltip'} color="default">
      <DebugIcon />
    </IconButton>
    <IconButton size="small" tooltip={'Test tooltip'} color="default">
      <DebugIcon />
    </IconButton>
    <IconButton size="small" tooltip={'Test tooltip'} disabled color="default">
      <DebugIcon />
    </IconButton>
    <IconButton size="small" tooltip={'Test tooltip'} color="default">
      <DebugIcon />
    </IconButton>
  </span>
);

const defaultProps: MainFrameToolbarProps = {
  showProjectButtons: true,
  toggleProjectManager: () => {},
  exportProject: () => {},

  onPreviewWithoutHotReload: () => {},
  onOpenDebugger: () => {},
  onNetworkPreview: () => {},
  onHotReloadPreview: () => {},
  setPreviewOverride: () => {},
  canDoNetworkPreview: true,
  isPreviewEnabled: false,
  hasPreviewsRunning: false,
  previewState: {
    isPreviewOverriden: false,
    previewLayoutName: null,
    previewExternalLayoutName: null,
    overridenPreviewLayoutName: null,
    overridenPreviewExternalLayoutName: null,
  },
};

export const NoProjectOpen = () => (
  <MainFrameToolbar {...defaultProps} showProjectButtons={false} />
);

export const NoProjectOpenWithFakeButtons = () => {
  const toolbar = React.useRef<?ToolbarInterface>(null);
  React.useEffect(
    () => {
      if (toolbar.current) {
        toolbar.current.setEditorToolbar(fakeEditorToolbar);
      }
    },
    [toolbar]
  );
  return (
    <MainFrameToolbar
      {...defaultProps}
      showProjectButtons={false}
      ref={toolbar}
    />
  );
};

export const ProjectOpen = () => {
  return <MainFrameToolbar {...defaultProps} isPreviewEnabled />;
};

export const ProjectOpenPreviewDisabled = () => (
  <MainFrameToolbar
    {...defaultProps}
    previewState={{
      isPreviewOverriden: false,
      overridenPreviewExternalLayoutName: null,
      overridenPreviewLayoutName: null,
      previewExternalLayoutName: null,
      previewLayoutName: 'testLayout',
    }}
  />
);

export const ProjectOpenOnScene = () => (
  <MainFrameToolbar
    {...defaultProps}
    isPreviewEnabled
    previewState={{
      isPreviewOverriden: false,
      overridenPreviewExternalLayoutName: null,
      overridenPreviewLayoutName: null,
      previewExternalLayoutName: null,
      previewLayoutName: 'testLayout',
    }}
  />
);

export const ProjectOpenOnExternalLayout = () => (
  <MainFrameToolbar
    {...defaultProps}
    isPreviewEnabled
    previewState={{
      isPreviewOverriden: false,
      overridenPreviewExternalLayoutName: null,
      overridenPreviewLayoutName: null,
      previewExternalLayoutName: 'testExternalLayout',
      previewLayoutName: null,
    }}
  />
);

export const ProjectOpenPreviewOverridenOnScene = () => (
  <MainFrameToolbar
    {...defaultProps}
    isPreviewEnabled
    previewState={{
      isPreviewOverriden: true,
      overridenPreviewExternalLayoutName: null,
      overridenPreviewLayoutName: 'testLayout',
      previewExternalLayoutName: null,
      previewLayoutName: 'testLayout',
    }}
  />
);

export const ProjectOpenPreviewOverridenOnExternalLayout = () => (
  <MainFrameToolbar
    {...defaultProps}
    isPreviewEnabled
    previewState={{
      isPreviewOverriden: true,
      overridenPreviewExternalLayoutName: 'testExternalLayout',
      overridenPreviewLayoutName: 'testLayout',
      previewExternalLayoutName: 'testExternalLayout',
      previewLayoutName: 'testLayout',
    }}
  />
);

export const ProjectOpenWithFakeButtons = () => {
  const toolbar = React.useRef<?ToolbarInterface>(null);
  React.useEffect(
    () => {
      if (toolbar.current) {
        toolbar.current.setEditorToolbar(fakeEditorToolbar);
      }
    },
    [toolbar]
  );
  return <MainFrameToolbar {...defaultProps} ref={toolbar} isPreviewEnabled />;
};

export const ProjectOpenPreviewRunning = () => {
  return (
    <MainFrameToolbar {...defaultProps} isPreviewEnabled hasPreviewsRunning />
  );
};
