// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuEntity, LuFile } from '@botframework-composer/types';
import { FluentTheme } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import { CommandBarButton as DefaultCommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import * as React from 'react';

import { withTooltip } from '../utils/withTooltip';

import { jsLuToolbarMenuClassName } from './constants';
import { useLabelingMenuProps } from './hooks/useLabelingMenuItems';
import { getLuToolbarItemTextAndIcon } from './iconUtils';

const fontSizeStyle = {
  fontSize: FluentTheme.fonts.small.fontSize,
};
const buttonStyles = {
  root: {
    height: 32,
    '&:hover .ms-Button-flexContainer i, &:active .ms-Button-flexContainer i, &.is-expanded .ms-Button-flexContainer i': {
      color: FluentTheme.palette.black,
    },
  },
  menuIcon: { fontSize: 8, color: FluentTheme.palette.black },
  label: { ...fontSizeStyle },
  icon: { color: FluentTheme.palette.black, fontSize: 12 },
};

type Props = {
  luFile?: LuFile;
  onInsertEntity: (entityName: string) => void;
  insertPrebuiltEntitiesDisabled: boolean;
};

const CommandBarButton = withTooltip({ content: formatMessage('Insert defined entity') }, DefaultCommandBarButton);

export const InsertEntityButton = React.memo((props: Props) => {
  const { luFile, insertPrebuiltEntitiesDisabled, onInsertEntity } = props;

  const itemClick = React.useCallback(
    (_, item?: IContextualMenuItem) => {
      const entity = item?.data as LuEntity;
      if (entity) {
        onInsertEntity(entity.Name);
      }
    },
    [onInsertEntity]
  );

  const { disabled, menuProps } = useLabelingMenuProps(insertPrebuiltEntitiesDisabled, luFile, itemClick);

  const { iconName, text } = React.useMemo(() => getLuToolbarItemTextAndIcon('useEntity'), []);

  return (
    <CommandBarButton
      className={jsLuToolbarMenuClassName}
      disabled={disabled}
      iconProps={{ iconName }}
      menuProps={menuProps}
      styles={buttonStyles}
    >
      {text}
    </CommandBarButton>
  );
});
