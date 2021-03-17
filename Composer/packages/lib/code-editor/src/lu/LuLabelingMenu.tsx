// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuEntity, LuFile } from '@botframework-composer/types';
import formatMessage from 'format-message';
import { ContextualMenu, DirectionalHint, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import React, { useCallback, useEffect, useState } from 'react';

import { computeInsertLuEntityEdits, isSelectionWithinBrackets } from '../utils/luUtils';

import { useLabelingMenuProps } from './hooks/useLabelingMenuItems';
import { useMonacoSelectedTextDom } from './hooks/useMonacoSelectedTextDom';

type Props = {
  editor: any;
  luFile?: LuFile;
  onMenuToggled?: (visible: boolean) => void;
};

export const LuLabelingMenu = ({ editor, luFile, onMenuToggled }: Props) => {
  const [menuTargetElm, setMenuTargetElm] = useState<HTMLElement | null>(null);

  React.useEffect(() => {
    onMenuToggled?.(!!menuTargetElm);
  }, [menuTargetElm]);

  useMonacoSelectedTextDom(editor, (data) => {
    if (!data) {
      setMenuTargetElm(null);
      return;
    }

    const { selectedDomElement, selectedText, lineContent, selection } = data;
    if (selectedText.trim() && !isSelectionWithinBrackets(lineContent, selection, selectedText) && selectedDomElement) {
      setMenuTargetElm(selectedDomElement);
    } else {
      setMenuTargetElm(null);
    }
  });

  useEffect(() => {
    let scrollDisposable: { dispose: () => void };

    if (editor) {
      scrollDisposable = editor.onDidScrollChange(() => {
        setMenuTargetElm(null);
      });
    }

    return () => {
      scrollDisposable?.dispose();
    };
  }, [editor]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuTargetElm(null);
      }
    };
    document.addEventListener('keydown', keydownHandler);

    return () => {
      document.removeEventListener('keydown', keydownHandler);
    };
  }, []);

  const insertEntity = useCallback(
    (entityName: string) => {
      if (editor) {
        const edits = computeInsertLuEntityEdits(entityName, editor);
        if (edits) {
          editor.executeEdits('toolbarMenu', edits);
          editor.focus();
        }
      }
    },
    [editor]
  );

  const itemClick = React.useCallback(
    (_, item?: IContextualMenuItem) => {
      const entity = item?.data as LuEntity;
      if (entity) {
        insertEntity(entity.Name);
      }
      setMenuTargetElm(null);
    },
    [insertEntity]
  );

  const { menuProps } = useLabelingMenuProps(false, luFile, itemClick, true, {
    menuHeaderText: formatMessage('Tag entity'),
  });

  return menuTargetElm ? (
    <ContextualMenu
      {...menuProps}
      directionalHint={DirectionalHint.bottomLeftEdge}
      hidden={false}
      shouldFocusOnMount={false}
      target={menuTargetElm}
    />
  ) : null;
};
