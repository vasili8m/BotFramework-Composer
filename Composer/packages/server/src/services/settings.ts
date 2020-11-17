// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Store } from '../store/store';

const KEY = 'settings';

export type Settings = {
  telemetry: {
    allowDataCollection?: boolean | null;
  };
};

const DEFAULT_SETTINGS: Settings = {
  telemetry: {
    allowDataCollection: null,
  },
};

export class SettingsService {
  public static getSettings(): Settings {
    return Store.get(KEY, DEFAULT_SETTINGS);
  }

  public static setSettings(settings: Settings): Settings {
    Store.set(KEY, settings);
    return settings;
  }
}

export default SettingsService;
