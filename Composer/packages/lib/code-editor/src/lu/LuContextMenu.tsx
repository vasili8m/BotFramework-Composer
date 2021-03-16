// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuEntity, LuFile } from '@botframework-composer/types';
import formatMessage from 'format-message';
import { ContextualMenu, DirectionalHint, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import React, { useCallback, useEffect, useState } from 'react';

import { useLabelingMenuProps } from '../lu/hooks/useLabelingMenuItems';
import { computeInsertLuEntityEdits } from '../utils/luUtils';

import { useMonacoSelectedTextDom } from './hooks/useMonacoSelectedTextDom';

type Props = {
  editor: any;
  luFile?: LuFile;
};

const LuContextMenu: React.FC<Props> = ({ editor, luFile }) => {
  const [contextMenuTarget, setContextMenuTarget] = useState<Element | null | undefined>(null);

  useMonacoSelectedTextDom(editor, (selectedDomElement, selectedText) => {
    setContextMenuTarget(selectedText ? selectedDomElement : null);
  });

  useEffect(() => {
    if (!editor) return;

    const didScrollChangeListener = editor.onDidScrollChange(() => {
      setContextMenuTarget(null);
    });

    return () => {
      didScrollChangeListener?.dispose();
    };
  }, [editor]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenuTarget(null);
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
      setContextMenuTarget(null);
    },
    [insertEntity]
  );

  const { menuProps } = useLabelingMenuProps(false, luFile, itemClick, true, {
    menuHeaderText: formatMessage('Tag entity'),
  });

  return contextMenuTarget ? (
    <ContextualMenu
      {...menuProps}
      directionalHint={DirectionalHint.bottomLeftEdge}
      hidden={false}
      target={contextMenuTarget}
    />
  ) : null;
};

export { LuContextMenu };
