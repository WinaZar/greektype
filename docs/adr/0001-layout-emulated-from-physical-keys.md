# The app emulates the Greek layout from physical keys

For each key press, the app reads the physical key (`event.code` and Shift). Then the app finds the character in its own copy of the macOS "Greek" layout. The app does not read the characters from the macOS input source.

There are two reasons for this decision:

- In WKWebView, dead keys such as the tonos key send composition events. It is difficult to process these events correctly.
- If you forget to change the input source, the app gets incorrect characters.

The finger movements are the same with the two methods, because the app uses a copy of the macOS layout. `UCKeyTranslate` confirmed that the copy agrees with `com.apple.keylayout.Greek`.

## Consequences

Practice works with all input sources, for example Russian or English. If Apple changes the Greek layout, change the table in `src/lib/layout.ts` to agree with it.
