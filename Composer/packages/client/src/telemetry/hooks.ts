// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LogData } from '@bfc/shared';
import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { currentModeState, currentProjectIdState, ServerSettingsState } from '../recoilModel';
import telemetryStorage from '../utils/telemetryStorage';

import { getEventLogger } from './getEventLogger';
import { createLogger, initializeLogger } from './telemetryLogger';

export const useInitializeLogger = () => {
  const [, forceRender] = useState({});
  const projectId = useRecoilValue(currentProjectIdState);
  const page = useRecoilValue(currentModeState);
  const { telemetry } = useRecoilValue(ServerSettingsState);
  const sessionId = telemetryStorage.getSessionId();

  const didStartSession = useRef(false);

  useEffect(() => {
    const eventLogger = initializeLogger(createLogger(telemetry), () => ({
      sessionId,
      timestamp: new Date().toUTCString(),
      composerVersion: process.env.COMPOSER_VERSION || 'unknown',
      sdkPackageVersion: process.env.SDK_PACKAGE_VERSION || 'unknown',
      page,
      projectId,
    }));

    if (!didStartSession.current && typeof telemetry?.allowDataCollection === 'boolean') {
      eventLogger.log('SessionStarted', {} as any);
      didStartSession.current = true;
    }

    forceRender({});
  }, [telemetry, page, projectId]);
};

export const useEventLogger = (properties?: LogData | (() => LogData)) => {
  return getEventLogger(properties);
};
