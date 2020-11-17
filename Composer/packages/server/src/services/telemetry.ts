// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from 'os';

import * as AppInsights from 'applicationinsights';

import { useElectronContext } from '../utility/electronContext';

import SettingStorage from './settings';

const INSTRUMENTATION_KEY = 'adec3983-7c87-4f0d-beef-bfe331902271';

const filterPII = ({ machineId, projectId, ...rest }: Record<string, unknown>) => rest;

export type DataCollectionSettings = {
  allowDataCollection?: boolean | null;
};

export class TelemetryService {
  private static client?: AppInsights.TelemetryClient;
  private static hasStarted = false;

  public static trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.enabled || !name || (global as any).__JEST_ENV__) {
      return;
    }

    if (!this.client) {
      this.startup();
    }

    try {
      properties = {
        ...properties,
        os: os.platform(),
        toolName: 'bf-composer',
      };

      const electronContext = useElectronContext();

      if (electronContext?.machineId) {
        properties.machineId = electronContext.machineId;
      }

      this.client?.trackEvent({ name, properties: filterPII(properties) });
    } catch (error) {
      // swallow the exception; we don't want to crash the app
      // on a failed attempt to collect usage data
    }
  }

  public static pageView(name: string, url: string, properties?: Record<string, unknown>): void {
    if (!this.enabled || !name || (global as any).__JEST_ENV__) {
      return;
    }
    if (!this.client) {
      this.startup();
    }
    try {
      properties = {
        ...properties,
        os: os.platform(),
        toolName: 'bf-composer',
      };
      this.client?.trackPageView({ name, url, properties: filterPII(properties) });
    } catch (error) {
      // swallow the exception; we don't want to crash the app
      // on a failed attempt to collect usage data
    }
  }

  private static get enabled(): boolean {
    return !!SettingStorage.getSettings().telemetry.allowDataCollection;
  }

  private static startup() {
    if (!this.hasStarted) {
      AppInsights.setup(INSTRUMENTATION_KEY)
        // turn off extra instrumentation
        .setAutoCollectConsole(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectRequests(false);
      // do not collect the user's machine name
      AppInsights.defaultClient.context.tags[AppInsights.defaultClient.context.keys.cloudRoleInstance] = '';
      AppInsights.start();

      this.client = AppInsights.defaultClient;
      this.hasStarted = true;
    }
  }
}

export default TelemetryService;
