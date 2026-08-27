# Chat reading concept v1

## Single job

Read an ongoing SillyTavern conversation while preserving the selected scene background.

## Evidence used

- Latest-version feature overlay: large serif heading, thin extension line, short blue-violet information plate.
- In-game dialogue state: speaker and current line stay near the lower visual field; dialogue controls remain at the edge.
- Hide-dialogue state: the scene must remain usable when the text layer is removed.

## Tokens

- scene ink: `#080c11`
- frost text: `#edf3f3`
- muted ice: `#a9b8bf`
- interface cyan: `#6ec7e6`
- interface violet: `#6f63df`
- action yellow: `#e8dc22`
- display: Noto Serif SC
- body: HarmonyOS Sans SC / Noto Sans SC
- utility: Cascadia Mono

## Layout

```text
┌ current chat ─────────────── actual ST controls ─ hide text ┐
│                                                             │
│  older message                                              │
│  older message (recedes into scene)                         │
│                                                             │
│  [latest speaker + extension rail]                          │
│  [local blue-violet information layer                       │
│   long readable body + quote + real message actions]        │
│                                                             │
│  [attach] [input................................] [send]    │
└─────────────────────────────────────────────────────────────┘
```

## Signature

Only the latest message receives the feature-overlay treatment. Earlier messages remain part of the transcript but lose chroma and contrast. This makes the concept specific to Endfield dialogue evidence instead of a generic dark HUD.

## Rejected defaults

- no floating card stack
- no full-screen black tint
- no invented archive/protocol labels
- no decorative numbering
- no yellow sprinkled across secondary controls
- no settings, roster, rewards, or modal UI in this concept

