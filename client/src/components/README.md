# Common UI Components

This directory contains reusable UI components for the Store Rating Platform.

## Components

### Layout
A wrapper component that provides consistent navigation and page structure.

**Usage:**
```jsx
import { Layout } from '../components';

function MyPage() {
  return (
    <Layout>
      <h1>Page Content</h1>
    </Layout>
  );
}
```

**Features:**
- Role-specific navigation links
- Logout button
- Responsive mobile menu
- Role badge display

---

### Input
A form input component with validation display.

**Usage:**
```jsx
import { Input } from '../components';

<Input
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
/>
```

**Props:**
- `label` - Input label text
- `type` - Input type (text, email, password, etc.)
- `name` - Input name
- `value` - Input value
- `onChange` - Change handler
- `error` - Error message to display
- `required` - Show required indicator
- `disabled` - Disable input

---

### Button
A button component with loading state and variants.

**Usage:**
```jsx
import { Button } from '../components';

<Button
  variant="primary"
  size="md"
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit
</Button>
```

**Props:**
- `variant` - primary, secondary, success, danger, outline
- `size` - sm, md, lg
- `loading` - Show loading spinner
- `disabled` - Disable button
- `fullWidth` - Make button full width
- `type` - button, submit, reset

---

### Select
A dropdown select component with validation.

**Usage:**
```jsx
import { Select } from '../components';

<Select
  label="Role"
  name="role"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'NORMAL_USER', label: 'Normal User' },
    { value: 'STORE_OWNER', label: 'Store Owner' },
    { value: 'SYSTEM_ADMIN', label: 'System Admin' }
  ]}
  error={errors.role}
  required
/>
```

**Props:**
- `label` - Select label text
- `name` - Select name
- `value` - Selected value
- `onChange` - Change handler
- `options` - Array of options (strings or {value, label} objects)
- `error` - Error message to display
- `placeholder` - Placeholder text
- `required` - Show required indicator

---

### ErrorMessage
A component to display error messages.

**Usage:**
```jsx
import { ErrorMessage } from '../components';

<ErrorMessage
  message={error}
  onClose={() => setError('')}
/>
```

**Props:**
- `message` - Error message text
- `onClose` - Optional close handler

---

### SuccessMessage
A component to display success messages.

**Usage:**
```jsx
import { SuccessMessage } from '../components';

<SuccessMessage
  message="User created successfully!"
  onClose={() => setSuccess('')}
/>
```

**Props:**
- `message` - Success message text
- `onClose` - Optional close handler

---

### Table
A data table component with sorting and pagination.

**Usage:**
```jsx
import { Table } from '../components';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { 
    key: 'role', 
    label: 'Role',
    render: (value) => <span className="badge">{value}</span>
  }
];

<Table
  columns={columns}
  data={users}
  loading={loading}
  sortable={true}
  pagination={true}
  pageSize={10}
  emptyMessage="No users found"
/>
```

**Props:**
- `columns` - Array of column definitions
  - `key` - Data key
  - `label` - Column header
  - `sortable` - Enable sorting (default: true)
  - `render` - Custom render function
- `data` - Array of data objects
- `loading` - Show loading state
- `sortable` - Enable sorting globally
- `pagination` - Enable pagination
- `pageSize` - Items per page
- `emptyMessage` - Message when no data
- `onSort` - External sort handler (columnKey, direction)

---

## Import All Components

```jsx
import {
  Layout,
  Input,
  Button,
  Select,
  ErrorMessage,
  SuccessMessage,
  Table
} from '../components';
```
