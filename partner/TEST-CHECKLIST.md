# Test checklist

## Immediate demo test

- [ ] Open `/partner/`.
- [ ] Test workspace defaults to “Test everything”.
- [ ] Search Almora as Customer; Binsar Ridge Homestay is shown as a RoamWise Pick.
- [ ] Request a stay.
- [ ] Switch to Partner; request appears.
- [ ] Confirm it.
- [ ] Switch back to Customer; My trips shows confirmed.
- [ ] Switch to Admin / staff; mark it completed.
- [ ] Switch to Partner; earned amount and RoamWise commission now update.
- [ ] Switch to Property owner; submit a new property.
- [ ] Admin / staff approves it.
- [ ] Partner can select it and add/edit a room.
- [ ] Customer can search its city and see it before outside choices.
- [ ] Flights, Cars and Things to do open additional live search choices.

## Live-account smoke test

- [ ] Switch workspace to “Use live accounts”.
- [ ] Property owner can create/sign in to an account.
- [ ] Pending application is saved and reloads correctly.
- [ ] Founder admin can see pending partner records.
- [ ] Founder approves one.
- [ ] Approved owner can open Partner view.
- [ ] Partner can add/edit room.
- [ ] Customer search can see the room.
- [ ] Signed-in customer can send booking request.
- [ ] Partner can confirm/decline it.
- [ ] Founder can mark confirmed booking completed.
- [ ] Partner earnings count only completed stays.

## Provider setup test

- [ ] Admin / staff → Travel choices.
- [ ] Paste a public partner/deep link containing `{destination}`.
- [ ] Save.
- [ ] Customer search substitutes the destination and opens the configured choice.
- [ ] Never paste secret API tokens into this static page.
