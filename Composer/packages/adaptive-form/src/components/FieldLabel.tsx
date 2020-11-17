// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/** @jsx jsx */
import { jsx } from '@emotion/core';
import React, { useRef } from 'react';
import { DirectionalHint, TooltipHost, TooltipDelay } from 'office-ui-fabric-react/lib/Tooltip';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { NeutralColors } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import { useShellApi } from '@bfc/extension-client';

import { useAdaptiveFormContext } from '../AdaptiveFormContext';

import { Link } from './Link';
import { focusBorder } from './sharedStyles';

interface DescriptionCalloutProps {
  title: string;
  description?: string;
  id?: string;
  helpLink?: string;
}

const DescriptionCallout: React.FC<DescriptionCalloutProps> = function DescriptionCallout(props) {
  const { description, title, helpLink } = props;
  const { baseSchema } = useAdaptiveFormContext();
  const { shellApi } = useShellApi();
  const { telemetryLogger } = shellApi;
  const telemetryTimeoutRef = useRef<any>();

  if (!description) {
    return null;
  }

  return (
    <TooltipHost
      delay={TooltipDelay.zero}
      directionalHint={DirectionalHint.bottomAutoEdge}
      styles={{ root: { display: 'inline-block' } }}
      tooltipProps={{
        styles: { root: { width: '288px', padding: '17px 28px' } },
        onRenderContent: () => (
          <div>
            <h3 aria-label={title + '.'} style={{ fontSize: '20px', margin: '0', marginBottom: '10px' }}>
              {title}
            </h3>
            <p>{description}</p>
            {helpLink && (
              <Link
                aria-label={formatMessage('Learn more about {title}', { title: title.toLowerCase() })}
                href={helpLink}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => {
                  telemetryLogger?.log('HelpLinkClicked', { url: helpLink });
                }}
              >
                {formatMessage('Learn more')}
              </Link>
            )}
          </div>
        ),
      }}
      onTooltipToggle={(visible) => {
        // Only log TooltipOpened telemetry if the tooltip
        // was opened for more than half a second
        if (visible) {
          telemetryTimeoutRef.current = setTimeout(() => {
            telemetryLogger?.log('TooltipOpened', { location: baseSchema?.properties?.$kind.const as string, title });
          }, 500);
        } else {
          clearTimeout(telemetryTimeoutRef.current);
          telemetryTimeoutRef.current = undefined;
        }
      }}
    >
      <div css={focusBorder} data-testid="FieldLabelDescriptionIcon" tabIndex={0}>
        <Icon
          aria-label={title + '; ' + description}
          iconName={'Unknown'}
          styles={{
            root: {
              width: '16px',
              minWidth: '16px',
              height: '16px',
              color: NeutralColors.gray160,
              fontSize: '12px',
              marginBottom: '-2px',
              paddingLeft: '4px',
              paddingTop: '4px',
            },
          }}
        />
      </div>
    </TooltipHost>
  );
};

interface FieldLabelProps {
  id?: string;
  label?: string | false;
  description?: string;
  helpLink?: string;
  inline?: boolean;
  required?: boolean;
}

const FieldLabel: React.FC<FieldLabelProps> = (props) => {
  const { label, description, id, inline, helpLink, required } = props;

  if (!label) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Label
        htmlFor={id}
        required={required}
        styles={{
          root: {
            fontWeight: '400',
            marginLeft: inline ? '4px' : '0',
            selectors: {
              '::after': {
                paddingRight: 0,
              },
            },
          },
        }}
      >
        {label}
      </Label>
      <DescriptionCallout description={description} helpLink={helpLink} id={id} title={label} />
    </div>
  );
};

export { FieldLabel };
