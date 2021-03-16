// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LuFile } from '@botframework-composer/types';
import styled from '@emotion/styled';
import { FluentTheme, NeutralColors } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import {
  IContextualMenuItem,
  IContextualMenuListProps,
  IContextualMenuProps,
  IContextualMenuItemProps,
} from 'office-ui-fabric-react/lib/ContextualMenu';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';

import { useDebounce } from '../../hooks/useDebounce';
import { getEntityTypeDisplayName } from '../../utils/luUtils';
import { ToolbarLuEntityType } from '../types';

import { useLuEntities } from './useLuEntities';

const searchEmptyMessageStyles = { root: { height: 32 } };
const searchEmptyMessageTokens = { childrenGap: 8 };

const headerContainerStyles = {
  root: { height: 32 },
};

const fontSizeStyle = {
  fontSize: FluentTheme.fonts.small.fontSize,
};

const Header = styled(Label)({
  padding: '0 8px',
  color: FluentTheme.palette.accent,
  ...fontSizeStyle,
});

const itemContainerTokens = { childrenGap: 8 };

const primaryTextStyles = { root: { flex: 1, whiteSpace: 'nowrap', overflowX: 'hidden', textOverflow: 'ellipsis' } };
const secondaryTextStyles = { root: { color: NeutralColors.gray90 } };

const itemsContainerStyles = { root: { overflowY: 'auto', maxHeight: 216, width: 200, overflowX: 'hidden' } };
const searchFieldStyles = { root: { borderRadius: 0, ...fontSizeStyle }, iconContainer: { display: 'none' } };

/**
 * Provides labeling menu props for LU labeling.
 * @param luFile Current dialogs lu file.
 * @param onItemClick Callback for selecting an item from entity list.
 * @param filterPrebuiltEntities Allows caller to filter out prebuilt entities.
 * @returns Returns menuProps for labeling menu and if labeling is not possible and should be disabled.
 */
export const useLabelingMenuProps = (
  insertPrebuiltEntitiesDisabled: boolean,
  luFile?: LuFile,
  onItemClick?: IContextualMenuItem['onClick'],
  filterPrebuiltEntities = false,
  options: Partial<{ menuHeaderText: string }> = {}
): { menuProps: IContextualMenuProps; disabled: boolean } => {
  const { menuHeaderText } = options;
  const entities = useLuEntities(luFile, filterPrebuiltEntities ? ['prebuilt'] : []);
  const [query, setQuery] = React.useState<string | undefined>();
  const debouncedQuery = useDebounce<string | undefined>(query, 300);

  const onSearchAbort = React.useCallback(() => {
    setQuery('');
  }, []);

  const onSearchQueryChange = React.useCallback((_?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    setQuery(newValue);
  }, []);

  const onRenderMenuList = React.useCallback(
    (menuListProps?: IContextualMenuListProps, defaultRender?: IRenderFunction<IContextualMenuListProps>) => {
      return (
        <Stack>
          <Stack styles={headerContainerStyles} verticalAlign="center">
            <Header>{menuHeaderText || formatMessage('Insert defined entity')}</Header>
          </Stack>
          <SearchBox
            disableAnimation
            placeholder={formatMessage('Search entities')}
            styles={searchFieldStyles}
            onAbort={onSearchAbort}
            onChange={onSearchQueryChange}
          />
          <Stack styles={itemsContainerStyles}>{defaultRender?.(menuListProps)}</Stack>
        </Stack>
      );
    },
    [menuHeaderText, onSearchAbort, onSearchQueryChange]
  );

  const items = React.useMemo<IContextualMenuItem[]>(() => {
    const filteredEntities = debouncedQuery
      ? entities.filter((e) => e.Name.toLowerCase().indexOf(debouncedQuery.toLowerCase()) !== -1)
      : entities;
    if (!filteredEntities.length) {
      return [
        {
          key: 'no_results',
          onRender: () => (
            <Stack
              key="no_results"
              horizontal
              horizontalAlign="center"
              styles={searchEmptyMessageStyles}
              tokens={searchEmptyMessageTokens}
              verticalAlign="center"
            >
              <Icon iconName="SearchIssue" title={formatMessage('no entities found')} />
              <Text variant="small">{formatMessage('no entities found')}</Text>
            </Stack>
          ),
        },
      ];
    }

    return filteredEntities.map<IContextualMenuItem>((e) => ({
      key: `${e.Type}-${e.Name}`,
      disabled: insertPrebuiltEntitiesDisabled && (e.Type as ToolbarLuEntityType) === 'prebuilt',
      text: e.Name,
      secondaryText: getEntityTypeDisplayName(e.Type as ToolbarLuEntityType),
      data: e,
      onClick: onItemClick,
    }));
  }, [entities, debouncedQuery, onItemClick]);

  const contextualMenuItemAs = React.useCallback((itemProps: IContextualMenuItemProps) => {
    return (
      <Stack horizontal tokens={itemContainerTokens}>
        <Text styles={primaryTextStyles} title={itemProps.item.text} variant="small">
          {itemProps.item.text}
        </Text>
        <Text styles={secondaryTextStyles} title={itemProps.item.secondaryText} variant="small">
          {itemProps.item.secondaryText}
        </Text>
      </Stack>
    );
  }, []);

  return {
    disabled: !luFile || !entities.length,
    menuProps: { items, onRenderMenuList, contextualMenuItemAs },
  };
};
