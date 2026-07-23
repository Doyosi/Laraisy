# DSLocaleSwitcher Usage Guide

`DSLocaleSwitcher` is a component for managing multi-locale translatable form fields in Laravel applications. It automatically toggles input visibility based on the selected locale, updates dropdown UI labels and flags, and provides full value retrieval and event hooks.

## Installation

```javascript
import { DSLocaleSwitcher } from '@doyosi/laraisy';

// Auto-initialize all elements with [data-ds-locale-switcher]
DSLocaleSwitcher.initAll();
```

---

## Basic Usage

### HTML Structure

```html
<div data-ds-locale-switcher class="dropdown">
    <!-- Trigger Button -->
    <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-2" data-ds-locale-trigger>
        <span class="fi fi-gb text-sm"></span>
        <span data-ds-locale-label>English</span>
    </div>

    <!-- Dropdown Menu -->
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
            <a data-ds-locale-option="en" data-locale-name="English" data-locale-flag="gb" class="active">
                <span class="fi fi-gb"></span> English
            </a>
        </li>
        <li>
            <a data-ds-locale-option="tr" data-locale-name="Türkçe" data-locale-flag="tr">
                <span class="fi fi-tr"></span> Türkçe
            </a>
        </li>
    </ul>

    <!-- Translatable Input Fields -->
    <div class="form-control mt-4">
        <label class="label"><span class="label-text">Title</span></label>
        
        <!-- English Field -->
        <div data-locale-translatable="en">
            <input type="text" name="title[en]" class="input input-bordered w-full" placeholder="Enter title in English..." />
        </div>
        
        <!-- Turkish Field -->
        <div data-locale-translatable="tr" style="display: none;">
            <input type="text" name="title[tr]" class="input input-bordered w-full" placeholder="Türkçe başlık giriniz..." />
        </div>
    </div>
</div>
```

---

## JavaScript API

### Manual Initialization

```javascript
import { DSLocaleSwitcher } from '@doyosi/laraisy';

const switcher = new DSLocaleSwitcher('#my-locale-switcher', {
    defaultLocale: 'en',
    onSwitch: ({ locale, prevLocale, instance }) => {
        console.log(`Locale changed from ${prevLocale} to ${locale}`);
    }
});
```

### Static Methods

| Method | Description |
|--------|-------------|
| `DSLocaleSwitcher.initAll(selector?)` | Auto-initializes all matching containers (default: `[data-ds-locale-switcher]`) |
| `DSLocaleSwitcher.create(selector, config)` | Factory method to instantiate a new switcher |
| `DSLocaleSwitcher.getInstance(element)` | Retrieves an active instance by element or selector |

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | `string` | `'en'` | Initial active locale |
| `onSwitch` | `Function` | `null` | Callback function triggered on locale change: `({ locale, prevLocale, instance })` |

---

## Instance Methods

```javascript
const switcher = DSLocaleSwitcher.getInstance('#my-locale-switcher');

// Switch active locale programmatically
switcher.switchTo('tr');

// Get current active locale
const current = switcher.getCurrentLocale(); // e.g. 'tr'

// Get values across all locales
const values = switcher.getValues(); 
// Returns: { en: "Hello", tr: "Merhaba" }

// Set values across all locales
switcher.setValues({
    en: 'Welcome',
    tr: 'Hoş geldiniz'
});

// Destroy instance and remove event listeners
switcher.destroy();
```

---

## HTML Data Attributes

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-ds-locale-switcher` | Container | Marks the root wrapper for auto-initialization |
| `data-ds-locale-trigger` | Button/Element | Target element for dropdown trigger flag updates |
| `data-ds-locale-label` | Element | Text node that displays the active locale name |
| `data-ds-locale-option` | Link/Button | Clickable option specifying the target locale code (e.g. `en`, `tr`) |
| `data-locale-name` | Option | Human-readable label for the locale (e.g. `English`) |
| `data-locale-flag` | Option | Flag icon suffix class (e.g. `gb` for `fi-gb`) |
| `data-locale-translatable` | Wrapper/Input | Container element for fields associated with a specific locale |

---

## Events

`DSLocaleSwitcher` dispatches a custom DOM event on the container element:

```javascript
document.querySelector('[data-ds-locale-switcher]').addEventListener('dslocale:switch', (e) => {
    const { locale, prevLocale, instance } = e.detail;
    console.log(`Switched to ${locale} from ${prevLocale}`);
});
```
