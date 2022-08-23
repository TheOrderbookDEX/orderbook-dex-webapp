# README

## What is this?

This is the repo for the web app of *The Orderbook DEX*.

## Wait. Where is the source code?

Well... we made a mistake, we used a commercially licensed piece of code while developing the app, therefore we cannot release its source code **as it is right now**.

We are working on a **full redesign** of the app which will not have this issue, but since that will take quite a while to be ready, we decided to go ahead and use this version of the app **to test the smart contracts** of the DEX.

## What is currently missing from the app?

* A better UX

  > We are working on it.

* A way to create orderbooks

  > Orderbooks can still be created through smart contract interaction, but right now they will not show up in the app, because the list of orderbooks is currently hardcoded.
  >
  > This is actually the main reason why this feature is not in yet. The app can't just list all orderbooks without some safeguards, because that could expose users to malicious users trying to deceive people into operating with orderbooks created using fake tokens.

* A way to fetch existing open orders

  > The app stores user data only on the client side, so if you clear the browser data or open the app in a different browser or computer, it'll be like you opened the app for the first time.
  >
  > For these cases, the app needs a way to scan the blockchain for your still open orders so it can start tracking them.

* More precise gas estimates

  > Right now the app is relying on ethers' gas estimation feature, which could cause transaction failure due to missing gas in certain situations.

* A way to handle chain reorgs

  > The app currently doesn't handle chain reorgs, mainly cause it's not easy to test for them so we haven't had the chance yet to properly address them.
