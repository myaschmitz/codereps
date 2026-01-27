# LeetCode SRS (Spaced Repetition System)

A lightweight, offline-first Progressive Web App (PWA) for tracking LeetCode problem reviews using spaced repetition. Built with clean architecture principles and designed for deliberate practice.

## Features

- ✅ **Spaced Repetition Algorithm** - Smart scheduling based on difficulty
- ✅ **Offline-First** - Works without internet using IndexedDB
- ✅ **Autocomplete Search** - Quickly find and review existing problems
- ✅ **Review Queue** - Prioritized by due date with overdue indicators
- ✅ **Progressive Web App** - Install on iPhone, Mac, or any device
- ✅ **Auto-Archive** - Problems automatically archive after 3 successful reviews
- ✅ **Clean Architecture** - Deep modules with information hiding

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Deployment**: Vercel (recommended)

## Architecture

This app follows **John Ousterhout's Philosophy of Software Design** with:

### Deep Modules (Simple Interface, Complex Implementation)

```
src/domain/
├── SRSScheduler.ts       # Handles all scheduling logic
├── ProblemRepository.ts  # Hides IndexedDB complexity
└── ReviewQueue.ts        # Manages review queue sorting
```

### Layers

```
UI Components (Thin)
      ↓
Application Services (Thin orchestrator)
      ↓
Domain Modules (Deep - business logic)
      ↓
Storage Adapter (Deep - hides IndexedDB)
```

## SRS Algorithm

### Initial Intervals
- **Easy**: 90 days (essentially archived)
- **Medium**: 7 days
- **Hard**: 3 days
- **Didn't Get**: 1 day

### Review Progression
After each successful review, intervals multiply:
- Review 1: Base interval
- Review 2: Base × 2
- Review 3: Base × 2
- Review 4+: Base × 3

**Max interval**: 90 days
**Auto-archive**: After 3 successful reviews (EASY or MEDIUM)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Extract the ZIP file**
```bash
unzip leetcode-srs.zip
cd leetcode-srs
```

2. **Install dependencies**
```bash
npm install
```

3. **Run locally**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Vercel CLI (Automatic GitHub Repo Creation)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

Follow the prompts. Vercel will:
- Create a GitHub repository for you
- Deploy your app
- Give you a live URL
- Auto-deploy on every push

### Option 2: GitHub + Vercel Dashboard

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Click "Deploy"

That's it! Your app will be live at `https://your-app.vercel.app`

## Install as PWA

### iPhone
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Mac
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"

### Android
1. Open the app in Chrome
2. Tap the three dots menu
3. Tap "Add to Home Screen"

## Usage Guide

### Adding a Problem

1. **Enter problem name** (autocomplete will suggest existing problems)
2. **Optionally enter problem number**
3. **Select review date** (defaults to today)
4. **Click a difficulty button**:
   - **Easy**: Won't review again (or 90 days)
   - **Medium**: Review in 7 days
   - **Hard**: Review in 3 days
   - **Didn't Get**: Review tomorrow

### Reviewing Problems

1. **Today's Reviews** section shows all due/overdue problems
2. First 3 reviews are always visible
3. Click "Show X more reviews" to see all
4. Click problem name to open on LeetCode (if number is provided)
5. Use **Archive** to manually archive a problem
6. Use **Delete** to permanently remove a problem

### Managing Reviews

- **Archive**: Remove from active reviews (can unarchive later)
- **Auto-archive**: Happens after 3 successful reviews
- **Delete**: Permanently remove (cannot undo)

## File Structure

```
leetcode-srs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── domain/                 # Domain layer (deep modules)
│   │   ├── models/
│   │   │   └── Problem.ts
│   │   ├── SRSScheduler.ts
│   │   ├── ProblemRepository.ts
│   │   └── ReviewQueue.ts
│   │
│   ├── storage/                # Storage layer
│   │   └── IndexedDBAdapter.ts
│   │
│   ├── services/               # Application services
│   │   └── ReviewService.ts
│   │
│   └── components/             # UI components
│       ├── ProblemInput.tsx
│       ├── ReviewList.tsx
│       └── Stats.tsx
│
├── public/                     # Static assets
│   └── manifest.json
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Customization

### Adjust SRS Intervals

Edit `src/domain/SRSScheduler.ts`:

```typescript
private readonly MAX_INTERVAL_DAYS = 90  // Change max interval
private readonly AUTO_ARCHIVE_THRESHOLD = 3  // Change auto-archive threshold

private getBaseInterval(difficulty: Difficulty): number {
  switch (difficulty) {
    case Difficulty.EASY: return 90  // Change intervals
    case Difficulty.MEDIUM: return 7
    case Difficulty.HARD: return 3
    case Difficulty.DIDNT_GET: return 1
  }
}
```

### Change Review Limit

Edit `src/components/ReviewList.tsx`:

```typescript
const REVIEW_LIMIT = 3  // Change number of visible reviews
```

### Customize Colors

Edit `tailwind.config.ts` to change the color scheme.

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Desktop & Mobile)

Requires IndexedDB support (all modern browsers).

## Data Storage

- **Local storage only** - All data stored in IndexedDB
- **No cloud sync** - Works completely offline
- **No tracking** - Your data never leaves your device
- **Clear data**: Delete browser data to reset

To add cloud sync in the future, you can integrate Firebase or Supabase with the existing `ProblemRepository`.

## Troubleshooting

### App not loading
- Check browser console for errors
- Clear browser cache and reload
- Try in incognito mode

### Data not persisting
- Ensure cookies/storage are enabled
- Check if in Private/Incognito mode (IndexedDB disabled)
- Verify browser supports IndexedDB

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## Future Enhancements

Potential features to add:
- [ ] Cloud sync (Firebase/Supabase)
- [ ] LeetCode API integration
- [ ] Problem difficulty tags
- [ ] Review streaks/statistics
- [ ] Export/import data
- [ ] Dark mode
- [ ] Problem notes/solutions

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT License - Use however you want!