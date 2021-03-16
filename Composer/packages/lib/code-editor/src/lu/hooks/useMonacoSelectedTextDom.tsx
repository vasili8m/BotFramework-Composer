// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';

const selectedTextCSSSelector = '.selected-text';

export const useMonacoSelectedTextDom = (editor: any, callback: (dom?: HTMLElement, selectedText?: string) => void) => {
  React.useEffect(() => {
    let observer: MutationObserver;
    if (editor) {
      const domElement = editor.getDomNode().querySelector('.view-overlays');
      observer = new MutationObserver(() => {
        const selectedText = editor.getModel().getValueInRange(editor.getSelection());

        if (selectedText) {
          const element = domElement.querySelector(selectedTextCSSSelector);
          callback(element, selectedText);
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
