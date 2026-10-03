import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)
    return (
      <div className="form-field">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label} {required && <span className="required-star">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={`form-input ${error ? 'is-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error-text">{error}</span>}
        {hint && !error && <span className="form-hint-text">{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options?: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, children, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)
    return (
      <div className="form-field">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label} {required && <span className="required-star">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          required={required}
          className={`form-select ${error ? 'is-error' : ''} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="form-error-text">{error}</span>}
        {hint && !error && <span className="form-hint-text">{hint}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)
    return (
      <div className="form-field">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label} {required && <span className="required-star">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          required={required}
          className={`form-textarea ${error ? 'is-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error-text">{error}</span>}
        {hint && !error && <span className="form-hint-text">{hint}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
