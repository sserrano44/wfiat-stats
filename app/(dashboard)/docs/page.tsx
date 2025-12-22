"use client";

import { Suspense } from "react";
import { DocSection } from "@/components/docs/DocSection";
import { DocTableOfContents } from "@/components/docs/DocTableOfContents";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Callout } from "@/components/docs/Callout";
import { TableSchema } from "@/components/docs/TableSchema";
import { FreshnessPanel } from "@/components/docs/FreshnessPanel";
import { Spinner } from "@/components/ui/Spinner";

import {
  tocItems,
  glossaryItems,
  coreTablesSchemas,
  analyticsTablesSchemas,
  exampleQueries,
} from "./content";

export default function DocsPage() {
  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-12">
        {/* Overview Section */}
        <DocSection id="overview" title="Overview">
          <p>
            wFiat Stats is an analytics dashboard for monitoring wFiat stablecoin
            activity across multiple blockchains. It tracks transfers, mints, burns,
            and DEX trading activity for the wFiat token family.
          </p>

          <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">
            Supported Tokens
          </h3>
          <p className="mb-2">
            Six Latin American stablecoins pegged to local fiat currencies:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>wARS</strong> - Argentine Peso
            </li>
            <li>
              <strong>wBRL</strong> - Brazilian Real
            </li>
            <li>
              <strong>wMXN</strong> - Mexican Peso
            </li>
            <li>
              <strong>wCOP</strong> - Colombian Peso
            </li>
            <li>
              <strong>wPEN</strong> - Peruvian Sol
            </li>
            <li>
              <strong>wCLP</strong> - Chilean Peso
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">
            Supported Chains
          </h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Ethereum</strong> (Chain ID: 1)
            </li>
            <li>
              <strong>Base</strong> (Chain ID: 8453)
            </li>
            <li>
              <strong>Worldchain</strong> (Chain ID: 480)
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">
            Data Pipeline
          </h3>
          <p>
            Data flows through the following stages:
          </p>
          <ol className="list-inside list-decimal space-y-1 mt-2">
            <li>
              <strong>Indexing:</strong> ERC-20 Transfer events are fetched from
              blockchain RPC nodes using eth_getLogs
            </li>
            <li>
              <strong>Classification:</strong> Transfers are categorized as mint,
              burn, or transfer based on zero address involvement
            </li>
            <li>
              <strong>DEX Detection:</strong> Swap events from known DEX pools
              (Uniswap, Aerodrome) are indexed
            </li>
            <li>
              <strong>P2P Analysis:</strong> Transfers are classified into P2P
              tiers based on address types (EOA vs contract)
            </li>
            <li>
              <strong>Aggregation:</strong> Daily and weekly metrics are computed
              and stored in analytics tables
            </li>
            <li>
              <strong>Dashboard:</strong> This dashboard queries the analytics
              tables to display charts and KPIs
            </li>
          </ol>
        </DocSection>

        {/* Terminology Section */}
        <DocSection id="terminology" title="Terminology & Glossary">
          <p className="mb-4">
            Key terms used throughout the dashboard and database:
          </p>
          <DefinitionList items={glossaryItems} />
        </DocSection>

        {/* Data Model Section */}
        <DocSection id="data-model" title="Data Model">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Core Tables
          </h3>
          <p className="mb-4">
            These tables store raw blockchain data indexed from RPC nodes.
          </p>

          <Callout type="info" title="Important: chain_id vs EVM Chain ID">
            The <code>chain_id</code> column in all tables is a foreign key to{" "}
            <code>chains.id</code> (internal database ID: 1, 2, 3), not the actual
            EVM chain ID (1, 8453, 480). Always join with the chains table to get
            the real chain identifier.
          </Callout>

          <div className="mt-6 space-y-6">
            {coreTablesSchemas.map((table) => (
              <TableSchema key={table.tableName} {...table} />
            ))}
          </div>

          <h3 className="mt-8 text-lg font-medium text-zinc-900 dark:text-white">
            Analytics Tables
          </h3>
          <p className="mb-4">
            Pre-computed metrics in the <code>analytics</code> schema. These power
            the dashboard charts and are recomputed periodically.
          </p>
          <div className="space-y-6">
            {analyticsTablesSchemas.map((table) => (
              <TableSchema key={table.tableName} {...table} />
            ))}
          </div>
        </DocSection>

        {/* Interpretation Section */}
        <DocSection id="interpretation" title="Interpretation Guide">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Typical Token Flows
          </h3>
          <p>Understanding common patterns in wFiat usage:</p>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>
              <strong>Mint → P2P → Burn:</strong> Fiat is on-ramped to wFiat,
              transferred peer-to-peer one or more times, then off-ramped back to
              fiat. This is the core use case for remittances and payments.
            </li>
            <li>
              <strong>Mint → DEX → Hold:</strong> Tokens are minted and swapped
              on a DEX for other assets, or held as savings/collateral.
            </li>
            <li>
              <strong>DEX Activity:</strong> High DEX volume relative to P2P may
              indicate speculative trading rather than payment use.
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">
            Understanding Adoption Metrics
          </h3>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Active Users:</strong> Unique addresses transacting in
              period. Growth indicates adoption, but remember addresses ≠ people.
            </li>
            <li>
              <strong>New Nodes:</strong> First-time addresses appearing in the
              network. High new node count = network expansion.
            </li>
            <li>
              <strong>Reciprocity Rate:</strong> Fraction of relationships that
              are bidirectional (A→B and B→A both exist). Higher reciprocity
              suggests genuine relationships rather than one-way payments.
            </li>
            <li>
              <strong>LCC Fraction:</strong> Share of users in the largest
              connected component. Higher LCC = more cohesive network where users
              are interconnected.
            </li>
            <li>
              <strong>Repeat Pair Share:</strong> Fraction of address pairs that
              have transacted in previous periods. Indicates relationship
              persistence and recurring usage patterns.
            </li>
          </ul>

          <Callout type="warning" title="Important Limitations">
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Addresses are not people</strong> — One user may control
                multiple wallets, and one wallet may be shared by multiple users.
              </li>
              <li>
                <strong>Contract detection has delays</strong> — Address type
                (EOA vs contract) is detected via eth_getCode, which may not
                reflect newly deployed contracts immediately.
              </li>
              <li>
                <strong>Cross-token rollups may double-count</strong> — When
                viewing "All Tokens", active user counts may include the same
                address multiple times if they use multiple wFiat tokens.
              </li>
              <li>
                <strong>Exclusion lists are imperfect</strong> — DEX pools,
                routers, and bridges are excluded from P2P metrics, but new
                contracts may not be immediately labeled.
              </li>
              <li>
                <strong>Data freshness varies</strong> — Check the Data Freshness
                section below to see when each chain/token was last synced.
              </li>
            </ul>
          </Callout>
        </DocSection>

        {/* Freshness Section */}
        <DocSection id="freshness" title="Data Freshness">
          <p className="mb-4">
            Current synchronization status for each token/chain combination. Data
            freshness depends on indexer job frequency and blockchain confirmation
            times.
          </p>
          <Callout type="tip" title="Color coding">
            <ul className="list-inside list-disc">
              <li>
                <span className="text-green-600 dark:text-green-400">Green</span>:
                Updated within 10 minutes
              </li>
              <li>
                <span className="text-amber-600 dark:text-amber-400">Amber</span>:
                Updated within 1 hour
              </li>
              <li>
                <span className="text-red-600 dark:text-red-400">Red</span>: More
                than 1 hour old
              </li>
            </ul>
          </Callout>
          <div className="mt-4">
            <Suspense
              fallback={
                <div className="flex h-32 items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <FreshnessPanel />
            </Suspense>
          </div>
        </DocSection>

        {/* Example Queries Section */}
        <DocSection id="examples" title="Example Queries">
          <p className="mb-4">
            SQL examples for power users with direct database access. All amounts
            are stored in wei — divide by 10^18 to get human-readable token units.
          </p>
          <Callout type="info">
            These queries assume you have read-only access to the PostgreSQL
            database. The dashboard itself uses parameterized queries through the
            API layer.
          </Callout>
          <div className="mt-6 space-y-6">
            {exampleQueries.map((example, idx) => (
              <div key={idx}>
                <h4 className="mb-2 font-medium text-zinc-900 dark:text-white">
                  {example.title}
                </h4>
                <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {example.description}
                </p>
                <CodeBlock code={example.sql} title="SQL" />
              </div>
            ))}
          </div>
        </DocSection>
      </div>

      {/* Table of Contents - Desktop only */}
      <div className="hidden w-64 shrink-0 lg:block">
        <DocTableOfContents items={tocItems} />
      </div>
    </div>
  );
}
