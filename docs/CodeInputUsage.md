# CodeInput Usage

`CodeInput` is a 6-digit (or n-digit) verification code input handler. It manages auto-focusing on the next input field as the user types.

## Usage

```html
<div class="code-inputs">
    <input type="text" maxlength="1" class="code-input">
    <input type="text" maxlength="1" class="code-input">
    <input type="text" maxlength="1" class="code-input">
    <input type="text" maxlength="1" class="code-input">
</div>

<script>
    import { CodeInput } from '@doyosi/laraisy';
    
    // Initialize container
    new CodeInput('.code-inputs');
</script>
```
