# SkillSwap Campus — Two-Student End-to-End Test

This checklist validates the main student journey using two independent accounts. It is a **manual acceptance test** because the repository does not contain a disposable database fixture for automated browser/API integration tests.

## Test setup

- Run Apache and MySQL in XAMPP.
- Open the app in two separate browser sessions (for example, Chrome normal and Chrome Incognito).
- Register or use two different accounts:
  - **Student A** — the student offering to teach.
  - **Student B** — the student requesting to learn.
- Keep both sessions signed in at the same time.
- Use a unique skill title for this test, such as `QA Test — Basic Web Design`.

## A. Account and dashboard

- [ ] Register Student A with a valid email and password.
- [ ] Log in as Student A and confirm the dashboard loads.
- [ ] Log out, then register and log in as Student B in the other browser session.
- [ ] Confirm Student B sees their own dashboard and profile.
- [ ] Refresh both browsers and confirm both sessions remain signed in.
- [ ] Log out of Student A and confirm Student B remains signed in.
- [ ] Log back in as Student A and confirm dashboard skills, friend totals, and exchange totals load after login.

**Expected:** Each browser shows data for its own signed-in student. Logging out of one account must not affect the other browser's session.

## B. Skill post and discovery

- [ ] Student A opens **Explore Skills** and creates an **I can teach this** post.
- [ ] Confirm the post appears in Student A's skill list.
- [ ] Student B opens **Explore Skills**, refreshes if needed, and finds Student A's post.
- [ ] Confirm the skill title, category, description, and student details are correct.
- [ ] Student B creates a **Wants to learn** post of their own.
- [ ] Confirm Student A's and Student B's posts remain separate and are attributed to the correct owner.
- [ ] Student A edits their own post and confirms the changes are saved.
- [ ] Confirm Student B cannot see edit/delete controls for Student A's post.
- [ ] Student A deletes a disposable test post and confirms it disappears.

**Expected:** Students can manage only their own skill posts. Other students can browse but cannot edit or delete them.

## C. Exchange request lifecycle

- [ ] Student B sends an exchange request for Student A's offered skill.
- [ ] Confirm Student B sees a success message and the request appears under **My Exchanges → Sent**.
- [ ] Confirm Student A receives an exchange notification.
- [ ] Student A opens **My Exchanges → Received** and accepts the request.
- [ ] Refresh both accounts and confirm the request is **Accepted** for both students.
- [ ] Student B tries to send the same request again while it is pending or accepted.
- [ ] Confirm the duplicate is rejected with a clear message.
- [ ] Confirm Student B cannot request their own skill post.

**Expected:** The exchange has one record and both students see the same server-side status.

## D. Schedule proposal and confirmation

- [ ] Student A opens **My Schedule** and selects the accepted exchange.
- [ ] Student A proposes a future date/time and a meeting location.
- [ ] Confirm the schedule is shown as **Waiting for confirmation** for Student A.
- [ ] Confirm Student B receives a schedule-proposal notification.
- [ ] Student B opens **My Schedule** and reviews the proposed details.
- [ ] Student B confirms the schedule.
- [ ] Refresh both accounts and confirm the schedule shows **Confirmed** with matching date, time, and location.
- [ ] Repeat with a second proposal and decline it from the other account.
- [ ] Confirm a past date/time is rejected.

**Expected:** The proposer cannot confirm their own proposal. Only the other participant can confirm or decline it. A changed proposal must require a new response.

## E. Friend request and messaging

- [ ] Student A finds Student B under **Discover Students** and sends a friend request.
- [ ] Confirm Student B sees the incoming request under **Friends & Messages** and in notifications.
- [ ] Student B accepts the request.
- [ ] Confirm both students see each other in their friends list.
- [ ] Student A opens the conversation and sends a text message.
- [ ] Confirm Student B receives the message and the unread count updates.
- [ ] Student B replies and confirm Student A receives it.
- [ ] Send a supported image attachment and confirm it displays in the conversation.
- [ ] Send a supported document attachment and confirm it can be opened/downloaded.
- [ ] Try an unsupported file type or a file larger than 10 MB and confirm it is rejected.
- [ ] Confirm a student who is not an accepted friend cannot access the conversation or send a message.

**Expected:** Messages and attachments are visible only to the two conversation participants. The UI should recover cleanly after switching conversations or refreshing.

## F. Complete the exchange

- [ ] Either participant marks the accepted exchange as completed.
- [ ] Confirm the UI asks for confirmation before completing it.
- [ ] Refresh both accounts and confirm the exchange is **Completed** for both.
- [ ] Confirm the exchange no longer appears as pending or accepted.
- [ ] Confirm the skill post remains visible and its request button state matches the intended ability to request again.

## G. Profile, map, and responsive checks

- [ ] Student A updates their profile details and confirms the changes persist after refresh.
- [ ] Student A uploads a valid JPG, PNG, or WebP profile photo.
- [ ] Confirm the profile photo appears in the profile, student discovery, and live map where applicable.
- [ ] Student A explicitly enables live location sharing.
- [ ] Confirm Student B can see Student A's marker while sharing is enabled.
- [ ] Student A stops sharing and confirm their marker disappears after the next map refresh.
- [ ] Confirm location sharing is not enabled without the student's action.
- [ ] Test Dashboard, Discover Students, Friends & Messages, Live Campus Map, Explore Skills, My Exchanges, My Schedule, and My Profile at phone, tablet, and desktop widths.
- [ ] Confirm there is no horizontal page overflow and all primary actions remain reachable.

## Results

Record the result of each section before deployment:

| Section | Result | Notes |
|---|---|---|
| A. Account and dashboard | Not tested | |
| B. Skills | Not tested | |
| C. Exchange lifecycle | Not tested | |
| D. Scheduling | Not tested | |
| E. Friends and messaging | Not tested | |
| F. Completion | Not tested | |
| G. Profile, map, responsive | Not tested | |

A passing lint/build does not replace this live two-account test. Do not mark the application production-ready until the complete flow has been exercised against the actual XAMPP database.
