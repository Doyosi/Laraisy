# CodeInput Usage Guide

`CodeInput` is an N-digit verification code input handler designed for two-factor authentication (2FA), OTP, and PIN verification inputs. It automatically handles single-character auto-advance on typing, backspace navigation, paste handling, and synchronization with a hidden form input.

## Installation

```javascript
import CodeInput from '@doyosi/laraisy/src/CodeInput.js';
// Or named export:
import { CodeInput } from '@doyosi/laraisy';
```

---

## Basic Usage

### HTML Structure

`CodeInput` requires a series of input elements matching a CSS selector and `data-id="${hiddenName}"`, alongside a hidden `<input type="hidden" name="${hiddenName}">` element that stores the concatenated verification code.

```html
<form id="two-fa-form" action="/auth/two-fa" method="POST">
    <div class="flex gap-2 justify-center my-4">
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" autofocus />
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" />
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" />
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" />
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" />
        <input type="text" class="code-input input input-bordered text-center w-12 h-12 text-lg font-bold" data-id="code" maxlength="1" />

        <!-- Hidden input synced with concatenated code -->
        <input type="hidden" name="code" id="code" />
    </div>

    <button type="submit" id="two-fa-button" class="btn btn-primary w-full">Verify Code</button>
</form>
```

### JavaScript Initialization

```javascript
import CodeInput from '@doyosi/laraisy/src/CodeInput.js';

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.code-input')) {
        // Parameter 1: Selector for individual digit inputs
        // Parameter 2: Name of the hidden input field ('code')
        const codeInput = new CodeInput('.code-input', 'code');
    }
});
```

---

## Features & Behavior

1. **Auto-Advance**: Typing a digit automatically sets the input's `maxlength` to `1` and focuses the next field in sequence.
2. **Numeric Filter**: Non-numeric keystrokes are automatically stripped out.
3. **Backspace Navigation**: Pressing `Backspace` in an empty field focuses the previous field.
4. **Paste Support**: Pasting a string (e.g. `123456`) automatically distributes each digit into consecutive input fields starting from the current field and updates the hidden input value.
5. **Hidden Sync**: Every input/paste/backspace action automatically updates `this.hidden.value` with the current combined string.

---

## API Reference

### Constructor

```javascript
new CodeInput(selector, hiddenName)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string` | Selector matching each digit input (e.g. `.code-input`) |
| `hiddenName` | `string` | Name of the target hidden input (e.g. `'code'`). Digit inputs must have `data-id="${hiddenName}"` |
