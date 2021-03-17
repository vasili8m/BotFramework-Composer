// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import formatMessage from 'format-message';

import { LuToolbarButtonKind } from './types';

export const getLuToolbarItemTextAndIcon = (kind: LuToolbarButtonKind): { iconName: string; text: string } => {
  switch (kind) {
    case 'defineEntity':
      return { iconName: 'Add', text: formatMessage('Add entity') };

    case 'useEntity': {
      return { iconName: 'Tag', text: formatMessage('Insert entity') };
    }

    case 'tagEntity': {
      return { iconName: 'Tag', text: formatMessage('Tag entity') };
    }
  }
};
