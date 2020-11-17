// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { v4 as uuid } from 'uuid';

import { ClientStorage } from './storage';

const KEY = 'TelemetryState';
const DEFAULT_STATE = {};

type Telemetry = {
  sessionId?: string;
};

class TelemetryState {
  private storage;
  private _all: Telemetry = {};

  constructor() {
    this.storage = new ClientStorage(window.sessionStorage);
    this._all = this.storage.get(KEY, DEFAULT_STATE);
  }

  get() {
    return this._all;
  }

  getSessionId() {
    const { sessionId } = this.get();

    if (!sessionId) {
      const sessionId = uuid();
      this.setSessionId(sessionId);
    }

    return sessionId;
  }

  setSessionId(sessionId: string) {
    this._all = { sessionId };
    this.storage.set(KEY, this._all);
  }
}

export default new TelemetryState();
