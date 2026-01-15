# DSSelect Plugin Usage Guide

A comprehensive searchable select component with single/multiple selection, remote data fetching, Laravel integration, and full event system.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Blade Component](#blade-component)
- [JavaScript API](#javascript-api)
- [Configuration](#configuration)
- [Data Sources](#data-sources)
- [Methods](#methods)
- [Events](#events)
- [Laravel Integration](#laravel-integration)
- [Styling](#styling)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Installation

The DSSelect plugin is automatically initialized on page load for elements with `[data-ds-select]` attribute.

For manual initialization, import the plugin:

```javascript
import { DSSelect } from '../Plugins/DSSelect.js';
```

---

## Quick Start

### Using Blade Component (Recommended)

```blade
<x-form.searchable-select 
    name="category_id" 
    label="Category"
    :options="$categories->pluck('name', 'id')->toArray()"
    :placeholder="__('Select a category')"
/>
```

### Using HTML + JavaScript

```html
<div 
    data-ds-select
    data-name="category_id"
    data-placeholder="Select a category"
    data-options='[{"id": 1, "name": "Option 1"}, {"id": 2, "name": "Option 2"}]'
></div>
```

```javascript
// Auto-initializes on page load, or manually:
DSSelect.initAll();
```

---

## Blade Component

The `x-form.searchable-select` Blade component provides a convenient Laravel integration.

### Basic Usage

```blade
<x-form.searchable-select 
    name="status" 
    label="Status"
    :options="['draft' => 'Draft', 'published' => 'Published', 'archived' => 'Archived']"
/>
```

### Available Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | `''` | Form input name |
| `label` | string | `''` | Label text |
| `value` | mixed | `null` | Pre-selected value(s) |
| `options` | array | `[]` | Available options |
| `multiple` | bool | `false` | Enable multiple selection |
| `clearable` | bool | `true` | Show clear button |
| `searchable` | bool | `true` | Enable search filtering |
| `placeholder` | string | `'Select...'` | Placeholder text |
| `searchPlaceholder` | string | `'Type to search...'` | Search input placeholder |
| `disabled` | bool | `false` | Disable the select |
| `required` | bool | `false` | Mark as required |
| `axiosUrl` | string | `null` | Remote data URL |
| `maxSelections` | int | `null` | Max items in multiple mode |
| `valueKey` | string | `'id'` | Key for option value |
| `labelKey` | string | `'name'` | Key for option label |

### Single Selection

```blade
<x-form.searchable-select 
    name="registrar_id"
    label="Registrar"
    :options="$registrars->pluck('title', 'id')->toArray()"
    :placeholder="__('Select registrar')"
/>
```

### Multiple Selection

```blade
<x-form.searchable-select 
    name="tags"
    label="Tags"
    :multiple="true"
    :clearable="true"
    :options="$tags->pluck('title', 'id')->toArray()"
    :placeholder="__('Select tags')"
/>
```

> [!IMPORTANT]
> For multiple selection, the form will submit values as an array (e.g., `tags[]`). Your backend should expect an array.

### With Max Selections

```blade
<x-form.searchable-select 
    name="categories"
    label="Categories (max 3)"
    :multiple="true"
    :maxSelections="3"
    :options="$categories->pluck('name', 'id')->toArray()"
/>
```

### Pre-selected Values

```blade
{{-- Single value --}}
<x-form.searchable-select 
    name="status"
    :value="$domain->status"
    :options="$statuses"
/>

{{-- Multiple values --}}
<x-form.searchable-select 
    name="tags"
    :multiple="true"
    :value="$domain->tags->pluck('id')->toArray()"
    :options="$tags->pluck('name', 'id')->toArray()"
/>
```

---

## JavaScript API

### Creating Instances

```javascript
// Using constructor
const select = new DSSelect('#mySelect', {
    multiple: true,
    placeholder: 'Select items...'
});

// Using factory method
const select = DSSelect.create('#mySelect', config);

// Auto-initialize all [data-ds-select] elements
DSSelect.initAll();
```

### Getting Existing Instance

```javascript
const instance = DSSelect.getInstance('#mySelect');
if (instance) {
    console.log('Current value:', instance.getValue());
}
```

---

## Configuration

### Default Options

```javascript
{
    // Data sources
    options: [],                    // [{id: 1, name: 'Option'}] or {1: 'Option'}
    axiosUrl: null,                 // Remote data URL
    axiosMethod: 'GET',             // HTTP method for remote
    axiosParams: {},                // Additional params
    axiosSearchParam: 'search',     // Search query param name
    axiosDataPath: 'data',          // Path to options in response

    // Value configuration
    valueKey: 'id',                 // Key for option value
    labelKey: 'name',               // Key for option label

    // Selection
    multiple: false,                // Allow multiple selection
    maxSelections: null,            // Max items in multiple mode

    // Search
    searchable: true,               // Enable search input
    searchMinLength: 0,             // Min chars before search
    searchDebounce: 300,            // Debounce delay (ms)

    // UI
    placeholder: 'Select...',
    searchPlaceholder: 'Type to search...',
    noResultsText: 'No results found',
    loadingText: 'Loading...',
    clearable: true,                // Show clear button
    disabled: false,

    // Dropdown
    closeOnSelect: true,            // Close after selection (single mode)
    openOnFocus: true,              // Open when input focused
    maxHeight: '240px',             // Dropdown max height

    // Classes
    wrapperClass: '',
    inputClass: '',
    dropdownClass: '',
    optionClass: ''
}
```

### Data Attributes

You can configure via HTML data attributes:

| Attribute | Config Key | Type |
|-----------|------------|------|
| `data-name` | - | string |
| `data-id` | - | string |
| `data-placeholder` | `placeholder` | string |
| `data-search-placeholder` | `searchPlaceholder` | string |
| `data-multiple` | `multiple` | "true"/"false" |
| `data-clearable` | `clearable` | "true"/"false" |
| `data-disabled` | `disabled` | "true"/"false" |
| `data-value-key` | `valueKey` | string |
| `data-label-key` | `labelKey` | string |
| `data-axios-url` | `axiosUrl` | string |
| `data-max-selections` | `maxSelections` | number |
| `data-options` | `options` | JSON string |
| `data-old-value` | - | JSON/string (Laravel old()) |
| `data-current-value` | - | JSON/string |

---

## Data Sources

### Static Options (Array of Objects)

```javascript
const select = new DSSelect('#mySelect', {
    options: [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
        { id: 3, name: 'Option 3' }
    ]
});
```

### Static Options (Key-Value Object)

```javascript
const select = new DSSelect('#mySelect', {
    options: {
        'draft': 'Draft',
        'published': 'Published',
        'archived': 'Archived'
    }
});
```

### Remote Data with Axios

```javascript
const select = new DSSelect('#userSelect', {
    axiosUrl: '/api/users',
    axiosMethod: 'GET',
    axiosSearchParam: 'search',
    axiosDataPath: 'data',          // Response structure: { data: [...] }
    searchMinLength: 2,             // Start searching after 2 chars
    searchDebounce: 300             // Debounce API calls
});
```

> [!TIP]
> For remote data, the search query is sent as a URL parameter. Configure `axiosSearchParam` to match your API.

### Custom Value/Label Keys

```javascript
const select = new DSSelect('#mySelect', {
    options: [
        { code: 'US', title: 'United States' },
        { code: 'UK', title: 'United Kingdom' }
    ],
    valueKey: 'code',
    labelKey: 'title'
});
```

---

## Methods

### Value Management

```javascript
const select = DSSelect.getInstance('#mySelect');

// Get current value(s)
const value = select.getValue();           // Single: "1" or Multiple: ["1", "2"]

// Get full selected option(s) with data
const selected = select.getSelected();     // Single: {value, label, data} or Multiple: [{...}]

// Set value(s)
select.setValue('1');                       // Single
select.setValue(['1', '2', '3']);          // Multiple

// Clear all selections
select.clear();

// Reset to initial value
select.reset();
```

### Option Management

```javascript
// Add new option(s)
select.addOption({ id: 4, name: 'New Option' });
select.addOption([
    { id: 5, name: 'Option 5' },
    { id: 6, name: 'Option 6' }
]);

// Remove option by value
select.removeOption('4');

// Replace all options
select.setOptions([
    { id: 1, name: 'New Option 1' },
    { id: 2, name: 'New Option 2' }
]);

// Refresh from remote (if axiosUrl is set)
select.refresh();
```

### Dropdown Control

```javascript
// Open dropdown
select.open();

// Close dropdown
select.close();

// Toggle dropdown
select.toggle();
```

### State Management

```javascript
// Enable/Disable
select.enable();
select.disable();

// Destroy instance
select.destroy();
```

---

## Events

### Available Events

| Event | Data | Description |
|-------|------|-------------|
| `open` | `{}` | Dropdown opened |
| `close` | `{}` | Dropdown closed |
| `search` | `{ term }` | User typed in search |
| `load` | `{ options }` | Remote options loaded |
| `select` | `{ option, selected }` | Option selected |
| `deselect` | `{ option, selected }` | Option deselected (multiple) |
| `change` | `{ value, selected }` | Value changed |
| `clear` | `{}` | All selections cleared |
| `reset` | `{}` | Reset to initial value |
| `maxReached` | `{ max }` | Max selections reached |
| `enable` | `{}` | Select enabled |
| `disable` | `{}` | Select disabled |
| `destroy` | `{}` | Instance destroyed |
| `error` | `{ error }` | Remote fetch error |

### Using `on()` Method

```javascript
const select = new DSSelect('#mySelect', { multiple: true });

select.on('change', ({ value, selected }) => {
    console.log('Selected values:', value);
    console.log('Selected options:', selected);
});

select.on('select', ({ option }) => {
    console.log('Selected:', option.label);
});

select.on('maxReached', ({ max }) => {
    alert(`Maximum ${max} items allowed`);
});
```

### Chaining Events

```javascript
select
    .on('open', () => console.log('Opened'))
    .on('close', () => console.log('Closed'))
    .on('change', handleChange);
```

### DOM CustomEvents

```javascript
document.querySelector('#mySelect').addEventListener('dsselect:change', (e) => {
    console.log('Value changed:', e.detail.value);
    console.log('Instance:', e.detail.instance);
});
```

### Removing Listeners

```javascript
// Remove specific handler
select.off('change', myHandler);

// Remove all handlers for an event
select.off('change');
```

---

## Laravel Integration

### Controller Setup

```php
// DomainController.php
public function create()
{
    return view('domains.create', [
        'categories' => Category::orderBy('title')->get(),
        'tags' => Tag::orderBy('title')->get(),
        'registrars' => Registrar::active()->get(),
    ]);
}
```

### Blade Template

```blade
<form action="{{ route('domains.store') }}" method="POST">
    @csrf
    
    {{-- Single Select --}}
    <x-form.searchable-select 
        name="category_id"
        label="Category"
        :options="$categories->pluck('title', 'id')->toArray()"
        :placeholder="__('Select category')"
        required
    />
    
    {{-- Multiple Select --}}
    <x-form.searchable-select 
        name="tags"
        label="Tags"
        :multiple="true"
        :options="$tags->pluck('title', 'id')->toArray()"
        :placeholder="__('Select tags')"
    />
    
    <button type="submit">Save</button>
</form>
```

### Handling Old Values (Validation Errors)

The component automatically handles Laravel's `old()` helper for repopulating form data after validation errors.

```php
// Request Validation
$validated = $request->validate([
    'category_id' => 'required|exists:categories,id',
    'tags' => 'array',
    'tags.*' => 'exists:tags,id',
]);
```

### Edit Form with Existing Values

```blade
<x-form.searchable-select 
    name="tags"
    label="Tags"
    :multiple="true"
    :value="$domain->tags->pluck('id')->toArray()"
    :options="$tags->pluck('title', 'id')->toArray()"
/>
```

### Remote Search API

```php
// routes/api.php
Route::get('/users/search', [UserController::class, 'search']);

// UserController.php
public function search(Request $request)
{
    $search = $request->get('search', '');
    
    $users = User::where('name', 'like', "%{$search}%")
        ->orWhere('email', 'like', "%{$search}%")
        ->limit(20)
        ->get(['id', 'name', 'email']);
    
    return response()->json([
        'data' => $users
    ]);
}
```

```blade
<x-form.searchable-select 
    name="user_id"
    label="User"
    axiosUrl="/api/users/search"
    :placeholder="__('Search users...')"
/>
```

---

## Styling

### Default CSS Classes

The component uses these CSS classes:

```css
/* Wrapper */
.ds-select-wrapper { }

/* Control (main input area) */
.ds-select-control { }

/* Selected tags (multiple mode) */
.ds-select-tag { }

/* Search input */
.ds-select-search { }

/* Dropdown */
.ds-select-dropdown { }

/* Options list */
.ds-select-options { }

/* Individual option */
.ds-select-option { }
```

### Customizing with DaisyUI

The component is designed to work with DaisyUI out of the box:

- Uses `input input-bordered` for the control
- Uses `badge badge-primary` for selected tags
- Uses `btn btn-ghost` for buttons
- Uses `bg-base-100`, `bg-base-200` for backgrounds

### Custom Styling

```javascript
const select = new DSSelect('#mySelect', {
    wrapperClass: 'my-custom-wrapper',
    inputClass: 'my-custom-input',
    dropdownClass: 'my-custom-dropdown',
    optionClass: 'my-custom-option'
});
```

---

## Examples

### Basic Single Select

```blade
<x-form.searchable-select 
    name="country"
    label="Country"
    :options="[
        'us' => 'United States',
        'uk' => 'United Kingdom',
        'ca' => 'Canada',
        'au' => 'Australia'
    ]"
    :placeholder="__('Select a country')"
/>
```

### Multiple Select with Tags

```blade
<x-form.searchable-select 
    name="categories"
    label="Categories"
    :multiple="true"
    :clearable="true"
    :options="$categories->pluck('title', 'id')->toArray()"
    :placeholder="__('Select categories')"
/>
```

### Remote User Search

```blade
<x-form.searchable-select 
    name="owner_id"
    label="Owner"
    axiosUrl="{{ route('api.users.search') }}"
    :placeholder="__('Search for a user...')"
    searchPlaceholder="Type to search..."
/>
```

### JavaScript Integration

```javascript
import { DSSelect } from '../Plugins/DSSelect.js';

document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = DSSelect.getInstance('[data-name="category_id"]');
    const tagSelect = DSSelect.getInstance('[data-name="tags"]');
    
    // Update tags when category changes
    categorySelect?.on('change', async ({ value }) => {
        if (!value) return;
        
        // Fetch tags for selected category
        const response = await axios.get(`/api/categories/${value}/tags`);
        
        // Update tag options
        tagSelect?.setOptions(response.data);
    });
});
```

### Form with Multiple Selects

```blade
<form id="domainForm" action="{{ route('dashboard.domains.store') }}" method="POST">
    @csrf
    
    <x-form.input-icon name="domain" label="Domain" icon="domain" required />
    
    <x-form.searchable-select 
        name="primary_category_id"
        label="Primary Category"
        :options="$categories->pluck('title', 'id')->toArray()"
    />
    
    <x-form.searchable-select 
        name="categories"
        label="Additional Categories"
        :multiple="true"
        :options="$categories->pluck('title', 'id')->toArray()"
    />
    
    <x-form.searchable-select 
        name="tags"
        label="Tags"
        :multiple="true"
        :clearable="true"
        :options="$tags->pluck('title', 'id')->toArray()"
    />
    
    <button type="submit" class="btn btn-primary">Save Domain</button>
</form>
```

---

## Troubleshooting

### Multiple Select Values Not Submitting as Array

**Problem**: Form submits `tags: "2"` instead of `tags: ["1", "2"]`.

**Solution**: Ensure you're using DSForm or standard form submission. If using AJAX with JSON, make sure DSForm's `_parsePath` method properly handles array notation.

### Old Values Not Repopulating

**Problem**: After validation error, previously selected values are lost.

**Solution**: Check that `old()` returns the correct format. For multiple selects, Laravel should return an array.

```php
// In your controller, use array validation
$request->validate([
    'tags' => 'array',
    'tags.*' => 'exists:tags,id',
]);
```

### Remote Search Not Working

**Problem**: No results when typing in search.

**Solution**: 
1. Check that `axiosUrl` is correct and accessible
2. Verify `axiosDataPath` matches your API response structure
3. Check browser console for network errors

### Dropdown Not Opening

**Problem**: Clicking the select does nothing.

**Solution**: 
1. Check for JavaScript errors in console
2. Ensure the element has `data-ds-select` attribute
3. Call `DSSelect.initAll()` after dynamic content loads

### Maximum Selections Not Enforced

**Problem**: Can select more items than `maxSelections`.

**Solution**: Ensure `maxSelections` is a number, not a string:

```blade
{{-- Correct --}}
:maxSelections="3"

{{-- Incorrect --}}
maxSelections="3"
```

---

## TypeScript Support

For TypeScript projects, create a declaration file:

```typescript
// DSSelect.d.ts
declare class DSSelect {
    constructor(selector: string | HTMLElement, config?: DSSelectConfig);
    
    static create(selector: string | HTMLElement, config?: DSSelectConfig): DSSelect;
    static getInstance(element: string | HTMLElement): DSSelect | null;
    static initAll(selector?: string): void;
    
    // Value management
    getValue(): string | string[] | null;
    getSelected(): DSSelectOption | DSSelectOption[] | null;
    setValue(value: string | string[]): void;
    clear(): void;
    reset(): void;
    
    // Options management
    addOption(option: DSSelectOption | DSSelectOption[]): void;
    removeOption(value: string): void;
    setOptions(options: DSSelectOption[] | Record<string, string>): void;
    refresh(): void;
    
    // Dropdown control
    open(): void;
    close(): void;
    toggle(): void;
    
    // State
    enable(): void;
    disable(): void;
    destroy(): void;
    
    // Events
    on(event: string, handler: (data: any) => void): DSSelect;
    off(event: string, handler?: (data: any) => void): DSSelect;
}

interface DSSelectConfig {
    options?: DSSelectOption[] | Record<string, string>;
    multiple?: boolean;
    maxSelections?: number;
    placeholder?: string;
    searchPlaceholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    axiosUrl?: string;
    axiosMethod?: 'GET' | 'POST';
    axiosParams?: Record<string, any>;
    axiosSearchParam?: string;
    axiosDataPath?: string;
    valueKey?: string;
    labelKey?: string;
    searchable?: boolean;
    searchMinLength?: number;
    searchDebounce?: number;
    closeOnSelect?: boolean;
    openOnFocus?: boolean;
    maxHeight?: string;
    wrapperClass?: string;
    inputClass?: string;
    dropdownClass?: string;
    optionClass?: string;
}

interface DSSelectOption {
    value: string;
    label: string;
    data?: any;
}
```
