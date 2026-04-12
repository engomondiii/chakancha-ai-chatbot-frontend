import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './Input.module.css';

/**
 * Input Component
 * Supports text, email, password, number, textarea
 */
export const Input = forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      helperText,
      disabled = false,
      required = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      rows = 4,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || name;
    const isTextarea = type === 'textarea';

    const inputClasses = [
      styles.input,
      error && styles.error,
      icon && iconPosition === 'left' && styles.hasIconLeft,
      icon && iconPosition === 'right' && styles.hasIconRight,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const InputElement = isTextarea ? 'textarea' : 'input';

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {icon && iconPosition === 'left' && (
            <span className={styles.iconLeft}>{icon}</span>
          )}

          <InputElement
            ref={ref}
            id={inputId}
            name={name}
            type={isTextarea ? undefined : type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            rows={isTextarea ? rows : undefined}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <span className={styles.iconRight}>{icon}</span>
          )}

          {error && (
            <span className={styles.errorIcon}>
              <AlertCircle size={16} />
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className={styles.errorText}>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';