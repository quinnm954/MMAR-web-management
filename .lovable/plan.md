# Make the Phone page look and feel like an iPhone

Right now the Phone page is a wide rounded box with a list on the left and the open conversation on the right. It becomes a real iPhone instead.

## On your PC
- One iPhone-shaped device centered on the page, the size and shape of an iPhone 15/16 Pro: thin dark bezel, rounded corners, a Dynamic Island at the top, side buttons, and a soft shadow.
- A status bar with the real time, signal, Wi-Fi and battery icons, plus the home bar at the bottom.
- Everything happens inside the phone, like on a real iPhone. Tapping a conversation slides it in from the right, and "< Back" (or swiping) slides back to the list.

## On an actual phone
- No fake frame. The page fills the screen edge to edge and keeps the same iPhone look, so it feels like the built-in apps.

## Screens styled like Apple's apps
- **List screens:** a large bold title ("Calls", "Messages", "Chat", "Mail") that shrinks into the top bar as you scroll, a rounded gray search field, and edit/compose icons in the top right.
- **Rows:** round contact circles with initials, the name in bold, the time on the right with a ">" chevron, thin lines between rows, and blue dots for unread items. Missed calls show in red, like the Phone app.
- **Tab bar:** a frosted bottom bar with Calls, Texts, Chat and Email, and blue for the open tab. Unread counts show as red badges.
- **Text and chat threads:** iMessage-style bubbles. Yours are blue on the right, theirs gray on the left, with bubble tails, timestamps between groups of messages, the contact's circle and name at the top, and a rounded "Text Message" box with a round blue send arrow. Photos and videos show inside the bubbles.
- **Call details:** like the iPhone contact card, with a big initials circle, the name, and round message/call buttons. The call summary and transcript sit in grouped rounded cards underneath.
- **Email:** like Apple Mail, with the sender, subject and date header and the full email below. Reply and compose open as a sheet that slides up from the bottom.
- **New call/text:** an iPhone-style keypad with round number keys and a green call button, plus a "Text" option.

Calls, texts, chat, email, replies, notifications and live updates all keep working the same way. Only the look and the navigation change.

## Technical details
- Rework the layout and styling in `AdminPhoneHub.tsx`. Data loading and send logic are untouched.
- Add an `IPhoneFrame` wrapper (frame shown at `lg` and up, full-bleed below) and a two-screen stack (list, then detail) with a CSS slide transition. This replaces the desktop split view.
- Add iOS-style tokens to the global CSS (iOS blue, message gray, grouped background, hairline separators, frosted bar) as HSL values in both themes. Use the system font stack (`-apple-system`, SF Pro) only inside the phone.
- Restyle the `TextDetail`, `ChatDetail`, `CallDetail` and `EmailDetail` subcomponents. The dial dialog becomes an in-phone keypad sheet, and compose becomes a bottom sheet.
