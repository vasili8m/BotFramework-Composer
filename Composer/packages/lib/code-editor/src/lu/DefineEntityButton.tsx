// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FluentTheme } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import { CommandBarButton as DefaultCommandBarButton } from 'office-ui-fabric-react/lib/Button';
import {
  ContextualMenuItemType,
  IContextualMenuItem,
  IContextualMenuProps,
} from 'office-ui-fabric-react/lib/ContextualMenu';
import * as React from 'react';

import { useNoSearchResultMenuItem } from '../hooks/useNoSearchResultMenuItem';
import { useSearchableMenuListCallback } from '../hooks/useSearchableMenuListCallback';
import { withTooltip } from '../utils/withTooltip';

import { jsLuToolbarMenuClassName, prebuiltEntities } from './constants';
import { getLuToolbarItemTextAndIcon } from './iconUtils';
import { ToolbarLuEntityType } from './types';

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

const CommandBarButton = withTooltip({ content: formatMessage('Define new entity') }, DefaultCommandBarButton);

type Props = {
  onDefineEntity: (entityType: ToolbarLuEntityType, entityName?: string) => void;
};

export const DefineEntityButton = React.memo((props: Props) => {
  const { onDefineEntity } = props;

  const { iconName, text } = React.useMemo(() => getLuToolbarItemTextAndIcon('defineEntity'), []);
  const { onRenderMenuList, query, setQuery } = useSearchableMenuListCallback(
    formatMessage('Search prebuilt entities')
  );
  const noSearchResultsMenuItem = useNoSearchResultMenuItem(formatMessage('no prebuilt entities found'));

  const filteredPrebuiltEntities = React.useMemo(() => {
    const filteredItems = query
      ? prebuiltEntities.filter((e) => e.toLowerCase().indexOf(query.toLowerCase()) !== -1)
      : prebuiltEntities;

    if (!filteredItems.length) {
      return [noSearchResultsMenuItem];
    }

    return filteredItems.map<IContextualMenuItem>((prebuiltEntity) => ({
      key: prebuiltEntity,
      text: prebuiltEntity,
      style: fontSizeStyle,
      onClick: () => onDefineEntity('prebuilt', prebuiltEntity),
    }));
  }, [onDefineEntity, noSearchResultsMenuItem, query]);

  const onDismiss = React.useCallback(() => {
    setQuery('');
  }, []);

  const prebuiltSubMenuProps = React.useMemo<IContextualMenuProps>(
    () => ({
      calloutProps: { calloutMaxHeight: 216 },
      items: filteredPrebuiltEntities,
      onRenderMenuList,
      onDismiss,
    }),
    [filteredPrebuiltEntities, onDismiss, onRenderMenuList]
  );

  const menuItems = React.useMemo(() => {
    return [
      {
        key: 'defineEntity_header',
        itemType: ContextualMenuItemType.Header,
        text: formatMessage('Define new entity'),
      },
      {
        key: 'prebuiltEntity',
        text: formatMessage('Prebuilt entity'),
        style: fontSizeStyle,
        subMenuProps: prebuiltSubMenuProps,
      },
      {
        key: 'mlEntity',
        style: fontSizeStyle,
        text: formatMessage('Machine learned entity'),
        onClick: () => onDefineEntity('ml'),
      },
    ];
  }, [onDefineEntity, prebuiltSubMenuProps]);

  const menuProps = React.useMemo(() => {
    return {
      items: menuItems,
    };
  }, [menuItems]);

  return (
    <CommandBarButton
      className={jsLuToolbarMenuClassName}
      iconProps={{ iconName }}
      menuProps={menuProps}
      styles={buttonStyles}
    >
      {text}
    </CommandBarButton>
  );
});
