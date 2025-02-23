// @flow

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import muiDecorator from '../../ThemeDecorator';
import EventsSheet from '../../../EventsSheet';
import DragAndDropContextProvider from '../../../UI/DragAndDrop/DragAndDropContextProvider';
import FixedHeightFlexContainer from '../../FixedHeightFlexContainer';
import { testProject } from '../../GDevelopJsInitializerDecorator';
import fakeResourceExternalEditors from '../../FakeResourceExternalEditors';
import { emptyStorageProvider } from '../../../ProjectsStorage/ProjectStorageProviders';

export default {
  title: 'EventsSheet/EventsSheet',
  component: EventsSheet,
  decorators: [muiDecorator],
};

export const DefaultNoScope = () => (
  <DragAndDropContextProvider>
    <FixedHeightFlexContainer height={500}>
      <EventsSheet
        project={testProject.project}
        scope={{ layout: testProject.testLayout }}
        globalObjectsContainer={testProject.project}
        objectsContainer={testProject.testLayout}
        events={testProject.testLayout.getEvents()}
        onOpenExternalEvents={action('Open external events')}
        resourceManagementProps={{
          getStorageProvider: () => emptyStorageProvider,
          onFetchNewlyAddedResources: async () => {},
          resourceSources: [],
          onChooseResource: () => Promise.reject('Unimplemented'),
          resourceExternalEditors: fakeResourceExternalEditors,
        }}
        onOpenLayout={action('open layout')}
        onOpenSettings={action('open settings')}
        setToolbar={() => {}}
        openInstructionOrExpression={action('open instruction or expression')}
        onCreateEventsFunction={action('create events function')}
        onBeginCreateEventsFunction={action('begin create events function')}
        isActive={true}
      />
    </FixedHeightFlexContainer>
  </DragAndDropContextProvider>
);

export const EmptyNoScope = () => (
  <DragAndDropContextProvider>
    <FixedHeightFlexContainer height={500}>
      <EventsSheet
        project={testProject.project}
        scope={{ layout: testProject.emptyLayout }}
        globalObjectsContainer={testProject.project}
        objectsContainer={testProject.emptyLayout}
        events={testProject.emptyLayout.getEvents()}
        onOpenExternalEvents={action('Open external events')}
        resourceManagementProps={{
          getStorageProvider: () => emptyStorageProvider,
          onFetchNewlyAddedResources: async () => {},
          resourceSources: [],
          onChooseResource: () => Promise.reject('Unimplemented'),
          resourceExternalEditors: fakeResourceExternalEditors,
        }}
        onOpenLayout={action('open layout')}
        onOpenSettings={action('open settings')}
        setToolbar={() => {}}
        openInstructionOrExpression={action('open instruction or expression')}
        onCreateEventsFunction={action('create events function')}
        onBeginCreateEventsFunction={action('begin create events function')}
        isActive={true}
      />
    </FixedHeightFlexContainer>
  </DragAndDropContextProvider>
);
