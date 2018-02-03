declare global {
  interface Event {
    charCode: number;
  }

  interface EventTarget {
    readonly value: string;
    readonly files: FileList | null;
    readonly result: string;
  }
}

import { ProgressInfo } from 'builder-util-runtime';
import { ipcRenderer, remote } from 'electron';
import { UpdateInfo } from 'electron-updater';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import ReduxThunk from 'redux-thunk';
import { backAccelerator, openSettingsAccelerator, quitAccelerator, redoAccelerator, saveHeroAccelerator, undoAccelerator } from './actions/AcceleratorActions';
import { addErrorAlert } from './actions/AlertActions';
import { requestClose, requestInitialData, setUpdateDownloadProgress, updateAvailable, updateNotAvailable } from './actions/IOActions';
import { showAbout } from './actions/LocationActions';
import { AppContainer } from './containers/App';
import { app, AppState } from './reducers/app';
import { getLocaleMessages } from './selectors/stateSelectors';
import { _translate } from './utils/I18n';
import { isDialogOpen } from './utils/SubwindowsUtils';

const store = createStore<AppState>(app, applyMiddleware(ReduxThunk));

store.dispatch(requestInitialData()).then(() => {
  if (remote.process.platform === 'darwin') {
    const { dispatch, getState } = store;
    const locale = getLocaleMessages(getState())!;
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: remote.app.getName(),
        submenu: [
          {
            label: _translate(locale, 'mac.aboutapp', remote.app.getName()),
            click: () => dispatch(showAbout())
          },
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {
            label: _translate(locale, 'mac.quit'),
            click: () => dispatch(requestClose(() => remote.app.quit()))
          }
        ]
      },
      {
        label: _translate(locale, 'edit'),
        submenu: [
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'delete'},
          {role: 'selectall'}
        ]
      },
      {
        label: _translate(locale, 'view'),
        submenu: [
          {role: 'togglefullscreen'}
        ]
      },
      {
        role: 'window',
        submenu: [
          {role: 'minimize'},
          {type: 'separator'},
          {role: 'front'}
        ]
      }
    ];

    const menu = remote.Menu.buildFromTemplate(menuTemplate);
    remote.Menu.setApplicationMenu(menu);

    store.subscribe(() => {
      const areSubwindowsOpen = isDialogOpen();
      type MenuItems = Electron.MenuItemConstructorOptions[];
      const appMenu = menuTemplate[0].submenu as MenuItems;
      appMenu[0].enabled = !areSubwindowsOpen;
      const menu = remote.Menu.buildFromTemplate(menuTemplate);
      remote.Menu.setApplicationMenu(menu);
    });

    remote.globalShortcut.register('Cmd+Q', () => {
      store.dispatch(quitAccelerator());
    });
  }

  remote.globalShortcut.register('CmdOrCtrl+Z', () => {
    store.dispatch(undoAccelerator());
  });
  remote.globalShortcut.register('CmdOrCtrl+Y', () => {
    store.dispatch(redoAccelerator());
  });
  remote.globalShortcut.register('CmdOrCtrl+Shift+Z', () => {
    store.dispatch(redoAccelerator());
  });
  remote.globalShortcut.register('CmdOrCtrl+S', () => {
    store.dispatch(saveHeroAccelerator());
  });
  remote.globalShortcut.register('CmdOrCtrl+W', () => {
    store.dispatch(backAccelerator());
  });
  remote.globalShortcut.register('CmdOrCtrl+O', () => {
    store.dispatch(openSettingsAccelerator());
  });
  ipcRenderer.send('loading-done');
});

render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.querySelector('#bodywrapper')
);

ipcRenderer.addListener('update-available', (_event: Event, info: UpdateInfo) => {
  store.dispatch(updateAvailable(info));
});

ipcRenderer.addListener('update-not-available', () => {
  store.dispatch(updateNotAvailable());
});

ipcRenderer.addListener('download-progress', (_event: Event, progressObj: ProgressInfo) => {
  store.dispatch(setUpdateDownloadProgress(progressObj));
});

ipcRenderer.addListener('auto-updater-error', (_event: Event, err: Error) => {
  store.dispatch(setUpdateDownloadProgress());
  store.dispatch((dispatch, getState) => dispatch(addErrorAlert({
    title: 'Auto Update Error',
    message: `An error occured during auto-update. (${JSON.stringify(err)})`
  }, getLocaleMessages(getState())!)));
});
