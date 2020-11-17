// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Request, Response } from 'express';

import TelemetryService from '../services/telemetry';

async function trackEvent(req: Request, res: Response) {
  try {
    const { name, properties } = req.body;
    const event = TelemetryService.trackEvent(name, properties);
    return res.status(200).json(event);
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : err,
    });
  }
}

async function pageView(req: Request, res: Response) {
  try {
    const { name, properties, url } = req.body;
    const event = TelemetryService.pageView(name, url, properties);
    return res.status(200).json(event);
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : err,
    });
  }
}

export const TelemetryController = {
  trackEvent,
  pageView,
};
