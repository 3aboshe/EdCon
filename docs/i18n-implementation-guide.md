# Internationalization (i18n) Implementation Guide

## Overview

EdCona uses React-i18next for internationalization with comprehensive RTL (Right-to-Left) support for Arabic, Kurdish (Sorani & Bahdini), and Modern Assyrian languages.

## Architecture

### Core Files

1. **i18n Configuration** (`src/i18n.ts`)
   - Language detection and fallback
   - RTL language detection
   - Document direction management

2. **Translation Files** (`src/locales/[lang]/translation.json`)
   - English: `src/locales/en/translation.json`
   - Arabic: `src/locales/ar/translation.json`
   - Kurdish Sorani: `src/locales/ku-sorani/translation.json`
   - Kurdish Bahdini: `src/locales/ku-badini/translation.json`
   - Modern Assyrian: `src/locales/syr/translation.json`

3. **RTL CSS Utilities** (`src/styles/rtl.css`)
   - Comprehensive RTL styling support
   - Automatic direction switching
   - Component-specific RTL adjustments

4. **Language Selector** (`src/components/ui/LanguageSelector.tsx`)
   - Dropdown with flag icons
   - Automatic RTL detection
   - Language persistence

## Adding a New Language

### Step 1: Update i18n Configuration

Edit `src/i18n.ts` and add your language to the configuration:

```typescript
const resources = {
  en: { translation: require('./locales/en/translation.json') },
  ar: { translation: require('./locales/ar/translation.json') },
  'ku-sorani': { translation: require('./locales/ku-sorani/translation.json') },
  'ku-badini': { translation: require('./locales/ku-badini/translation.json') },
  syr: { translation: require('./locales/syr/translation.json') },
  // Add your new language here
  'your-lang-code': { 
    translation: require('./locales/your-lang-code/translation.json') 
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
```

### Step 2: Create Translation File

Create a new directory and file: `src/locales/your-lang-code/translation.json`

Copy the English translation file as a starting point:
```bash
cp src/locales/en/translation.json src/locales/your-lang-code/translation.json
```

### Step 3: Translate All Keys

Translate all values in the new translation file. Example:

```json
{
  "app_name": "EdCona",
  "login_welcome": "Welcome to EdCona",
  "dashboard": "Dashboard",
  // ... translate all keys
}
```

### Step 4: Add Language to Language Selector

Update `src/components/ui/LanguageSelector.tsx` to include your language:

```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ku-sorani', name: 'کوردی (سۆرانی)', flag: '🏴', dir: 'rtl' },
  { code: 'ku-badini', name: 'کوردی (بادینی)', flag: '🏴', dir: 'rtl' },
  { code: 'syr', name: 'ܐܬܘܪܝܐ ܚܕܬܐ', flag: '🏴', dir: 'rtl' },
  // Add your language here
  { 
    code: 'your-lang-code', 
    name: 'Your Language Name', 
    flag: '🏳️', 
    dir: 'ltr' // or 'rtl' for RTL languages
  },
];
```

### Step 5: RTL Support (if needed)

If your language is RTL, update the RTL detection in `src/i18n.ts`:

```typescript
const rtlLanguages = ['ar', 'ku-sorani', 'ku-badini', 'syr', 'your-lang-code'];
```

### Step 6: Update CSS (if needed)

For RTL languages, add any specific CSS rules to `src/styles/rtl.css`:

```css
[dir="rtl"] .your-specific-component {
  /* RTL-specific styles */
}
```

## Translation Key Guidelines

### Naming Conventions

- Use snake_case for all keys
- Group related keys with prefixes
- Use descriptive names

```json
{
  "user_management": "User Management",
  "user_profile": "User Profile",
  "user_settings": "User Settings",
  
  "homework_assigned": "Homework Assigned",
  "homework_due": "Homework Due",
  "homework_submitted": "Homework Submitted"
}
```

### Interpolation

Use interpolation for dynamic content:

```json
{
  "welcome_user": "Welcome, {{name}}!",
  "items_count": "{{count}} items",
  "due_in_days": "Due in {{count}} days"
}
```

### Pluralization

For plural forms, use keys with `_zero`, `_one`, `_two`, `_few`, `_many`, `_other` suffixes:

```json
{
  "items_zero": "No items",
  "items_one": "1 item",
  "items_other": "{{count}} items"
}
```

## Testing Your Language

### 1. Language Switching

Test the language selector:
1. Open the application
2. Click the language selector
3. Select your new language
4. Verify all text updates

### 2. RTL Testing (if applicable)

For RTL languages:
1. Verify text direction is right-to-left
2. Check layout adjustments
3. Test form inputs (should be right-aligned)
4. Verify navigation and spacing

### 3. Component Testing

Test all major components:
- Login screen
- Dashboard
- Forms and modals
- Navigation
- Tables and lists

## Best Practices

### 1. Translation Quality

- Use native speakers for translation
- Consider cultural context
- Keep translations concise
- Test with real users

### 2. Consistency

- Use consistent terminology
- Maintain same tone across all text
- Follow UI writing guidelines

### 3. Technical Considerations

- Keep JSON syntax valid
- Use UTF-8 encoding
- Test special characters
- Verify font support

## Troubleshooting

### Common Issues

1. **Missing Translation Keys**
   - Check console for missing key warnings
   - Add missing keys to translation file
   - Restart development server

2. **RTL Layout Issues**
   - Check `src/styles/rtl.css` for missing rules
   - Verify language is in `rtlLanguages` array
   - Test with different screen sizes

3. **Language Not Appearing**
   - Verify language code in i18n configuration
   - Check translation file path
   - Ensure JSON syntax is valid

### Debug Tools

Use browser dev tools to:
- Check document direction: `document.documentElement.dir`
- Verify current language: `document.documentElement.lang`
- Inspect RTL CSS application

## Performance Considerations

- Translation files are loaded asynchronously
- Consider splitting large translation files
- Use lazy loading for less common languages
- Cache translations in production

## Maintenance

### Regular Updates

1. Review translations periodically
2. Update with new features
3. Remove unused keys
4. Optimize for performance

### Version Control

- Track translation changes in Git
- Use separate branches for major updates
- Tag releases with language updates

## Support

For questions or issues with i18n implementation:

1. Check this documentation first
2. Review existing language implementations
3. Test with different browsers
4. Consult React-i18next documentation

## Language Codes Reference

Use standard ISO 639-1 codes:
- `en` - English
- `ar` - Arabic
- `ku` - Kurdish (use `ku-sorani`, `ku-badini` for variants)
- `syr` - Syriac

For regional variants, use ISO 639-1 + ISO 3166-1:
- `en-US` - English (United States)
- `ar-SA` - Arabic (Saudi Arabia)