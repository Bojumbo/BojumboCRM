# Theme Switching Implementation

## Overview
This CRM application now supports both **Light** and **Dark** themes with seamless switching capabilities while maintaining the minimalist enterprise design aesthetic.

## Technical Implementation

### 1. Dependencies
- **next-themes**: Manages theme state and persistence
- **Tailwind CSS**: Configured with `darkMode: "class"` strategy

### 2. Theme Configuration

#### CSS Variables (`app/globals.css`)
- **Light Mode**: Clean white backgrounds (`#ffffff`), subtle grays (`zinc-50`, `zinc-100`), deep black text (`zinc-900`)
- **Dark Mode**: Deep blacks (`#0a0a0a`), anthracite surfaces (`zinc-900`), soft white text (`zinc-100`)
- **Accent Color**: Electric blue (`#3B82F6`) - consistent across both themes

### 3. Components

#### ThemeProvider (`components/providers/theme-provider.tsx`)
Wraps the entire application and provides theme context.

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

#### ModeToggle (`components/mode-toggle.tsx`)
Theme switcher component with three options:
- ☀️ **Light**: Clean, professional light theme
- 🌙 **Dark**: Enterprise dark theme (default)
- 🖥️ **System**: Follows OS preference

### 4. Updated Components

All major components now support both themes:
- ✅ **Sidebar**: Light gray (`zinc-50`) / Deep black (`#0a0a0a`)
- ✅ **TopBar**: White / Dark with backdrop blur
- ✅ **Layout Content**: White / Black backgrounds
- ✅ **Tables**: Subtle borders and hover states
- ✅ **Cards**: Soft shadows (light) / Thin borders (dark)
- ✅ **Inputs**: Light gray / Dark gray backgrounds

### 5. Design Principles

#### Light Theme
- **Canvas**: Pure white (`#ffffff`) or soft gray (`#fafafa`)
- **Surfaces**: Very light gray (`zinc-50`, `zinc-100`)
- **Borders**: Thin, almost transparent (`border-zinc-200`)
- **Typography**: Deep black (`text-zinc-900`) / Muted gray (`text-zinc-500`)
- **Shadows**: Soft shadows for depth (`shadow-sm`, `shadow-md`)

#### Dark Theme
- **Canvas**: Deep black (`#0a0a0a`)
- **Surfaces**: Anthracite (`zinc-900`, `zinc-950`)
- **Borders**: Thin, semi-transparent (`border-zinc-800/50`)
- **Typography**: Soft white (`text-zinc-100`) / Muted gray (`text-zinc-500`)
- **Shadows**: Minimal, relying on borders for separation

### 6. Smooth Transitions

All color changes include smooth transitions:
```css
transition-colors duration-300
```

Applied globally via:
```css
* {
  @apply border-border transition-colors duration-300;
}
```

## Usage

### Switching Themes
1. Click the theme toggle button in the **TopBar** (top-right corner)
2. Select your preferred theme:
   - **Light**: For daytime use or bright environments
   - **Dark**: For low-light environments or reduced eye strain
   - **System**: Automatically matches your OS theme

### Theme Persistence
The selected theme is automatically saved to `localStorage` and persists across sessions.

## File Structure

```
app/
├── globals.css                          # Theme CSS variables
├── layout.tsx                           # ThemeProvider integration
components/
├── providers/
│   └── theme-provider.tsx              # Theme context provider
├── mode-toggle.tsx                      # Theme switcher UI
├── sidebar.tsx                          # Updated for both themes
├── top-bar.tsx                          # Updated for both themes
└── layout-content.tsx                   # Updated for both themes
```

## Future Enhancements

- [ ] Add custom theme colors (beyond light/dark)
- [ ] Implement theme-specific illustrations
- [ ] Add theme transition animations
- [ ] Create theme preview in settings

---

**Built with ❤️ using Next.js, Tailwind CSS, and next-themes**
