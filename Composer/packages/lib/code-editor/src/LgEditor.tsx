// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect, useRef } from 'react';
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import get from 'lodash/get';
import { MonacoServices, MonacoLanguageClient } from 'monaco-languageclient';
import { EditorDidMount } from '@monaco-editor/react';
import formatMessage from 'format-message';
import { IDisposable } from 'monaco-editor';

import { registerLGLanguage } from './languages';
import { createUrl, createWebSocket, createLanguageClient, SendRequestWithRetry } from './utils/lspUtil';
import { BaseEditor, BaseEditorProps, OnInit } from './BaseEditor';
import { LGOption } from './utils';
import { LG_HELP } from './constants';

const placeholder = formatMessage(
  `> To learn more about the LG file format, read the documentation at
> {lgHelp}`,
  { lgHelp: LG_HELP }
);

export interface LGLSPEditorProps extends BaseEditorProps {
  lgOption?: LGOption;
  languageServer?:
    | {
        host?: string;
        hostname?: string;
        port?: number | string;
        path: string;
      }
    | string;
}

const defaultLGServer = {
  path: '/lg-language-server',
};
declare global {
  interface Window {
    monacoServiceInstance: MonacoServices;
    monacoLGEditorInstance: MonacoLanguageClient;
  }
}

export function LgEditor(props: LGLSPEditorProps) {
  let provider: IDisposable;
  const options = {
    quickSuggestions: true,
    wordBasedSuggestions: false,
    ...props.options,
  };

  const { lgOption, languageServer, onInit: onInitProp, ...restProps } = props;
  const lgServer = languageServer || defaultLGServer;

  let editorId = '';
  if (lgOption) {
    const { projectId, fileId, templateId } = lgOption;
    editorId = [projectId, fileId, templateId].join('/');
  }

  const [editor, setEditor] = useState<any>();
  const monacoRef = useRef<any>(undefined);
  useEffect(() => {
    if (!editor) return;

    if (!window.monacoServiceInstance) {
      window.monacoServiceInstance = MonacoServices.install(editor as any);
    }

    const uri = get(editor.getModel(), 'uri._formatted', '');

    if (!window.monacoLGEditorInstance) {
      const url = createUrl(lgServer);
      const webSocket: WebSocket = createWebSocket(url);
      listen({
        webSocket,
        onConnection: (connection: MessageConnection) => {
          const languageClient = createLanguageClient(
            formatMessage('LG Language Client'),
            ['botbuilderlg'],
            connection
          );
          SendRequestWithRetry(languageClient, 'initializeDocuments', { lgOption, uri });
          const disposable = languageClient.start();
          connection.onClose(() => disposable.dispose());
          window.monacoLGEditorInstance = languageClient;
        },
      });
    } else {
      SendRequestWithRetry(window.monacoLGEditorInstance, 'initializeDocuments', { lgOption, uri });
    }
  }, [editor]);

  const onInit: OnInit = (monaco) => {
    registerLGLanguage(monaco);
    monacoRef.current = monaco;
    if (typeof onInitProp === 'function') {
      onInitProp(monaco);
    }
  };

  React.useEffect(() => {
    return () => {
      if (provider) {
        provider.dispose();
      }
    };
  }, []);

  const editorDidMount: EditorDidMount = (_getValue, lgEditor) => {
    try {
      setEditor(lgEditor);
      const commandId = lgEditor.addCommand(
        0,
        (service, templateName: string) => {
          console.log('post message:');
          console.log(templateName);
          window.postMessage({ templateName: templateName }, '*');
        },
        ''
      );

      if (monacoRef.current) {
        const codeLensProvider = monacoRef.current.languages.registerCodeLensProvider('botbuilderlg', {
          provideCodeLenses: function (model, token) {
            const lines = model.getLinesContent();
            let lenses: unknown[] = [];
            lines.forEach((item, index) => {
              // extract templateName
              if (item.startsWith('#')) {
                item = item.trim().substr(1).trim();
                let templateName = '';
                const leftBracketIndex = item.indexOf('(');
                if (leftBracketIndex < 0) {
                  templateName = item;
                } else {
                  templateName = item.substr(0, leftBracketIndex);
                }
                templateName = templateName.trim();

                if (templateName) {
                  lenses.push({
                    range: {
                      startLineNumber: index + 1,
                      startColumn: 0,
                      endLineNumber: index + 1,
                      endColumn: 0,
                    },
                    id: `Evaluate template ${templateName}`,
                    command: {
                      id: commandId,
                      title: 'Evaluate this template',
                      arguments: [templateName],
                    },
                  });
                }
              }
            });
            return {
              lenses: lenses,
              dispose: () => {
                lenses = [];
              },
            };
          },
          resolveCodeLens: function (model, codeLens, token) {
            return codeLens;
          },
        });
        provider = codeLensProvider;

        if (typeof props.editorDidMount === 'function') {
          return props.editorDidMount(_getValue, lgEditor);
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <BaseEditor
      helpURL={LG_HELP}
      id={editorId}
      placeholder={placeholder}
      {...restProps}
      editorDidMount={editorDidMount}
      language="botbuilderlg"
      options={options}
      theme="lgtheme"
      onInit={onInit}
    />
  );
}
