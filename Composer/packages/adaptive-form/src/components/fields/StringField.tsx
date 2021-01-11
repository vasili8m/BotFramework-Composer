// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useRef, useState } from 'react';
import { FieldProps } from '@bfc/extension-client';
import { NeutralColors } from '@uifabric/fluent-theme';
import { ITextField, TextField } from 'office-ui-fabric-react/lib/TextField';
import formatMessage from 'format-message';
import { useBoolean } from '@uifabric/react-hooks';
import { Expression } from 'adaptive-expressions';

import { FieldLabel } from '../FieldLabel';
import { DefaultButton } from 'office-ui-fabric-react/lib/components/Button/DefaultButton/DefaultButton';
import { Modal } from 'office-ui-fabric-react/lib/components/Modal/Modal';

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

  const textFieldRef = React.createRef<ITextField>();
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const expressionProperty = useRef<string>('{}');
  const [expressionResult, setExpressionResult] = useState<string>('');
  const expression = useRef<string>('');
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
    let currentExprStr = expression?.current;
    if (expression?.current) {
      if (expression.current.startsWith('=')) {
        currentExprStr = currentExprStr.substr(1).trim();
      }
      try {
        const scope = JSON.parse(expressionProperty.current);
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
        <DefaultButton text="Evaluate" onClick={showModal} />
        <Modal titleAriaId={'title'} isOpen={isModalOpen} onDismiss={hideModal} isBlocking={false}>
          Properties:
          <TextField
            multiline
            rows={3}
            label="Standard"
            placeholder="please input the properties"
            onChange={(e, newValue) => (expressionProperty.current = newValue ?? '{}')}
          />
          <DefaultButton text="Evaluate" onClick={evaluate} />
          <br />
          {expressionResult}
        </Modal>
      </div>

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
    </>
  );
};
