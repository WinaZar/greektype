# GreekType

GreekType is a macOS app for touch typing practice on the Greek keyboard layout. At the start, you type a small set of keys. When all these keys are fast enough, the app adds the next key.

The app uses Tauri 2 and Svelte 5. For the terms in this file, see [GLOSSARY.md](GLOSSARY.md). For the design decisions, see [docs/adr](docs/adr).

## Use the app

You do not have to change the input source of your Mac. The app has its own copy of the macOS Greek layout.

1. Type the text of the lesson.
2. If a character becomes red, you pressed an incorrect key. The cursor does not move. Press the correct key.
3. At the end of the lesson, read your speed and accuracy below the text. The next lesson starts immediately.

The top bar shows the keys that you can type now, and the speed of each key. A frame shows the slowest key. Lessons use this key more frequently than the other keys. When all keys in the top bar are at 35 WPM or faster, the app unlocks the next key.

### Type accents

To type a vowel with an accent, press the accent key first. Then press the vowel.

| Character | Keys |
| --- | --- |
| ά έ ή ί ό ύ ώ | `;`, then the vowel |
| ϊ ϋ | `Shift+;`, then the vowel |

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `⌘1` | Show the lesson. |
| `⌘2` | Show your progress. |
| `⌘K` | Show or hide the keyboard. |

## Requirements

- macOS
- Xcode or the Xcode Command Line Tools
- Rust 1.90 or later
- Node.js 22.12 or later (use a long-term support version)

## Install the app

Do all the commands in the project folder.

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Build the app:

   ```sh
   npm run tauri build -- --bundles app
   ```

   The build puts the app in `src-tauri/target/release/bundle/macos/GreekType.app`.

3. Copy the app to the Applications folder:

   ```sh
   cp -R src-tauri/target/release/bundle/macos/GreekType.app /Applications/
   ```

4. Open GreekType from Spotlight or Launchpad.

The app has no signature. macOS does not block it, because you built it on your Mac.

## Update the app

Do all the commands in the project folder.

1. Quit GreekType.
2. Get the latest source code.
3. Install the dependencies:

   ```sh
   npm install
   ```

4. Build the app:

   ```sh
   npm run tauri build -- --bundles app
   ```

5. Remove the old app:

   ```sh
   rm -rf /Applications/GreekType.app
   ```

6. Copy the new app to the Applications folder:

   ```sh
   cp -R src-tauri/target/release/bundle/macos/GreekType.app /Applications/
   ```

> **NOTE:** The update does not delete your progress. macOS keeps the progress outside the app folder, under the identifier of the app (`local.greektype`).

## Development

| Command | Result |
| --- | --- |
| `npm test` | Runs the tests for the layout, the lessons, and the progression. |
| `npm run check` | Checks the types. |
| `npm run tauri dev` | Starts the app in development mode. This app keeps its progress separately from the installed app. |
| `npm run tauri build` | Builds the app. |
| `npm run words` | Downloads the word list again and makes `src/lib/words.json` again. |
| `npx tauri icon app-icon.svg` | Makes the app icons in `src-tauri/icons` from `app-icon.svg`. |

## Word list

The words for the lessons come from [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave. FrequencyWords is a list of the most frequent Greek words in the OpenSubtitles 2018 corpus. The license of the word list is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The script `scripts/build-words.mjs` removes incorrect words and word fragments from the list. Then the script keeps the 10,000 most frequent words.
