// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuFile } from '@botframework-composer/types';
import { FluentTheme } from '@uifabric/fluent-theme';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import * as React from 'react';

import { DefineEntityButton } from './DefineEntityButton';
import { InsertEntityButton } from './InsertEntityButton';
import { ToolbarLuEntityType } from './types';

const menuHeight = 32;

const commandBarStyles = {
  root: {
    height: menuHeight,
    padding: 0,
    fontSize: FluentTheme.fonts.small.fontSize,
  },
};

type Props = {
  className?: string;
  luFile?: LuFile;
  labelingMenuVisible: boolean;
  insertPrebuiltEntitiesDisabled: boolean;
  onDefineEntity: (entityType: ToolbarLuEntityType, entityName?: string) => void;
  onInsertEntity: (entityName: string) => void;
};

export const LuEditorToolbar = React.memo((props: Props) => {
  const {
    luFile,
    insertPrebuiltEntitiesDisabled,
    labelingMenuVisible,
    className,
    onDefineEntity,
    onInsertEntity,
  } = props;

  const defineLuEntityItem: ICommandBarItemProps = React.useMemo(() => {
    return {
      key: 'defineLuEntityItem',
      commandBarButtonAs: () => <DefineEntityButton onDefineEntity={onDefineEntity} />,
    };
  }, [onDefineEntity]);

  const useLuEntityItem: ICommandBarItemProps = React.useMemo(() => {
    return {
      key: 'useLuEntityItem',
      commandBarButtonAs: () => (
        <InsertEntityButton
          insertPrebuiltEntitiesDisabled={insertPrebuiltEntitiesDisabled}
          labelingMenuVisible={labelingMenuVisible}
          luFile={luFile}
          onInsertEntity={onInsertEntity}
        />
      ),
    };
  }, [insertPrebuiltEntitiesDisabled, labelingMenuVisible, luFile, onInsertEntity]);

  const items = React.useMemo(() => [defineLuEntityItem, useLuEntityItem], [useLuEntityItem, defineLuEntityItem]);

  return <CommandBar className={className} items={items} styles={commandBarStyles} />;
});
