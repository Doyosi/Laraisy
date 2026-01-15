# DSSelectBox Usage

A dual-list selector plugin for transferring items between two lists (left ↔ right).

## Basic Usage

```javascript
import DSSelectBox from '../Plugins/DSSelectBox.js';

const selectBox = new DSSelectBox('#container', {
    availableOptions: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
    ],
    selectedOptions: [
        { id: 4, name: 'Item 4' }
    ],
    valueKey: 'id',
    labelKey: 'name',
    onChange: (selected) => {
        console.log('Selected items:', selected);
    }
});
```

## HTML Structure

```html
<div id="container" data-name="selected_items"></div>
```

The plugin generates hidden inputs for form submission:
```html
<input type="hidden" name="selected_items[]" value="1">
<input type="hidden" name="selected_items[]" value="4">
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `availableOptions` | Array/Object | `[]` | Items for the left list |
| `selectedOptions` | Array/Object | `[]` | Pre-selected items (right list) |
| `axiosUrl` | String | `null` | Remote URL to fetch available items |
| `axiosMethod` | String | `'GET'` | HTTP method for remote fetch |
| `axiosParams` | Object | `{}` | Additional params for remote fetch |
| `axiosDataPath` | String | `'data'` | Path to data in response |
| `valueKey` | String | `'id'` | Key for item value |
| `labelKey` | String | `'name'` | Key for item label |
| `availableTitle` | String | `'Available Items'` | Left list title |
| `selectedTitle` | String | `'Selected Items'` | Right list title |
| `selectAllText` | String | `'Select All'` | Button text |
| `invertSelectionText` | String | `'Invert'` | Button text |
| `searchPlaceholder` | String | `'Search...'` | Search input placeholder |
| `noItemsText` | String | `'No items'` | Empty list message |
| `listHeight` | String | `'300px'` | List container height |
| `onChange` | Function | `null` | Callback when selection changes |
| `onMove` | Function | `null` | Callback when items are moved |

## Data Formats

### Array of Objects
```javascript
availableOptions: [
    { id: 1, name: 'Option 1' },
    { id: 2, name: 'Option 2' }
]
```

### Key-Value Object
```javascript
availableOptions: {
    '1': 'Option 1',
    '2': 'Option 2'
}
```

### Remote Data (AJAX)
```javascript
const selectBox = new DSSelectBox('#container', {
    axiosUrl: '/api/items',
    axiosDataPath: 'data',
    valueKey: 'id',
    labelKey: 'title'
});
```

## Features

### Transfer Buttons
- `>` - Move highlighted items to right
- `<` - Move highlighted items to left
- `>>` - Move all visible items to right
- `<<` - Move all visible items to left

### Selection
- **Click** - Select single item
- **Ctrl+Click** - Add to selection (multi-select)
- **Double-click** - Instantly move item

### Search
Both lists have search inputs that filter items in real-time.

## Public Methods

### getSelected()
Returns array of selected values.
```javascript
const values = selectBox.getSelected(); // ['1', '4', '7']
```

### getSelectedItems()
Returns array of selected item objects.
```javascript
const items = selectBox.getSelectedItems();
// [{ value: '1', label: 'Item 1', data: {...} }, ...]
```

### setSelected(values)
Programmatically select items by value.
```javascript
selectBox.setSelected(['1', '2', '3']);
```

### reset()
Move all items back to available list.
```javascript
selectBox.reset();
```

### destroy()
Clean up and remove the component.
```javascript
selectBox.destroy();
```

## Events

### dsselectbox:change
Fired when selection changes.
```javascript
container.addEventListener('dsselectbox:change', (e) => {
    console.log('Selected:', e.detail.selected);
    console.log('Direction:', e.detail.direction); // 'left' or 'right'
    console.log('Moved:', e.detail.moved);
});
```

## Blade Example

```blade
<div id="mySelectBox" 
     data-name="category_ids"
     data-available-title="{{ __('Available Categories') }}"
     data-selected-title="{{ __('Selected Categories') }}">
</div>

<script>
    window.selectBoxData = {
        available: @json($availableCategories),
        selected: @json($selectedCategories)
    };
</script>
```

```javascript
// In your JS file
const selectBox = new DSSelectBox('#mySelectBox', {
    availableOptions: window.selectBoxData.available,
    selectedOptions: window.selectBoxData.selected,
    valueKey: 'id',
    labelKey: 'title'
});
```

## Static Methods

### getInstance(element)
Get existing instance from element.
```javascript
const instance = DSSelectBox.getInstance('#container');
```
