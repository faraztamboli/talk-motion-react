# Internationalization (i18n) Setup

This project uses `react-i18next` for internationalization and supports both LTR (Left-to-Right) and RTL (Right-to-Left) languages.

## Supported Languages

- English (en) - LTR
- Spanish (es) - LTR
- French (fr) - LTR
- German (de) - LTR
- Arabic (ar) - RTL
- Chinese (zh) - LTR
- Japanese (ja) - LTR
- Korean (ko) - LTR
- Russian (ru) - LTR
- Hindi (hi) - LTR
- Turkish (tr) - LTR
- Portuguese (pt) - LTR
- Italian (it) - LTR

## RTL Languages

The following languages automatically switch the UI to RTL mode:
- Arabic (ar)
- Hebrew (he)
- Persian/Farsi (fa)
- Urdu (ur)

## Usage in Components

### Basic Translation

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

### Using with Language Context

```jsx
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { selectedLanguage, changeLanguage, direction, isRTL } = useLanguage();
  const { t } = useTranslation();
  
  return (
    <div>
      <p>Current Language: {selectedLanguage}</p>
      <p>Direction: {direction}</p>
      <p>Is RTL: {isRTL ? 'Yes' : 'No'}</p>
      <button onClick={() => changeLanguage('ar')}>
        Switch to Arabic
      </button>
    </div>
  );
}
```

### Translation Keys Structure

Translation keys follow a nested structure:
- `common.*` - Common UI elements (buttons, labels, etc.)
- `header.*` - Header component translations
- `dashboard.*` - Dashboard page translations
- `sidebar.*` - Sidebar navigation translations
- `auth.*` - Authentication pages translations
- `converter.*` - Converter page translations
- `models.*` - Models page translations
- `courses.*` - Courses page translations
- `classrooms.*` - Classrooms page translations
- `profile.*` - Profile page translations
- `settings.*` - Settings page translations

## Adding New Translations

1. Add the translation key to all language files in `src/i18n/locales/`
2. Use the key in your component with `t('key.path')`
3. The translation will automatically update when the language changes

## RTL Support

RTL support is automatically handled:
- The `dir` attribute is set on the HTML element
- CSS classes are applied to the body element
- Ant Design components are configured for RTL
- Custom CSS rules handle RTL-specific styling

## Language Switching

The language can be changed using:
1. The LanguageSelector component in the header
2. Programmatically: `changeLanguage('ar')` from `useLanguage()` hook

The language preference is saved to localStorage and persists across sessions.

