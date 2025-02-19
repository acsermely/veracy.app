# Veracy App

> Veracy is a privacy focused social platform built with decentralized technologies.

## Features

### Permanent Storage

Veracy uses Arweave under the hood to store your posts and prevent censorship. For media content the platform has its own decentralized content distribution network.

### 100% Profit

Pay a one-time registration fee and take 100% of the profits. Veracy uses peer-to-peer transactions on Arweave for content monetization.

### Privacy

You only need a crypto wallet to use all the features on Veracy. No personal data is collected and user related data is stored primarily on-device. (Exceptions are Images, Feedback and Public Keys for authentication)

### Decentralized

Everyone can run a [Veracy Content Node](https://github.com/acsermely/veracy.server) and connect to the existing network. You can store your media content on your own server, or use a node you trust.

## Development

```sh
npm i
npm run dev
```

### Run everyting locally:

1. Clone [Veracy Content Node](https://github.com/acsermely/veracy.server) and [test-arlocal-node](https://github.com/acsermely/test-arlocal-node)

```sh
# Content Node:
go run .

# Arlocal Node:
npm i
npm run dev
```

2. Change constants in the `constants.ts` file:

```typescript
// GATEWAYS
// export const ARWEAVE_URL = "arweave.net";
// export const ARWEAVE_PORT = 443;
// export const ARWEAVE_PROTOCOL = "https";
// export const BUNDLER_URL = "https://node2.irys.xyz";
// export const ACTIVATION_ADDRESS = "8vAopD3Fv7QnEqG00-E6aSyLaL9WKZpHmeTPWyNxs9c";

// TEST GATEWAYS
export const ARWEAVE_URL = "localhost";
export const ARWEAVE_PORT = 1984;
export const ARWEAVE_PROTOCOL = "http";
export const BUNDLER_URL = "https://devnet.irys.xyz";
export const ACTIVATION_ADDRESS = "0S00yFATR2ozqXiq0XT6EjnB0EBc5xHW35HPZpSK1J8"; // Only for Testing
```

Test Activation Wallet seed (for whatever reason):

```text
funny mountain argue unaware person forum intact slam capital mystery bulb soap
```

## Tools

### Local Arweave Node

The [test-arlocal-node](https://github.com/acsermely/test-arlocal-node) project is an all-in-one solution for local arweave development. It runs a local Arweave node and provides a basic dashboard where you can mint new blocks and fund wallets on your local network.

```sh
npm i
npm run dev
```

### Content Node Dashboard

**In-progress**

The Dashboard helps you manage your server. You can monitor all the media you store and deal with malicious actors.
