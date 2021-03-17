// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';

import { isLineUtterance } from '../../utils/luUtils';

const selectedTextCSSSelector = '.selected-text';

export const useMonacoSelectedTextDom = (
  editor: any,
  callback: (data?: {
    selectedDomElement: HTMLElement;
    selectedText: string;
    lineContent: string;
    selection: any;
  }) => void
) => {
  React.useEffect(() => {
    let observer: MutationObserver;
    if (editor) {
      const monacoOverlayContainerDomElm = editor.getDomNode().querySelector('.view-overlays');
      observer = new MutationObserver(() => {
        const selection = editor.getSelection();

        // Only show menu if selection is within one line
        if (selection.startLineNumber !== selection.endLineNumber) {
          callback();
          return;
        }

        const selectedText = editor.getModel().getValueInRange(selection);
        const lineContent = editor.getModel().getLineContent(selection.positionLineNumber);

        if (selectedText && isLineUtterance(lineContent)) {
          const selectedDomElement = monacoOverlayContainerDomElm.querySelector(selectedTextCSSSelector);
          callback({ selectedDomElement, selectedText, lineContent, selection });
        } else {
          callback();
        }
      });
      observer.observe(monacoOverlayContainerDomElm, { subtree: true, childList: true });
    }

    return () => {
      observer?.disconnect();
    };
  }, [editor]);
};
