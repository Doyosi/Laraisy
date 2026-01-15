# DSAvatar Usage

`DSAvatar` handles user avatar uploads with immediate preview and reset functionality.

## Basic Usage

```html
<div class="avatar-uploader" 
     data-upload-url="/profile/avatar" 
     data-remove-url="/profile/avatar/remove"
     data-name="avatar">
    
    <img src="..." data-ds-avatar-img>
    <input type="file" class="hidden" data-ds-avatar-input>
    
    <button data-ds-avatar-action="trigger-upload">Change</button>
    <button data-ds-avatar-action="trigger-remove">Remove</button>
</div>

<script>
    import { DSAvatar } from '@doyosi/laraisy';
    
    // Manual initialization
    const avatar = new DSAvatar('.avatar-uploader');
</script>
```

## Dependencies

- **Tippy.js**: Used for tooltips on buttons (optional).
- **DSAlert**: Used for success/error notifications.

## Requirements

The component requires specific data attributes on the wrapper and child elements:
- `data-ds-avatar-img`: The `<img>` element to update.
- `data-ds-avatar-input`: The file input.
- `data-ds-avatar-action="trigger-upload"`: Button to open file dialog.
- `data-ds-avatar-action="trigger-remove"`: Button to reset avatar.
