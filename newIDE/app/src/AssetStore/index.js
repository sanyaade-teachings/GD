// @flow
import * as React from 'react';
import { t, Trans } from '@lingui/macro';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Tune from '@material-ui/icons/Tune';
import SearchBar, { useShouldAutofocusSearchbar } from '../UI/SearchBar';
import DoubleChevronArrowLeft from '../UI/CustomSvgIcons/DoubleChevronArrowLeft';
import { Column, Line, Spacer } from '../UI/Grid';
import ScrollView from '../UI/ScrollView';
import Window from '../Utils/Window';
import {
  sendAssetOpened,
  sendAssetPackInformationOpened,
  sendAssetPackOpened,
} from '../Utils/Analytics/EventSender';
import {
  type AssetShortHeader,
  type PublicAssetPack,
  type PublicAssetPacks,
  type PrivateAssetPack,
} from '../Utils/GDevelopServices/Asset';
import { type PrivateAssetPackListingData } from '../Utils/GDevelopServices/Shop';
import {
  BoxSearchResults,
  type BoxSearchResultsInterface,
} from '../UI/Search/BoxSearchResults';
import { type SearchBarInterface } from '../UI/SearchBar';
import {
  AssetStoreFilterPanel,
  clearAllFilters,
} from './AssetStoreFilterPanel';
import { AssetStoreContext } from './AssetStoreContext';
import { AssetCard } from './AssetCard';
import { NoResultPlaceholder } from './NoResultPlaceholder';
import { ResponsiveWindowMeasurer } from '../UI/Reponsive/ResponsiveWindowMeasurer';
import Subheader from '../UI/Subheader';
import { AssetsHome, type AssetsHomeInterface } from './AssetsHome';
import TextButton from '../UI/TextButton';
import Text from '../UI/Text';
import IconButton from '../UI/IconButton';
import { AssetDetails, type AssetDetailsInterface } from './AssetDetails';
import PlaceholderLoader from '../UI/PlaceholderLoader';
import Home from '@material-ui/icons/Home';
import PrivateAssetPackInformationDialog from './PrivateAssets/PrivateAssetPackInformationDialog';
import PlaceholderError from '../UI/PlaceholderError';
import AlertMessage from '../UI/AlertMessage';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';
import PrivateAssetPackPurchaseDialog from './PrivateAssets/PrivateAssetPackPurchaseDialog';
import { LineStackLayout } from '../UI/Layout';
import Paper from '../UI/Paper';

type Props = {|
  project: gdProject,
|};

export type AssetStoreInterface = {|
  onClose: () => void,
|};

const identifyAssetPackKind = ({
  privateAssetPacks,
  publicAssetPacks,
  assetPack,
}: {|
  privateAssetPacks: ?Array<PrivateAssetPackListingData>,
  publicAssetPacks: ?PublicAssetPacks,
  assetPack: PrivateAssetPack | PublicAssetPack | null,
|}) => {
  if (!assetPack) return 'unknown';

  // We could simplify this if the asset packs have a "kind" or "type" in the future.
  // For now, we check their presence in the lists to ensure adding fields in the backend
  // won't break this detection in the future (for example, if public asset packs get an `id`,
  // this won't break).
  return assetPack.id &&
    privateAssetPacks &&
    !!privateAssetPacks.find(({ id }) => id === assetPack.id)
    ? 'private'
    : publicAssetPacks &&
      publicAssetPacks.starterPacks.find(({ tag }) => tag === assetPack.tag)
    ? 'public'
    : 'unknown';
};

export const AssetStore = React.forwardRef<Props, AssetStoreInterface>(
  ({ project }: Props, ref) => {
    const {
      publicAssetPacks,
      privateAssetPacks,
      searchResults,
      error,
      fetchAssetsAndFilters,
      navigationState,
      searchText,
      setSearchText,
      assetFiltersState,
      assetPackRandomOrdering,
    } = React.useContext(AssetStoreContext);
    const {
      isOnHomePage,
      openedAssetPack,
      openedAssetShortHeader,
      filtersState,
    } = navigationState.getCurrentPage();
    const searchBar = React.useRef<?SearchBarInterface>(null);

    const shouldAutofocusSearchbar = useShouldAutofocusSearchbar();
    const [isFiltersPanelOpen, setIsFiltersPanelOpen] = React.useState(
      !isOnHomePage && !openedAssetShortHeader
    );
    const [
      selectedPrivateAssetPackListingData,
      setSelectedPrivateAssetPackListingData,
    ] = React.useState<?PrivateAssetPackListingData>(null);
    const [
      purchasingPrivateAssetPackListingData,
      setPurchasingPrivateAssetPackListingData,
    ] = React.useState<?PrivateAssetPackListingData>(null);
    const { onPurchaseSuccessful, receivedAssetPacks } = React.useContext(
      AuthenticatedUserContext
    );

    // The saved scroll position must not be reset by a scroll event until it
    // has been applied.
    const hasAppliedSavedScrollPosition = React.useRef<boolean>(false);
    const isAssetDetailLoading = React.useRef<boolean>(
      openedAssetShortHeader != null
    );
    const setScrollUpdateIsNeeded = React.useCallback(
      () => {
        hasAppliedSavedScrollPosition.current = false;
        isAssetDetailLoading.current =
          navigationState.getCurrentPage().openedAssetShortHeader != null;
      },
      [navigationState]
    );

    const assetsHome = React.useRef<?AssetsHomeInterface>(null);
    const boxSearchResults = React.useRef<?BoxSearchResultsInterface>(null);
    const assetDetails = React.useRef<?AssetDetailsInterface>(null);
    const getScrollView = React.useCallback(() => {
      return (
        assetsHome.current || boxSearchResults.current || assetDetails.current
      );
    }, []);
    const saveScrollPosition = React.useCallback(
      () => {
        const scrollView = getScrollView();
        if (!scrollView) {
          return;
        }
        navigationState.getCurrentPage().scrollPosition = scrollView.getScrollPosition();
      },
      [getScrollView, navigationState]
    );
    // This is also called when the asset detail page has loaded.
    const applyBackScrollPosition = React.useCallback(
      () => {
        if (hasAppliedSavedScrollPosition.current) {
          return;
        }
        const scrollView = getScrollView();
        if (!scrollView) {
          return;
        }
        const scrollPosition = navigationState.getCurrentPage().scrollPosition;
        scrollPosition && scrollView.scrollToPosition(scrollPosition);
        hasAppliedSavedScrollPosition.current = true;
      },
      [getScrollView, navigationState]
    );

    React.useImperativeHandle(ref, () => ({
      onClose: saveScrollPosition,
    }));

    React.useLayoutEffect(
      () => {
        if (!isAssetDetailLoading.current) {
          applyBackScrollPosition();
        }
      },
      [applyBackScrollPosition]
    );

    const onOpenDetails = React.useCallback(
      (assetShortHeader: AssetShortHeader) => {
        const assetPackName = openedAssetPack ? openedAssetPack.name : null;
        const assetPackTag = openedAssetPack ? openedAssetPack.tag : null;
        const assetPackId =
          openedAssetPack && openedAssetPack.id ? openedAssetPack.id : null;
        const assetPackKind = identifyAssetPackKind({
          assetPack: openedAssetPack,
          publicAssetPacks,
          privateAssetPacks,
        });
        sendAssetOpened({
          id: assetShortHeader.id,
          name: assetShortHeader.name,
          assetPackName,
          assetPackTag,
          assetPackId,
          assetPackKind,
        });
        saveScrollPosition();
        navigationState.openDetailPage(assetShortHeader);
      },
      [
        openedAssetPack,
        publicAssetPacks,
        privateAssetPacks,
        saveScrollPosition,
        navigationState,
      ]
    );

    // When a pack is selected from the home page,
    // we set it as the chosen category and open the filters panel.
    const selectPublicAssetPack = React.useCallback(
      (assetPack: PublicAssetPack) => {
        sendAssetPackOpened({
          assetPackTag: assetPack.tag,
          assetPackId: null,
          assetPackName: assetPack.name,
          assetPackKind: 'public',
        });

        if (assetPack.externalWebLink) {
          Window.openExternalURL(assetPack.externalWebLink);
        } else {
          saveScrollPosition();
          navigationState.openPackPage(assetPack);
          setIsFiltersPanelOpen(true);
        }
      },
      [navigationState, saveScrollPosition]
    );

    // When a private pack is selected from the home page,
    // if the user owns it, we set it as the chosen category,
    // otherwise we open the dialog to buy it.
    const selectPrivateAssetPack = React.useCallback(
      (assetPackListingData: PrivateAssetPackListingData) => {
        const receivedAssetPack = receivedAssetPacks
          ? receivedAssetPacks.find(pack => pack.id === assetPackListingData.id)
          : null;

        if (!receivedAssetPack) {
          // The user has not received the pack, open the dialog to buy it.
          sendAssetPackInformationOpened({
            assetPackName: assetPackListingData.name,
            assetPackId: assetPackListingData.id,
            assetPackKind: 'private',
          });

          setSelectedPrivateAssetPackListingData(assetPackListingData);
          return;
        }

        // The user has received the pack, open it.
        sendAssetPackOpened({
          assetPackName: assetPackListingData.name,
          assetPackId: assetPackListingData.id,
          assetPackTag: null,
          assetPackKind: 'private',
        });
        saveScrollPosition();
        navigationState.openPackPage(receivedAssetPack);
        setIsFiltersPanelOpen(true);
      },
      [receivedAssetPacks, saveScrollPosition, navigationState]
    );

    // If the user has received the pack they are currently viewing,
    // we update the window to show it if they are not already on the pack page.
    React.useEffect(
      () => {
        if (!purchasingPrivateAssetPackListingData) return;
        // Ensure the user is not already on the pack page, to trigger the effect only once.
        const currentPage = navigationState.getCurrentPage();
        const isOnPrivatePackPage =
          currentPage.openedAssetPack &&
          currentPage.openedAssetPack.id &&
          currentPage.openedAssetPack.id ===
            purchasingPrivateAssetPackListingData.id;
        if (receivedAssetPacks && !isOnPrivatePackPage) {
          const receivedAssetPack = receivedAssetPacks.find(
            pack => pack.id === purchasingPrivateAssetPackListingData.id
          );
          if (receivedAssetPack) {
            // The user has received the pack, close the pack information dialog, and open the pack in the search.
            setIsFiltersPanelOpen(true);
            saveScrollPosition();
            navigationState.openPackPage(receivedAssetPack);
            setSelectedPrivateAssetPackListingData(null);
          }
        }
      },
      [
        receivedAssetPacks,
        purchasingPrivateAssetPackListingData,
        navigationState,
        saveScrollPosition,
      ]
    );

    // When a tag is selected from the asset details page,
    // first determine if it's a public or private pack,
    // then set it as the chosen category, clear old filters and open the filters panel.
    const selectTag = React.useCallback(
      (tag: string) => {
        const privateAssetPack =
          receivedAssetPacks &&
          receivedAssetPacks.find(pack => pack.tag === tag);
        const publicAssetPack =
          publicAssetPacks &&
          publicAssetPacks.starterPacks.find(pack => pack.tag === tag);
        saveScrollPosition();
        if (privateAssetPack) {
          navigationState.openPackPage(privateAssetPack);
        } else if (publicAssetPack) {
          navigationState.openPackPage(publicAssetPack);
        } else {
          navigationState.openTagPage(tag);
        }
        clearAllFilters(assetFiltersState);
        setIsFiltersPanelOpen(true);
      },
      [
        receivedAssetPacks,
        publicAssetPacks,
        saveScrollPosition,
        assetFiltersState,
        navigationState,
      ]
    );

    const capitalize = (str: string) => {
      return str ? str[0].toUpperCase() + str.substr(1) : '';
    };

    React.useEffect(
      () => {
        if (shouldAutofocusSearchbar && searchBar.current) {
          searchBar.current.focus();
        }
      },
      [shouldAutofocusSearchbar]
    );

    return (
      <>
        <ResponsiveWindowMeasurer>
          {windowWidth => (
            <>
              <Column expand noMargin useFullHeight id="asset-store">
                <LineStackLayout>
                  <IconButton
                    key="back-discover"
                    tooltip={t`Back to discover`}
                    onClick={() => {
                      navigationState.openHome();
                      setScrollUpdateIsNeeded();
                      clearAllFilters(assetFiltersState);
                      setIsFiltersPanelOpen(false);
                    }}
                    size="small"
                  >
                    <Home />
                  </IconButton>
                  <Column expand useFullHeight noMargin>
                    <SearchBar
                      placeholder={t`Search assets`}
                      value={searchText}
                      onChange={setSearchText}
                      onRequestSearch={() => {
                        // Clear the history
                        navigationState.activateTextualSearch();
                        navigationState.clearHistory();
                        setIsFiltersPanelOpen(true);
                      }}
                      ref={searchBar}
                      id="asset-store-search-bar"
                    />
                  </Column>
                </LineStackLayout>
                {!isOnHomePage && <Spacer />}
                <Column noMargin>
                  <Line
                    justifyContent="space-between"
                    noMargin
                    alignItems="center"
                  >
                    {isOnHomePage ? (
                      <Text size="block-title">
                        <Trans>Discover</Trans>
                      </Text>
                    ) : (
                      <>
                        <Column expand alignItems="flex-start" noMargin>
                          <TextButton
                            icon={<ArrowBack />}
                            label={<Trans>Back</Trans>}
                            primary={false}
                            onClick={() => {
                              navigationState.backToPreviousPage();
                              setScrollUpdateIsNeeded();
                              if (
                                navigationState.getCurrentPage().isOnHomePage
                              ) {
                                clearAllFilters(assetFiltersState);
                                setIsFiltersPanelOpen(false);
                              }
                            }}
                          />
                        </Column>
                        {(openedAssetPack || filtersState.chosenCategory) && (
                          <>
                            <Column expand alignItems="center">
                              <Text size="block-title" noMargin>
                                {openedAssetPack
                                  ? openedAssetPack.name
                                  : filtersState.chosenCategory
                                  ? capitalize(
                                      filtersState.chosenCategory.node.name
                                    )
                                  : ''}
                              </Text>
                            </Column>
                            {/* to center the title */}
                            <Column expand alignItems="flex-end" noMargin />
                          </>
                        )}
                      </>
                    )}
                  </Line>
                </Column>
                <Line
                  expand
                  noMargin
                  overflow={
                    'hidden' /* Somehow required on Chrome/Firefox to avoid children growing (but not on Safari) */
                  }
                >
                  {!openedAssetShortHeader && ( // Don't show filters on asset page.
                    <Column noMargin>
                      <ScrollView>
                        <Paper
                          style={{
                            width: !isFiltersPanelOpen
                              ? 50
                              : windowWidth === 'small'
                              ? 205
                              : 250,
                          }}
                          background="medium"
                        >
                          {!isFiltersPanelOpen ? (
                            <Line justifyContent="center">
                              <IconButton
                                onClick={() => setIsFiltersPanelOpen(true)}
                              >
                                <Tune />
                              </IconButton>
                            </Line>
                          ) : (
                            <>
                              <Line
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Column noMargin>
                                  <Line alignItems="center">
                                    <Tune />
                                    <Subheader>
                                      <Trans>Object filters</Trans>
                                    </Subheader>
                                  </Line>
                                </Column>
                                <IconButton
                                  onClick={() => setIsFiltersPanelOpen(false)}
                                >
                                  <DoubleChevronArrowLeft />
                                </IconButton>
                              </Line>
                              <Line
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <AssetStoreFilterPanel
                                  assetFiltersState={assetFiltersState}
                                  onChoiceChange={() => {
                                    navigationState.openSearchIfNeeded();
                                  }}
                                />
                              </Line>
                            </>
                          )}
                        </Paper>
                      </ScrollView>
                    </Column>
                  )}
                  {isOnHomePage &&
                    !(publicAssetPacks && privateAssetPacks) &&
                    !error && <PlaceholderLoader />}
                  {isOnHomePage &&
                    publicAssetPacks &&
                    privateAssetPacks &&
                    assetPackRandomOrdering && (
                      <AssetsHome
                        ref={assetsHome}
                        publicAssetPacks={publicAssetPacks}
                        privateAssetPacksListingData={privateAssetPacks}
                        assetPackRandomOrdering={assetPackRandomOrdering}
                        onPublicAssetPackSelection={selectPublicAssetPack}
                        onPrivateAssetPackSelection={selectPrivateAssetPack}
                      />
                    )}
                  {!isOnHomePage && !openedAssetShortHeader && (
                    <BoxSearchResults
                      ref={boxSearchResults}
                      baseSize={128}
                      onRetry={fetchAssetsAndFilters}
                      error={error}
                      searchItems={searchResults}
                      renderSearchItem={(assetShortHeader, size) => (
                        <AssetCard
                          size={size}
                          onOpenDetails={() => onOpenDetails(assetShortHeader)}
                          assetShortHeader={assetShortHeader}
                        />
                      )}
                      noResultPlaceholder={
                        <NoResultPlaceholder
                          onClear={() => clearAllFilters(assetFiltersState)}
                        />
                      }
                    />
                  )}
                  {isOnHomePage && error && (
                    <PlaceholderError onRetry={fetchAssetsAndFilters}>
                      <AlertMessage kind="error">
                        <Trans>
                          An error occurred when fetching the asset store
                          content. Please try again later.
                        </Trans>
                      </AlertMessage>
                    </PlaceholderError>
                  )}
                  {openedAssetShortHeader && (
                    <AssetDetails
                      ref={assetDetails}
                      project={project}
                      onTagSelection={selectTag}
                      assetShortHeader={openedAssetShortHeader}
                      onOpenDetails={onOpenDetails}
                      onAssetLoaded={applyBackScrollPosition}
                    />
                  )}
                  {!!selectedPrivateAssetPackListingData && (
                    <PrivateAssetPackInformationDialog
                      privateAssetPackListingData={
                        selectedPrivateAssetPackListingData
                      }
                      onClose={() => {
                        setSelectedPrivateAssetPackListingData(null);
                      }}
                      onOpenPurchaseDialog={() =>
                        setPurchasingPrivateAssetPackListingData(
                          selectedPrivateAssetPackListingData
                        )
                      }
                      isPurchaseDialogOpen={
                        !!purchasingPrivateAssetPackListingData
                      }
                    />
                  )}
                  {!!purchasingPrivateAssetPackListingData && (
                    <PrivateAssetPackPurchaseDialog
                      privateAssetPackListingData={
                        purchasingPrivateAssetPackListingData
                      }
                      onClose={() =>
                        setPurchasingPrivateAssetPackListingData(null)
                      }
                      onSuccessfulPurchase={onPurchaseSuccessful}
                    />
                  )}
                </Line>
              </Column>
            </>
          )}
        </ResponsiveWindowMeasurer>
      </>
    );
  }
);
