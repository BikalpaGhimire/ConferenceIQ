import { useRef, useEffect } from 'react';

export function PinInput({ value, onChange, onSubmit, autoFocus = true }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, rawValue) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    if (!digit) return;

    // Build new PIN by replacing the character at index
    let newPin = value;
    if (index < value.length) {
      newPin = value.slice(0, index) + digit + value.slice(index + 1);
    } else {
      newPin = value + digit;
    }
    newPin = newPin.slice(0, 6);
    onChange(newPin);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (newPin.length === 6 && onSubmit) {
      setTimeout(() => onSubmit(), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[index]) {
        // Clear current digit
        const newPin = value.slice(0, index) + value.slice(index + 1);
        onChange(newPin);
      } else if (index > 0) {
        // Move back and clear previous
        const newPin = value.slice(0, index - 1) + value.slice(index);
        onChange(newPin);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'Enter' && value.length === 6 && onSubmit) {
      onSubmit();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
      if (pasted.length === 6 && onSubmit) {
        setTimeout(() => onSubmit(), 100);
      }
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 rounded-lg border-2 text-center text-2xl font-mono bg-card outline-none transition-colors focus:border-amber focus:bg-amber/10 text-white border-border"
          autoComplete="off"
        />
      ))}
    </div>
  );
}
