# Chrome control contracts

## Icon names

`ocelle-icon name` continues to accept its existing names. It additionally accepts these exact values.

| Name | Meaning |
| --- | --- |
| `inbox` | Inbox |
| `history` | History |
| `settings` | Settings |
| `notifications` | Notifications |
| `appearance` | Appearance |

The names enter the existing exported `IconName` union. Drawings inherit the existing size and currentColor stroke. In a named control's decorative icon slot the icon stays out of the control's accessible name.

## Initials button

Use the existing `ocelle-button` with an optional reflected string property and attribute named `initials`. With a native button and no non-whitespace default slot label or assigned icon elements, one or two non-whitespace Unicode grapheme clusters are displayed after stripping surrounding whitespace. A missing, blank, longer or internally separated value uses the existing rendering. For example, `initials="WW"` displays `WW`. The host supplies the action name through an existing naming input and the button keeps its ordinary name precedence.

A visible default-slot label or assigned icon takes precedence. Link rendering is unchanged. Busy uses the existing spinner and activation suppression, and disabled uses the existing disabled semantics. The mark stays decorative and the control preserves the existing native keyboard, focus and `ocelle-button-activate` contract. The normal-size chrome treatment centers the mark inside its existing 44 px target. It fits in the rail bottom slot after Settings without rail-specific styling and works as an independently named standalone button.

In light and dark, the circular mark uses ochre fill and dark text. In forced colours, its fill, text and stroke use system colours to distinguish the initials and circle. The focus outline remains on the control. Hosts can use it as a trigger via the existing button API and supply their own account content.
