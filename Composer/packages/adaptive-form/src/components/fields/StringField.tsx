// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useRef, useState } from 'react';
import { FieldProps } from '@bfc/extension-client';
import { NeutralColors } from '@uifabric/fluent-theme';
import { ITextField, TextField } from 'office-ui-fabric-react/lib/TextField';
import formatMessage from 'format-message';
import { useBoolean } from '@uifabric/react-hooks';
import { Expression } from 'adaptive-expressions';
import { JsonEditor } from '@bfc/code-editor';
import { Modal } from 'office-ui-fabric-react/lib/components/Modal/Modal';
import { getTheme, IconButton } from 'office-ui-fabric-react';

import { FieldLabel } from '../FieldLabel';

export const borderStyles = (transparentBorder: boolean, error: boolean) =>
  transparentBorder
    ? {
        fieldGroup: {
          borderColor: error ? undefined : 'transparent',
          transition: 'border-color 0.1s linear',
          selectors: {
            ':hover': {
              borderColor: error ? undefined : NeutralColors.gray30,
            },
          },
        },
      }
    : {};

export const StringField: React.FC<FieldProps<string>> = function StringField(props) {
  const {
    id,
    value = '',
    onChange,
    disabled,
    label,
    description,
    placeholder,
    readonly,
    transparentBorder,
    onFocus,
    onBlur,
    error,
    uiOptions,
    required,
    focused,
    cursorPosition,
  } = props;
  const defaultJson = `{
    "turn": {
        "activity":{
            "text":"hello",
            "speak":"hello",
            "Recipient":{
                "id":"my id"
            }
        }
    },
    "user":{
        "name":"Jack"
    }
}`;

  if (sessionStorage.getItem('properties') == null) {
    sessionStorage.setItem('properties', defaultJson);
  }
  const textFieldRef = React.createRef<ITextField>();
  const [isModalOpen, { setTrue: openPanel, setFalse: hideModal }] = useBoolean(false);
  const [expressionResult, setExpressionResult] = useState<string>('');
  const [hidePropertiesButton, setHidePropertiesButton] = useState<boolean>(true);
  const expression = useRef<string>(value);
  useEffect(() => {
    if (focused && textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, [focused, textFieldRef.current, value]);

  useEffect(() => {
    if (cursorPosition !== undefined && cursorPosition > -1 && textFieldRef.current) {
      textFieldRef.current.setSelectionRange(cursorPosition, textFieldRef.current.selectionEnd || cursorPosition);
    }
  }, [cursorPosition]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (typeof onFocus === 'function') {
      e.stopPropagation();
      onFocus(id, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (typeof onBlur === 'function') {
      e.stopPropagation();
      onBlur(id, value);
    }
  };

  const handleChange = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    expression.current = newValue ?? '';
    onChange(newValue);
  };

  const evaluate = (e) => {
    console.log('start evaluate');
    let currentExprStr = expression?.current;
    if (expression?.current) {
      console.log(`expression is ${expression?.current}`);
      if (expression.current.startsWith('=')) {
        currentExprStr = currentExprStr.substr(1).trim();
      }
      try {
        const scope = JSON.parse(sessionStorage.getItem('properties') ?? '{}');
        const valueWithError = Expression.parse(currentExprStr).tryEvaluate(scope);
        if (valueWithError.error) {
          setExpressionResult(valueWithError.error);
        } else {
          const resultStr =
            typeof valueWithError.value === 'string'
              ? valueWithError.value
              : JSON.stringify(valueWithError.value, null, 4);
          setExpressionResult(resultStr);
        }
      } catch (error) {
        setExpressionResult(error.message);
      }
    }
  };
  const theme = getTheme();
  return (
    <>
      <div>
        <FieldLabel
          description={description}
          helpLink={uiOptions?.helpLink}
          id={id}
          label={label}
          required={required}
        />
      </div>
      <div onMouseLeave={() => setHidePropertiesButton(true)} onMouseOver={() => setHidePropertiesButton(false)}>
        <TextField
          ariaLabel={label || formatMessage('string field')}
          autoComplete="off"
          componentRef={textFieldRef}
          disabled={disabled}
          errorMessage={error}
          id={id}
          placeholder={placeholder}
          readOnly={readonly}
          styles={{
            ...borderStyles(Boolean(transparentBorder), Boolean(error)),
            root: { width: '100%' },
            errorMessage: { display: 'none' },
          }}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onClick={props.onClick}
          onFocus={handleFocus}
          onKeyDown={props.onKeyDown}
          onKeyUp={props.onKeyUp}
        />
        <div style={{ display: hidePropertiesButton ? 'none' : 'flex', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ color: 'grey' }}>
            <IconButton iconProps={{ iconName: 'Play' }} onClick={evaluate} />
            {expressionResult}
          </div>
          <div style={{ marginRight: 0 }}>
            <a href="javascript:;" onClick={openPanel}>
              Properties
            </a>
          </div>
        </div>
      </div>

      <Modal isBlocking isOpen={isModalOpen} onDismiss={hideModal}>
        <IconButton
          ariaLabel="Close popup modal"
          iconProps={{ iconName: 'Cancel' }}
          styles={{
            root: {
              color: theme.palette.neutralPrimary,
              marginRight: '2px',
              marginLeft: '768px',
            },
            rootHovered: {
              color: theme.palette.neutralDark,
            },
          }}
          onClick={hideModal}
        />
        <JsonEditor
          height="800px"
          value={JSON.parse(sessionStorage.getItem('properties') ?? '{}')}
          width="800px"
          onChange={(newValue) => {
            try {
              sessionStorage.setItem('properties', JSON.stringify(newValue) ?? '{}');
            } catch (error) {}
          }}
          onError={() => {}}
        />
      </Modal>
    </>
  );
};
