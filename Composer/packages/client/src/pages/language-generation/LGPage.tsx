// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React, { Fragment, useCallback, Suspense, useEffect, useMemo } from 'react';
import formatMessage from 'format-message';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { RouteComponentProps, Router } from '@reach/router';
import { useRecoilValue } from 'recoil';
import { useBoolean } from '@uifabric/react-hooks/lib/useBoolean';
import { Panel, TextField } from 'office-ui-fabric-react';
import { Components, createDirectLine, createStore, hooks } from 'botframework-webchat';

import { LoadingSpinner } from '../../components/LoadingSpinner';
import { navigateTo } from '../../utils/navigation';
import { Page } from '../../components/Page';
import { validateDialogsSelectorFamily } from '../../recoilModel';
import TelemetryClient from '../../telemetry/TelemetryClient';

import TableView from './table-view';

const CodeEditor = React.lazy(() => import('./code-editor'));

const LGPage: React.FC<RouteComponentProps<{
  dialogId: string;
  projectId: string;
  skillId: string;
  lgFileId: string;
}>> = (props) => {
  const { dialogId = '', projectId = '', skillId, lgFileId = '' } = props;
  const dialogs = useRecoilValue(validateDialogsSelectorFamily(skillId ?? projectId ?? ''));

  const path = props.location?.pathname ?? '';

  const edit = /\/edit(\/)?$/.test(path);

  const baseURL = skillId == null ? `/bot/${projectId}/` : `/bot/${projectId}/skill/${skillId}/`;

  useEffect(() => {
    const activeDialog = dialogs.find(({ id }) => id === dialogId);
    if (!activeDialog && dialogs.length && dialogId !== 'common' && !lgFileId) {
      navigateTo(`${baseURL}language-generation/common`);
    }
  }, [dialogId, dialogs, projectId, lgFileId]);

  const onToggleEditMode = useCallback(
    (_e) => {
      let url = `${baseURL}language-generation/${dialogId}`;
      if (lgFileId) url += `/item/${lgFileId}`;
      if (!edit) url += `/edit`;
      navigateTo(url);
      TelemetryClient.track('EditModeToggled', { jsonView: !edit });
    },
    [dialogId, projectId, edit, lgFileId]
  );

  const onRenderHeaderContent = () => {
    return (
      <ActionButton data-testid="showcode" onClick={onToggleEditMode}>
        {edit ? formatMessage('Hide code') : formatMessage('Show code')}
      </ActionButton>
    );
  };

  const directLine = useMemo(
    () =>
      createDirectLine({
        token: '0YGXa4bDDsI.fTaNq2FIyafGqdKlF1FddZZkumA93KiVkL2NBZWZ2ic',
      }),
    []
  );

  const store = useMemo(
    () =>
      createStore({}, () => (next: (arg0: { type: any }) => any) => (action: { type: any; payload: any }) => {
        if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY' && action?.payload?.activity?.from?.role === 'bot') {
          //
        }
        return next(action);
      }),
    []
  );

  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);

  const VirtualButton = () => {
    const sendMessage = hooks.useSendMessage();
    React.useEffect(() => {
      console.log('register');
      window.addEventListener('message', handleHelpButtonClick);
      return () => {
        console.log('unregister');
        window.removeEventListener('message', handleHelpButtonClick);
      };
    }, []);

    const handleHelpButtonClick = React.useCallback(
      (e) => {
        console.log('receive message:');
        console.log(e.data);
        if (e.data.templateName) {
          console.log('get message');
          openPanel();
          sendMessage(`run ${e.data.templateName}`);
        }
      },
      [sendMessage]
    );

    return <div style={{ display: 'none' }}></div>;
  };

  return (
    <Page
      showCommonLinks
      useNewTree
      data-testid="LGPage"
      dialogId={dialogId}
      fileId={lgFileId}
      mainRegionName={formatMessage('LG editor')}
      navRegionName={formatMessage('LG Navigation Pane')}
      pageMode={'language-generation'}
      projectId={projectId}
      skillId={skillId}
      title={formatMessage('Bot Responses')}
      toolbarItems={[]}
      onRenderHeaderContent={onRenderHeaderContent}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Components.Composer
          className="webchat__chat"
          directLine={directLine}
          store={store}
          styleOptions={{
            bubbleBackground: '#F4F4F4',
            bubbleBorderColor: '#F4F4F4',
            bubbleBorderRadius: 4,
            bubbleBorderWidth: 2,
            bubbleNubOffset: 0,
            bubbleNubSize: 10,
            hideUploadButton: true,
            rootHeight: 800,

            bubbleFromUserBackground: '#3178c6',
            bubbleFromUserBorderColor: '#3178c6',
            bubbleFromUserBorderRadius: 4,
            bubbleFromUserBorderWidth: 2,
            bubbleFromUserNubOffset: 0,
            bubbleFromUserNubSize: 10,
            bubbleFromUserTextColor: 'White',
          }}
          userID={'default-user'}
        >
          <Router component={Fragment} primary={false}>
            <CodeEditor
              dialogId={dialogId}
              lgFileId={lgFileId}
              path="/edit/*"
              projectId={projectId}
              skillId={skillId}
            />
            <TableView dialogId={dialogId} lgFileId={lgFileId} path="/" projectId={projectId} />
          </Router>
          <Panel
            closeButtonAriaLabel="Close"
            headerText="LG Evaluation"
            isBlocking={false}
            isOpen={isOpen}
            onDismiss={dismissPanel}
          >
            <TextField
              multiline
              label="Standard"
              placeholder="please input the properties"
              rows={8}
              onChange={(e, newValue) => console.log(newValue)}
            />
            <Components.BasicWebChat />
          </Panel>
          <VirtualButton />
        </Components.Composer>
      </Suspense>
    </Page>
  );
};

export default LGPage;
