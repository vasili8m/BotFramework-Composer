// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';

const selectedTextCSSSelector = '.selected-text';

export const useMonacoSelectedTextDom = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (dom?: HTMLElement, selectedText?: string, lineContent?: string, selection?: any) => void
) => {
  React.useEffect(() => {
    let observer: MutationObserver;
    if (editor) {
      const domElement = editor.getDomNode().querySelector('.view-overlays');
      observer = new MutationObserver(() => {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        const lineContent = editor.getModel().getLineContent(selection.positionLineNumber);

        if (selectedText) {
          const element = domElement.querySelector(selectedTextCSSSelector);
          callback(element, selectedText, lineContent, selection);
        } else {
          callback();
        }
      });
      observer.observe(domElement, { subtree: true, childList: true });
    }

    return () => {
      observer?.disconnect();
    };
  }, [editor]);
};
