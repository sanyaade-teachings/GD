// @flow
import * as React from 'react';
import { Trans, t } from '@lingui/macro';
import Refresh from '@material-ui/icons/Refresh';
import { type StorageProvider, type SaveAsLocation } from '../ProjectsStorage';
import Dialog, { DialogPrimaryButton } from '../UI/Dialog';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import FlatButton from '../UI/FlatButton';
import TextField from '../UI/TextField';
import { type AuthenticatedUser } from '../Profile/AuthenticatedUserContext';
import generateName from '../Utils/ProjectNameGenerator';
import { type NewProjectSetup } from './CreateProjectDialog';
import IconButton from '../UI/IconButton';
import { ColumnStackLayout } from '../UI/Layout';
import { emptyStorageProvider } from '../ProjectsStorage/ProjectStorageProviders';
import { findEmptyPathInWorkspaceFolder } from '../ProjectsStorage/LocalFileStorageProvider/LocalPathFinder';
import SelectField from '../UI/SelectField';
import SelectOption from '../UI/SelectOption';
import CreateProfile from '../Profile/CreateProfile';
import Paper from '../UI/Paper';
import { Line } from '../UI/Grid';
import LeftLoader from '../UI/LeftLoader';
import {
  checkIfHasTooManyCloudProjects,
  MaxProjectCountAlertMessage,
} from '../MainFrame/EditorContainers/HomePage/BuildSection/MaxProjectCountAlertMessage';
import { SubscriptionSuggestionContext } from '../Profile/Subscription/SubscriptionSuggestionContext';
import optionalRequire from '../Utils/OptionalRequire';
import PreferencesContext from '../MainFrame/Preferences/PreferencesContext';
import Checkbox from '../UI/Checkbox';

const electron = optionalRequire('electron');
const remote = optionalRequire('@electron/remote');
const app = remote ? remote.app : null;

type Props = {|
  isOpening?: boolean,
  onClose: () => void,
  onCreate: NewProjectSetup => Promise<void>,
  sourceExampleName?: string,
  storageProviders: Array<StorageProvider>,
  authenticatedUser: AuthenticatedUser,
  isFromExample: boolean,
|};

const generateProjectName = (sourceExampleName: ?string) =>
  sourceExampleName
    ? `${generateName()} (${sourceExampleName})`
    : generateName();

type ResolutionOption = 'mobilePortrait' | 'mobileLandscape' | 'desktopHD';

const resolutionOptions: {
  [key: ResolutionOption]: {|
    label: MessageDescriptor,
    height: number,
    width: number,
    orientation: 'landscape' | 'portrait' | 'default',
  |},
} = {
  mobilePortrait: {
    label: t`Mobile portrait - 720x1280`,
    width: 720,
    height: 1280,
    orientation: 'portrait',
  },
  mobileLandscape: {
    label: t`Mobile landscape & Desktop - 1280x720`,
    width: 1280,
    height: 720,
    orientation: 'landscape',
  },
  desktopHD: {
    label: t`Desktop Full HD - 1920x1080`,
    width: 1920,
    height: 1080,
    orientation: 'default',
  },
};

const NewProjectSetupDialog = ({
  isOpening,
  onClose,
  onCreate,
  sourceExampleName,
  storageProviders,
  authenticatedUser,
  isFromExample,
}: Props): React.Node => {
  const { values } = React.useContext(PreferencesContext);
  const { openSubscriptionDialog } = React.useContext(
    SubscriptionSuggestionContext
  );
  const [projectNameError, setProjectNameError] = React.useState<?React.Node>(
    null
  );
  const [projectName, setProjectName] = React.useState<string>(() =>
    generateProjectName(sourceExampleName)
  );
  const [
    resolutionOption,
    setResolutionOption,
  ] = React.useState<ResolutionOption>('mobileLandscape');
  const [optimizeForPixelArt, setOptimizeForPixelArt] = React.useState<boolean>(
    false
  );
  const newProjectsDefaultFolder = app
    ? findEmptyPathInWorkspaceFolder(app, values.newProjectsDefaultFolder || '')
    : '';
  const [saveAsLocation, setSaveAsLocation] = React.useState<?SaveAsLocation>(
    null
  );
  const [storageProvider, setStorageProvider] = React.useState<StorageProvider>(
    () => {
      if (authenticatedUser.authenticated) {
        const cloudStorageProvider = storageProviders.find(
          ({ internalName }) => internalName === 'Cloud'
        );
        if (cloudStorageProvider) return cloudStorageProvider;
      }

      const localFileStorageProvider = storageProviders.find(
        ({ internalName }) => internalName === 'LocalFile'
      );
      if (localFileStorageProvider) return localFileStorageProvider;

      return emptyStorageProvider;
    }
  );

  const needUserAuthentication =
    storageProvider.needUserAuthentication && !authenticatedUser.authenticated;
  const { limits } = authenticatedUser;
  const hasTooManyCloudProjects =
    storageProvider.internalName === 'Cloud' &&
    checkIfHasTooManyCloudProjects(authenticatedUser);

  const onValidate = React.useCallback(
    async () => {
      if (isOpening) return;
      if (needUserAuthentication) return;

      setProjectNameError(null);
      if (!projectName) {
        setProjectNameError(
          <Trans>Please enter a name for your project.</Trans>
        );
        return;
      }
      const { height, width, orientation } = resolutionOptions[
        resolutionOption
      ];
      await onCreate({
        projectName,
        storageProvider,
        saveAsLocation,
        height,
        width,
        orientation,
        optimizeForPixelArt,
      });
    },
    [
      isOpening,
      onCreate,
      needUserAuthentication,
      projectName,
      storageProvider,
      saveAsLocation,
      resolutionOption,
      optimizeForPixelArt,
    ]
  );

  const _onChangeProjectName = React.useCallback(
    (event, text) => {
      if (projectNameError) setProjectNameError(null);
      setProjectName(text);
    },
    [setProjectName, projectNameError]
  );

  return (
    <Dialog
      open
      title={<Trans>New Project</Trans>}
      id="project-pre-creation-dialog"
      maxWidth="sm"
      actions={[
        <FlatButton
          disabled={isOpening}
          key="cancel"
          label={<Trans>Cancel</Trans>}
          onClick={onClose}
        />,
        <LeftLoader isLoading={isOpening} key="create">
          <DialogPrimaryButton
            primary
            disabled={
              isOpening || needUserAuthentication || hasTooManyCloudProjects
            }
            label={<Trans>Create project</Trans>}
            onClick={onValidate}
            id="create-project-button"
          />
        </LeftLoader>,
      ]}
      cannotBeDismissed={isOpening}
      onRequestClose={onClose}
      onApply={onValidate}
    >
      <ColumnStackLayout noMargin>
        <TextField
          type="text"
          errorText={projectNameError}
          disabled={isOpening}
          value={projectName}
          onChange={_onChangeProjectName}
          floatingLabelText={<Trans>Project name</Trans>}
          endAdornment={
            <IconButton
              size="small"
              onClick={() =>
                setProjectName(generateProjectName(sourceExampleName))
              }
              tooltip={t`Generate random name`}
            >
              <Refresh />
            </IconButton>
          }
          autoFocus // Focus the name field when the dialog is opened.
        />
        <SelectField
          fullWidth
          disabled={isOpening}
          floatingLabelText={<Trans>Where to store this project</Trans>}
          value={storageProvider.internalName}
          onChange={(e, i, newValue: string) => {
            const newStorageProvider =
              storageProviders.find(
                ({ internalName }) => internalName === newValue
              ) || emptyStorageProvider;
            setStorageProvider(newStorageProvider);

            // Reset the save as location, to avoid mixing it between storage providers
            // and give a chance to the storage provider to set it to a default value.
            setSaveAsLocation(null);
          }}
        >
          {storageProviders
            // Filter out storage providers who are supposed to be used for storage initially
            // (for example: the "URL" storage provider, which is read only,
            // or the "DownloadFile" storage provider, which is not a persistent storage).
            .filter(
              storageProvider =>
                !!storageProvider.onRenderNewProjectSaveAsLocationChooser
            )
            .map(storageProvider => (
              <SelectOption
                key={storageProvider.internalName}
                value={storageProvider.internalName}
                primaryText={storageProvider.name}
                disabled={storageProvider.disabled}
              />
            ))}
          {!electron && (
            // Only show the ability to start a project without saving on the web-app.
            // On the local app, prefer to always have something saved so that the user is not blocked
            // when they want to add their own resources or use external editors.
            <SelectOption
              value={emptyStorageProvider.internalName}
              primaryText={t`Don't save this project now`}
            />
          )}
        </SelectField>
        {needUserAuthentication && (
          <Paper background="dark" variant="outlined">
            <Line justifyContent="center">
              <CreateProfile
                onLogin={authenticatedUser.onLogin}
                onCreateAccount={authenticatedUser.onCreateAccount}
                message={
                  <Trans>Create an account to store your project online.</Trans>
                }
              />
            </Line>
          </Paper>
        )}
        {!needUserAuthentication &&
          storageProvider.onRenderNewProjectSaveAsLocationChooser &&
          storageProvider.onRenderNewProjectSaveAsLocationChooser({
            projectName,
            saveAsLocation,
            setSaveAsLocation,
            newProjectsDefaultFolder,
          })}
        {!isFromExample && (
          <ColumnStackLayout noMargin>
            <SelectField
              fullWidth
              disabled={isOpening}
              floatingLabelText={<Trans>Resolution preset</Trans>}
              value={resolutionOption}
              onChange={(e, i, newValue: string) => {
                // $FlowExpectedError - new value can only be option values.
                setResolutionOption(newValue);
              }}
            >
              {Object.entries(resolutionOptions).map(([id, option]) => (
                // $FlowFixMe - Object.entries does not keep types.
                <SelectOption key={id} value={id} primaryText={option.label} />
              ))}
            </SelectField>
            <Checkbox
              checked={optimizeForPixelArt}
              label={<Trans>Optimize for Pixel Art</Trans>}
              onCheck={(e, checked) => {
                setOptimizeForPixelArt(checked);
              }}
              disabled={isOpening}
            />
          </ColumnStackLayout>
        )}
        {limits && hasTooManyCloudProjects ? (
          <MaxProjectCountAlertMessage
            limits={limits}
            onUpgrade={() =>
              openSubscriptionDialog({
                reason: 'Cloud Project limit reached',
              })
            }
          />
        ) : null}
      </ColumnStackLayout>
    </Dialog>
  );
};

export default NewProjectSetupDialog;
