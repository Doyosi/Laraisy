# DSLogout Usage

`DSLogout` handles secure logout actions via AJAX (usually POST request to Laravel).

## Usage

```html
<a href="#" class="logout-link" data-logout-url="/logout">Logout</a>

<script>
    import { DSLogout } from '@doyosi/laraisy';
    // Auto-initialized on import if selector matches, or:
    const logoutHandler = new DSLogout('.logout-link');
</script>
```

## Features
- Prevents default link behavior.
- Submits a POST request to the `data-logout-url`.
- Refreshes the page on success to clear session state.
