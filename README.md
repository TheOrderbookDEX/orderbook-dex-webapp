# README

## What is this?

This is the repo for the web app of *The Orderbook DEX*.

## What is currently missing from the app?

* A better UX

  > We are working on a **full redesign** of the app which will improve the UX.

* A way to fetch existing open orders

  > The app stores user data only on the client side, so if you clear the browser data or open the app in a different browser or computer, it'll be like you opened the app for the first time.
  >
  > For these cases, the app needs a way to scan the blockchain for your still open orders so it can start tracking them.

* More precise gas estimates

  > Right now the app is relying on ethers' gas estimation feature, which could cause transaction failure due to missing gas in certain situations.

* A way to handle chain reorgs

  > The app currently doesn't handle chain reorgs, mainly cause it's not easy to test for them so we haven't had the chance yet to properly address them.
