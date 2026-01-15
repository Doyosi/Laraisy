# **DSAlert Documentation**

**DSAlert** is a lightweight, zero-dependency JavaScript library that creates beautiful, responsive alerts and toasts using **Tailwind CSS**.

It is designed to be a **drop-in replacement for SweetAlert2** in projects that already use Tailwind, offering a similar API (fire, Promises) but with a much smaller footprint and native Tailwind styling.

## **🚀 Features**

* **Tiny Footprint**: Zero dependencies, just vanilla JS.

* **Tailwind Native**: Styled entirely with Tailwind utility classes (works with v3 and v4).

* **SweetAlert2 Compatible**: Mimics the fire() API and configuration object.

* **Promise-based**: Await user interaction (Confirm/Cancel).

* **Toasts**: Built-in support for notification toasts with positioning.

* **Customizable**: Easy to override icons and default settings.

## **📦 Installation**

Since DSAlert is a single ES6 module, you can drop it directly into your project.

### **1. Import the Module**

import \{ DSAlert \} from './path/to/DSAlert.js';

### **2. (Optional) Global Scope**

If you are migrating legacy code or want to use it in inline script tags:

import \{ DSAlert \} from './DSAlert.js';
window.Swal = DSAlert; // Spoof SweetAlert2
window.DSAlert = DSAlert;

## **🔥 Basic Usage**

### **Shorthand (Title, Text, Icon)**

Just like SweetAlert2, you can pass arguments directly.

DSAlert.fire('Good job!', 'You clicked the button!', 'success');

### **Configuration Object**

For more control, pass a configuration object.

DSAlert.fire(\{
   title: 'Error!',
   text: 'Do you want to continue?',
   icon: 'error',
   confirmButtonText: 'Cool'
\});

## **🍞 Toasts**

Toasts are non-blocking notifications that appear in the corner of the screen.

DSAlert.fire(\{
   toast: true,
   position: 'top-end',
   icon: 'success',
   title: 'Signed in successfully',
   showConfirmButton: false,
   timer: 3000
\});

### **Available Positions**

* top, top-start, top-end, top-center

* center, center-start, center-end

* bottom, bottom-start, bottom-end, bottom-center

## **💬 Modals & Confirmation**

DSAlert returns a **Promise** that resolves to an object \{ isConfirmed: boolean, isDismissed: boolean \}.

const result = await DSAlert.fire(\{
   title: 'Are you sure?',
   text: "You won't be able to revert this!",
   icon: 'warning',
   showCancelButton: true,
   confirmButtonColor: 'bg-red-600 hover:bg-red-700', // Tailwind classes
   cancelButtonColor: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
   confirmButtonText: 'Yes, delete it!'
\});

if (result.isConfirmed) \{
   DSAlert.fire('Deleted!', 'Your file has been deleted.', 'success');
\}

## **🎨 HTML Content**

You can inject custom HTML into the modal. Tailwind classes work inside the HTML string!

DSAlert.fire(\{
   title: '\<strong\>HTML\</strong\> Example',
   icon: 'info',
   html: \`
       You can use \<b\>bold text\</b\>,
       \<a href="#" class="text-blue-500 underline"\>links\</a\>,
       and other HTML tags.
   \`,
   showCloseButton: true,
   showCancelButton: true,
   focusConfirm: false,
\});

## **⚙️ Configuration Options**

#|
||

**Option**

|

**Type**

|

**Default**

|

**Description**

||
||

title

|

String

|

''

|

The title of the modal/toast.

||
||

text

|

String

|

''

|

The body text.

||
||

html

|

String

|

''

|

Custom HTML content (overrides text).

||
||

icon

|

String

|

''

|

success, error, warning, info, question.

||
||

toast

|

Boolean

|

false

|

If true, displays as a toast notification.

||
||

position

|

String

|

'top-end'

|

Position of the toast (see Toast section).

||
||

timer

|

Number

|

0

|

Auto-close timer in milliseconds.

||
||

showConfirmButton

|

Boolean

|

true

|

Show the "OK" button.

||
||

showCancelButton

|

Boolean

|

false

|

Show the "Cancel" button.

||
||

confirmButtonText

|

String

|

'OK'

|

Text for the confirm button.

||
||

cancelButtonText

|

String

|

'Cancel'

|

Text for the cancel button.

||
||

confirmButtonColor

|

String

|

bg-blue-600...

|

Tailwind classes for confirm button.

||
||

cancelButtonColor

|

String

|

bg-gray-100...

|

Tailwind classes for cancel button.

||
||

backdrop

|

Boolean

|

true

|

Show/hide the dark overlay (modals only).

||
|#

## **🛠 Customization**

### **Overriding Defaults**

You can change the default settings globally for all alerts.

import \{ DSAlert \} from './DSAlert.js';

DSAlert.defaults.confirmButtonColor = 'bg-purple-600 hover:bg-purple-700';
DSAlert.defaults.backdrop = false; // Disable backdrop globally

### **Custom Icons**

You can replace the SVG strings for the icons.

DSAlert.icons.success = \`\<svg\> ... your custom svg ... \</svg\>\`;

## **🤝 Integration with DSForm**

If you are using DSForm.js, you can easily integrate DSAlert to handle form notifications.

import \{ DSForm \} from './DSForm.js';
import \{ DSAlert \} from './DSAlert.js';

// Option 1: Global Spoofing (Easiest)
window.Swal = DSAlert;

// Option 2: DSForm Config
const form = new DSForm(\{
   form: '#my-form',
   toast: \{
       enabled: true,
       useSwal: true, // DSForm will look for window.Swal or just work if you aliased it
       position: 'bottom-right'
   \}
\});