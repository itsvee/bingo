# Bingo Club / บิงโกคลับ

A Thai, mobile-friendly multiplayer bingo game built with Next.js, React and Socket.IO. This fork redesigns [andres0ares/bingo](https://github.com/andres0ares/bingo); credit for the original multiplayer bingo project belongs to its upstream author.

## Rules

- Each player receives a server-generated 5×5 card, in row-major order.
- Columns B, I, N, G, O contain 1–15, 16–30, 31–45, 46–60 and 61–75 respectively. The center is a free space (`null`).
- A host creates a room, shares its code/link, waits for players and starts the game. The host is the caller, not a player.
- Only the host can start or draw. The server draws each number at most once and marks matching numbers automatically.
- One complete horizontal, vertical or diagonal line wins. The player presses the bingo button; the server checks the assigned card against its own draw history before announcing a winner to everyone.
- A game ends at the first accepted claim. Use the home link to create a new round. Players cannot join after a round starts.

All interface text is Thai, including `/en` (retained as an old-link alias). Player links use `/<room>`; host links use `/host/<room>`. A host URL alone does not confer host permissions.

## Local development

Use Node.js 24 or later.

```sh
npm ci
npm run dev
# Or choose an unused port:
PORT=3187 npm run dev
```

Open http://localhost:3000 (or your chosen port). Use separate tabs or browser contexts for host and player. The custom Node server attaches Socket.IO before Next handles requests. **Always use these scripts rather than `next dev` or `next start` directly.** The `/api/socket` route is a health/bootstrap compatibility endpoint; it does not create a second socket server.

```sh
npm test
npm run build
PORT=3187 npm start
# In another terminal, against the running application:
TEST_URL=http://127.0.0.1:3187 npm run test:integration
npm audit
```

Engine tests use Node's built-in test runner and cover card ranges, uniqueness, free center, all twelve winning lines, authorization, reconnects, draw exhaustion and winner validation. The integration test connects actual Socket.IO clients with polling only, verifies rejected forged actions, restores a disconnected player's card, draws until a valid line and checks the winner broadcast.

## Plesk / Passenger

1. Set the application root to this repository, the document root to **`public`**, and the startup file to **`.plesk.startup.cjs`**. Never expose the repository root as the document root.
2. Select Node 24+, install dependencies with `npm ci`, and run `npm run build`.
3. Set application mode / `NODE_ENV` to `production`, then restart the Node application. Passenger supplies the listening port; do not hardcode an external port.
4. Use **one application process/instance**. Configure the reverse proxy to forward `/socket.io/` GET and POST requests without caching, with at least a 60-second read timeout. HTTPS should terminate at the proxy.
5. Verify `/`, `/en`, `/api/socket`, `/socket.io/?EIO=4&transport=polling`, and a complete host/player round.

The browser deliberately uses HTTP polling without upgrading, because direct WebSockets may fail behind the proxy. No external realtime service is required. The server also accepts WebSockets if an independently configured client needs them.

## State, privacy and limits

Rooms live only in this server process. Deploys, restarts or process recycling erase all games. Idle rooms expire after 12 hours; capacity is 500 rooms and 60 players per room. Multi-process hosting needs a shared authoritative game store and Socket.IO coordination and is not supported here.

Random host/player bearer tokens are stored in `sessionStorage` per tab and never put in URLs, roster broadcasts or other players' state. Refresh/reconnect in the same tab restores the role and original card while the server survives. Closing the tab or losing browser storage loses recovery rights; there is no account recovery. Keep the host tab open. Disconnected players retain their seat and card for the round.

The server validates membership, ownership, game phase, player names and winning claims, limits payload size and throttles actions per socket. Clients cannot choose their card, draw result or winner. Room codes are invitations, not private account authentication. There is no chat or payment functionality.

## Interface

Emerald accents, tactile round number tiles, automatic marks with check indicators, Thai form labels/errors, connection feedback, waiting roster, draw history, winner announcement, keyboard focus indicators, reduced-motion support and system dark mode. Noto Sans Thai is served locally from `public/fonts`; its SIL Open Font License is included beside the font.

## Source map

- `lib/engine.cjs`: authoritative room and game rules, independent of transport.
- `lib/socket.cjs`: validated Socket.IO actions and private per-member broadcasts.
- `server.cjs`, `.plesk.startup.cjs`: local and Passenger server entry points.
- `components/GamePage.js`, `Board.js`, `useGame.js`: UI and lifecycle-managed client connections.
- `styles/globals.css`: responsive design tokens and game styling.
- `tests/`: engine and live polling integration tests.
