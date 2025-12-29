# NullRPC

High-performance, privacy-focused Ethereum JSON-RPC proxy built on Cloudflare Workers. Designed for speed, reliability, and zero-logging privacy.

## Features

- **⚡ Global Edge Network** — Deployed on Cloudflare Workers for sub-millisecond routing decisions and global availability.
- **🔄 Intelligent Caching** — Protocol-aware caching for JSON-RPC methods reducing upstream load by up to ~80%.
- **📊 Real-time Analytics** — Integrated with Cloudflare Analytics Engine for granular insights on requests, latency, and errors per chain.
- **🛡️ Chain Agnostic** — Dynamic routing and state management via Durable Objects for any EVM-compatible chain.
- **🔒 Privacy First** — No IP logging, no user tracking, and no personally identifiable information (PII) retention.

## Supported Chains

NullRPC provides dedicated endpoints and analytics pages for major EVM networks:

| Chain | Endpoint | Description |
|-------|----------|-------------|
| **Ethereum** | `/eth` | Mainnet RPC with historical data access |
| **Optimism** | `/optimism` | Low-latency L2 endpoint |
| **Arbitrum** | `/arbitrum` | High-throughput Arbitrum One access |
| **Base** | `/base` | Base L2 support |
| **BSC** | `/bsc` | BNB Smart Chain endpoint |
| **Polygon** | `/polygon` | Polygon PoS Mainnet |

## Usage

NullRPC allows direct public access via simple HTTP POST requests.

### Standard RPC Request

```bash
curl -X POST https://nullrpc.dev/eth \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Chain-Specific Dashboards

Visit `https://nullrpc.dev/[chain]` (e.g., `https://nullrpc.dev/eth`) to view real-time performance metrics, health status, and connection details for that specific network.

## Architecture

The system leverages Cloudflare's serverless primitives for maximum scalability:

```
src/
├── index.ts          # Zero-allocation routing & entry point
├── handlers/
│   ├── rpc.ts        # RPC method handling & proxy logic
│   ├── chains.ts     # Chain configuration & status
│   └── analytics.ts  # Analytics Engine integration
├── objects/
│   └── chain-do.ts   # Durable Object for chain state & aggregation
└── services/
    └── cache.ts      # Cache control & normalization logic
```

### Key Components

- **ChainDO**: A Durable Object that maintains the state of each chain, including node health and configuration.
- **Analytics Engine**: High-cardinality time-series database for tracking request volume, latency, and cache hit rates without performance pattern penalties.
- **Zero-Allocation Routing**: optimized routing logic to minimize GC overhead on high-throughput paths.

## Caching Strategy

Caching is strictly defined by method type to ensure data consistency while maximizing performance:

| Type | TTL | Examples |
|------|-----|----------|
| **Immutable** | 15 mins | `eth_chainId`, `eth_getBlockByHash`, `eth_getTransactionReceipt` |
| **Volatile** | 3 sec | `eth_blockNumber`, `eth_gasPrice` |
| **Block-Dependent** | Adaptive | `eth_call`, `eth_getBalance` (Latest vs Historical) |
| **Passthrough** | None | `eth_sendRawTransaction`, `eth_newFilter` |

## Development

### Prerequisites

- [Bun](https://bun.sh/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Setup

```bash
# Install dependencies
bun install

# Generate types
bun run typegen

# Run local development server
bun dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Required for Analytics Engine queries |
| `CLOUDFLARE_API_TOKEN` | Token with Analytics Engine read permissions |
| `DB` | D1 Database binding for chain configuration |

## License

MIT
