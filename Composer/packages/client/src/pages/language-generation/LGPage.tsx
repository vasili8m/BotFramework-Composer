// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React, { Fragment, useCallback, Suspense, useEffect, useMemo, useRef } from 'react';
import formatMessage from 'format-message';
import { getTheme, IconButton } from 'office-ui-fabric-react';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { RouteComponentProps, Router } from '@reach/router';
import { useRecoilValue } from 'recoil';
import { useBoolean } from '@uifabric/react-hooks/lib/useBoolean';
import { Modal, Panel } from 'office-ui-fabric-react';
import { Components, createDirectLine, createStore, hooks } from 'botframework-webchat';
import { lgUtil } from '@bfc/indexers';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { navigateTo } from '../../utils/navigation';
import { Page } from '../../components/Page';
import { lgFilesState, localeState, validateDialogsSelectorFamily } from '../../recoilModel';
import TelemetryClient from '../../telemetry/TelemetryClient';
import { JsonEditor } from '@bfc/code-editor';
import TableView from './table-view';
import { Activity, ActivityFactory, MessageFactory } from 'botbuilder-core';

const CodeEditor = React.lazy(() => import('./code-editor'));

const LGPage: React.FC<RouteComponentProps<{
  dialogId: string;
  projectId: string;
  skillId: string;
  lgFileId: string;
}>> = (props) => {
  const defaultJson = `{
    "turn": {
        "activity":{
            "text":"hello",
            "speak":"hello",
            "Recipient":{
                "id":"my id"
            }
        }
    },
    "user":{
        "name":"Jack"
    }
}`;

  if (sessionStorage.getItem('properties') == null) {
    sessionStorage.setItem('properties', defaultJson);
  }

  const { dialogId = '', projectId = '', skillId, lgFileId = '' } = props;

  const lgFiles = useRecoilValue(lgFilesState(projectId));
  const locale = useRecoilValue(localeState(projectId));
  const file = lgFiles.find(({ id }) => id === `${dialogId}.${locale}`);

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
  const lgResult = useRef<Partial<Activity>>({});
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
          if (lgResult.current) {
            Object.assign(action.payload.activity, lgResult.current);
          }
        }
        return next(action);
      }),
    []
  );

  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const VirtualButton = () => {
    const sendMessage = hooks.useSendMessage();
    React.useEffect(() => {
      window.addEventListener('message', handleHelpButtonClick);
      return () => {
        window.removeEventListener('message', handleHelpButtonClick);
      };
    }, []);

    const handleHelpButtonClick = React.useCallback(
      (e) => {
        const templateName = e.data.templateName;
        if (e.data.templateName) {
          if (file) {
            try {
              const result = lgUtil.evaluate(
                file.id,
                file.content,
                lgFiles,
                templateName,
                JSON.parse(sessionStorage.getItem('properties') ?? '{}')
              );
              const activity = ActivityFactory.fromObject(result);
              if (activity) {
                lgResult.current = activity;
              }
            } catch (error) {
              lgResult.current = MessageFactory.text(error.message);
            }
          }
          openPanel();
          sendMessage(`run ${e.data.templateName}`);
        }
      },
      [sendMessage]
    );

    return <div style={{ display: 'none' }}></div>;
  };
  const theme = getTheme();
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
            <a href="javascript:;" onClick={showModal}>
              Configurations
            </a>
            <Components.BasicWebChat />
          </Panel>
          <VirtualButton />
        </Components.Composer>
        <Modal isOpen={isModalOpen} onDismiss={hideModal} isBlocking={true}>
          <IconButton
            styles={{
              root: {
                color: theme.palette.neutralPrimary,
                marginRight: '2px',
                marginLeft: '768px',
              },
              rootHovered: {
                color: theme.palette.neutralDark,
              },
            }}
            iconProps={{ iconName: 'Cancel' }}
            ariaLabel="Close popup modal"
            onClick={hideModal}
          />
          <JsonEditor
            onError={() => {}}
            width="800px"
            height="800px"
            value={JSON.parse(sessionStorage.getItem('properties') ?? '{}')}
            onChange={(newValue) => sessionStorage.setItem('properties', JSON.parse(newValue) ?? '{}')}
          />
        </Modal>
      </Suspense>
    </Page>
  );
};

export default LGPage;
