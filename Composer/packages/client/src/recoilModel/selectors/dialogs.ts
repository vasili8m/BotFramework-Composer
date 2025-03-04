// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogInfo } from '@bfc/shared';
import { selectorFamily } from 'recoil';

import { dialogIdsState, dialogState } from '../atoms';

export const dialogsSelectorFamily = selectorFamily<DialogInfo[], string>({
  key: 'dialogs',
  get: (projectId: string) => ({ get }) => {
    const dialogIds = get(dialogIdsState(projectId));
    return dialogIds
      .map((dialogId) => {
        const result = get(dialogState({ projectId, dialogId }));
        return result;
      })
      .filter((d) => !d.isTopic);
  },
  set: (projectId: string) => ({ set }, newDialogs) => {
    const newDialogArray = newDialogs as DialogInfo[];

    set(
      dialogIdsState(projectId),
      newDialogArray.map((dialog) => dialog.id)
    );
    newDialogArray.forEach((dialog) => set(dialogState({ projectId, dialogId: dialog.id }), dialog));
  },
});

export const topicsSelectorFamily = selectorFamily<DialogInfo[], string>({
  key: 'topics',
  get: (projectId: string) => ({ get }) => {
    const dialogIds = get(dialogIdsState(projectId));

    return dialogIds
      .map((dialogId) => {
        return get(dialogState({ projectId, dialogId }));
      })
      .filter((d) => d.isTopic)
      .sort((a, b) => {
        // sort system topics at the end of the list
        if (a.content?.isSystemTopic) {
          return 1;
        } else if (b.content?.isSystemTopic) {
          return -1;
        } else {
          return 0;
        }
      });
  },
});

export const currentDialogState = selectorFamily<DialogInfo | undefined, { projectId: string; dialogId?: string }>({
  key: 'currentDialog',
  get: ({ projectId, dialogId }) => ({ get }) => {
    const dialogIds = get(dialogIdsState(projectId));
    if (dialogId && dialogIds.includes(dialogId)) {
      return get(dialogState({ projectId, dialogId }));
    }

    return get(dialogsSelectorFamily(projectId))?.[0];
  },
});
