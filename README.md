# Monmon's Life

My 30-day meal plan app: daily meals to tick off, calorie ring, water tracker, month view and grocery checklist.

- **Web version:** https://omnyahosny101.github.io/monmon-diary
- **iPhone app:** the `ios` folder. It shows the same app, works offline, sends reminders, and has a home-screen widget with today's meals.

**Inside:** Today (urgent tasks, habits with streaks, sadaqa, reading and podcasts, day log, diary with mood and 3 daily questions, spending, daily insight), Food (meal plan with swaps, my dishes and meal builder, forbidden corner, groceries), Money (overview, budgets, spending, savings jars, sadaqa, receipts, salary, pets), Plans (urgent and normal tasks, mashawer, experiences, self-care month, shopping, vision board), Grow (skills, hobbies), Me (full record of each day, mood calendar, habit customization with rewards, settings and backup).

To change the app, edit the files in `src/` (`app.html`, `app.js`, `life.js`, `boot.js`, `content.js`, `wisdom.js`, `facts.js`, `nutrition.js`, `home.js`, `i18n.js`, `ar_*.js`, `learn*.js`, `wisdom_ar*.js`, `french*.js`) and run `python3 src/build.py`.

## Install the iPhone app (Mac + Xcode)

1. Install **Xcode** from the Mac App Store and open it once.
2. On this page, tap **Code > Download ZIP**, unzip it, open the `ios` folder and double-click **MonmonsLife.xcodeproj**.
3. In Xcode: **Settings > Accounts > +**, sign in with your Apple ID.
4. Click **MonmonsLife** at the top of the left sidebar. For both targets (**MonmonsLife** and **MonmonWidget**), open **Signing & Capabilities** and choose your name under **Team**.
5. Plug your iPhone into the Mac, unlock it, and pick it at the top of the Xcode window. Press the **Play** button.
6. First time only, on the iPhone: **Settings > General > VPN & Device Management**, tap your Apple ID and **Trust**. Also turn on **Settings > Privacy & Security > Developer Mode** if asked.

**Updates arrive by themselves:** the iPhone app opens the live website, so every change pushed here shows up the next time you open it (it falls back to the copy inside the app when there's no internet). You only need Xcode again to renew the free signing.

With a free Apple ID the app works for 7 days, then press Play again in Xcode to renew it. A paid Apple Developer account ($99 a year) makes it last a year.

**Widget:** long-press the home screen, tap **+**, search **Monmon's Life**. Long-press the widget > **Edit Widget** to set your plan start date.
