// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React from 'react';
import formatMessage from 'format-message';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { QnAFile } from '@bfc/shared';

import { FieldConfig, useForm } from '../../hooks/useForm';
import { getQnAFileUrlOption, getQnAFileMultiTurnOption, getFileLocale } from '../../utils/qnaUtil';

import { validateUrl } from './constants';
import { header, titleStyle, descriptionStyle, dialogWindow, textFieldKBNameFromScratch } from './styles';

type ImportQnAFromUrlModalProps = {
  qnaFile: QnAFile;
  onDismiss: () => void;
  onSubmit: (formData: ImportQnAFromUrlFormData) => void;
};

export type ImportQnAFromUrlFormData = {
  url: string;
  multiTurn: boolean;
};

const formConfig: FieldConfig<ImportQnAFromUrlFormData> = {
  url: {
    required: true,
    defaultValue: '',
  },
  multiTurn: {
    defaultValue: false,
  },
};

const title = <div style={titleStyle}>{formatMessage('Replace KB from URL')}</div>;

const description = (
  <div style={descriptionStyle}>
    {formatMessage(
      'Select this option when you want to replace current KB from content such as an FAQ available online or in a file .csv, .xls or .doc format '
    )}
  </div>
);

export const ImportQnAFromUrl: React.FC<ImportQnAFromUrlModalProps> = (props) => {
  const { onDismiss, onSubmit, qnaFile } = props;
  const defaultUrl = getQnAFileUrlOption(qnaFile);
  const defaultMultiTurn = getQnAFileMultiTurnOption(qnaFile);
  console.log(qnaFile);
  const locale = getFileLocale(qnaFile.id);
  formConfig.url.validate = validateUrl;
  formConfig.url.defaultValue = getQnAFileUrlOption(qnaFile);
  formConfig.multiTurn.defaultValue = getQnAFileMultiTurnOption(qnaFile);
  const { formData, updateField, hasErrors, formErrors } = useForm(formConfig);
  const disabled = hasErrors;

  const updateUrl = (url = '') => {
    updateField('url', url);
  };

  const updateMultiTurn = (multiTurn = false) => {
    updateField('multiTurn', multiTurn);
  };

  return (
    <div css={dialogWindow}>
      <Stack>
        <div style={header}>
          {title}
          {description}
        </div>

        <TextField
          data-testId={'ImportNewUrlToOverwriteQnAFile'}
          errorMessage={formErrors.url}
          label={formatMessage('Source URL or file')}
          placeholder={formatMessage('Enter a URL to Import QnA resource')}
          prefix={locale}
          styles={textFieldKBNameFromScratch}
          value={formData.url}
          onChange={(e, url) => updateUrl(url)}
        />
      </Stack>
      <Stack>
        <Checkbox
          checked={formData.multiTurn}
          label={formatMessage('Enable multi-turn extraction')}
          onChange={(_e, val) => updateMultiTurn(val)}
        />
      </Stack>
    </div>
  );
};

export default ImportQnAFromUrl;
