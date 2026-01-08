import clsx from 'clsx';
import styles from './Input.module.css';

export function Input({
    label,
    error,
    hint,
    startIcon,
    endIcon,
    className,
    id,
    ...props
}) {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
        <div className={clsx(styles.wrapper, className)}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}
            <div className={clsx(styles.inputWrapper, error && styles.hasError)}>
                {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
                <input
                    id={inputId}
                    className={clsx(
                        styles.input,
                        startIcon && styles.hasStartIcon,
                        endIcon && styles.hasEndIcon
                    )}
                    {...props}
                />
                {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {hint && !error && <p className={styles.hint}>{hint}</p>}
        </div>
    );
}

export default Input;
