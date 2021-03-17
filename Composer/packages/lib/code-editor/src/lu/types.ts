// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const toolbarSupportedLuEntityTypes = ['ml', 'prebuilt'] as const;
export type ToolbarLuEntityType = typeof toolbarSupportedLuEntityTypes[number];
export type LuToolbarButtonKind = 'useEntity' | 'defineEntity' | 'tagEntity';
