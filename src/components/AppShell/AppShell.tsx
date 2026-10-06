// App frame (spec sections 8 and 13): skip link, header, main content with page transitions,
// "Discard this request?" dialog, help drawer, and the app Toaster.
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Tab,
  TabList,
  Toaster,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { CONTENT_MAX_WIDTH, ROUTES } from '../../config';
import { getCurrentUser } from '../../data/dataService';
import { useAppNavigate, type NavState } from '../../hooks/useAppNavigate';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useRequest } from '../../state/requestStore';
import { MEDIA, QUERY } from '../../theme/layout';
import { HEADER_HEIGHT, Header } from '../Header';

export const TOASTER_ID = 'app-toaster';

type HelpTab = 'onboarding' | 'offboarding' | 'updating';

const enterFrom = (offset: string) => ({
  from: { opacity: 0, transform: `translateX(${offset})` },
  to: { opacity: 1, transform: 'none' },
});
const FADE_IN = { from: { opacity: 0 }, to: { opacity: 1 } };

const useStyles = makeStyles({
  skipLink: {
    position: 'absolute',
    left: tokens.spacingHorizontalM,
    top: '-100px',
    zIndex: 100,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForegroundLink,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    ':focus': { top: tokens.spacingVerticalM },
  },
  // Flex column filling the viewport, so PageActions can sit at the bottom on short pages.
  main: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: `calc(100dvh - ${HEADER_HEIGHT}px)`,
    width: '100%',
    maxWidth: `${CONTENT_MAX_WIDTH}px`,
    marginInline: 'auto',
    paddingInline: '32px',
    paddingBlock: tokens.spacingVerticalXXL,
    outlineStyle: 'none',
    [MEDIA.tabletOnly]: { paddingInline: '24px' },
    [MEDIA.phone]: { paddingInline: '16px', paddingBlock: tokens.spacingVerticalL },
  },
  page: {
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    animationDuration: tokens.durationGentle,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
  },
  forward: {
    animationName: enterFrom('12px'),
    [MEDIA.reducedMotion]: { animationName: FADE_IN },
  },
  back: {
    animationName: enterFrom('-12px'),
    [MEDIA.reducedMotion]: { animationName: FADE_IN },
  },
  drawer: {
    [MEDIA.tabletUp]: { width: '420px' },
  },
  tabPanel: {
    paddingBlock: tokens.spacingVerticalL,
  },
});

export function AppShell() {
  const styles = useStyles();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useAppNavigate();
  const { reset, isDirty } = useRequest();
  const isPhone = useMediaQuery(QUERY.phone);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>('onboarding');
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstPage = useRef(true);

  const direction = (location.state as NavState | null)?.direction ?? (navigationType === 'POP' ? 'back' : 'forward');

  useEffect(() => {
    getCurrentUser()
      .then((user) => setUserName(user.fullName ?? user.userPrincipalName))
      .catch((error: unknown) => console.error('Signed-in user could not be read.', error));
  }, []);

  // After each page change, move focus to the page H1 (spec section 13, U9).
  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    (heading ?? mainRef.current)?.focus();
  }, [location.pathname]);

  // Leaving the app with unsaved entries asks the browser to confirm (spec section 13).
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const goHome = () => {
    reset();
    navigate(ROUTES.HOME, 'back');
  };

  const onHomeClick = () => (isDirty ? setIsDiscardOpen(true) : goHome());

  const closeHelp = () => {
    setIsHelpOpen(false);
    helpButtonRef.current?.focus();
  };

  return (
    <>
      <a
        href="#main-content"
        className={styles.skipLink}
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <Header
        userName={userName}
        onHomeClick={onHomeClick}
        onHelpClick={() => setIsHelpOpen(true)}
        helpButtonRef={helpButtonRef}
      />
      <main id="main-content" ref={mainRef} tabIndex={-1} className={styles.main}>
        <div key={location.pathname} className={mergeClasses(styles.page, direction === 'back' ? styles.back : styles.forward)}>
          <Outlet />
        </div>
      </main>

      <Dialog open={isDiscardOpen} onOpenChange={(_, data) => setIsDiscardOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Discard this request?</DialogTitle>
            <DialogContent>Everything you entered will be cleared and you will return to the home page.</DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Keep editing</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={() => {
                  setIsDiscardOpen(false);
                  goHome();
                }}
              >
                Discard
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <OverlayDrawer
        open={isHelpOpen}
        position="end"
        size={isPhone ? 'full' : undefined}
        className={styles.drawer}
        onOpenChange={(_, data) => (data.open ? setIsHelpOpen(true) : closeHelp())}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={<Button appearance="subtle" aria-label="Close help" icon={<Dismiss24Regular />} onClick={closeHelp} />}
          >
            Help
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <TabList selectedValue={helpTab} onTabSelect={(_, data) => setHelpTab(data.value as HelpTab)}>
            <Tab value="onboarding">Onboarding</Tab>
            <Tab value="offboarding">Offboarding</Tab>
            <Tab value="updating">Updating</Tab>
          </TabList>
          {/* Placeholder until F09 adds the shared help content. */}
          <div className={styles.tabPanel}>
            <Body1>Help content for this topic is added in a later build step.</Body1>
          </div>
        </DrawerBody>
      </OverlayDrawer>

      <Toaster toasterId={TOASTER_ID} position="top-end" />
    </>
  );
}
