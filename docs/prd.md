# Mercury: Financials Product Requirements Document (PRD)
## Objective
Develop a tool to process blockchain ledger data for financial reporting.

## Key Details

* **Requested Funds:** 78,140 ADA
* **Project Duration:** 4 months
* **Solution Summary:** Create a tool for generating financial reports from wallet data, and
giving ERP-compatible Trial Balance.
* **Solution Components:** "Mercury: Financials & TB Export"
  
## Background and Context
The project won an opportunity to demonstrate the proof of concept in the Catalyst fund 12 with
the help of voters collecting ₳74.2Million Votes, In the POC Stage we will be providing a system
for the user where they can Structure the information of their wallet in a way that can be Used to
translate the data of the wallet in the form of financial statements and get a better understanding
of their financial activities throughout the Year.

Design a tool that helps collect and process data available on the blockchain ledger into an
organized structure that is compatible with ERP software and make necessary financial reports
(BS and P&L).

We lack enterprise-grade financial solutions in the ecosystem to allow projects and their
accountants to develop and publish accurate and reliable financial statements and tokenomics
reports.

### Growth and Need

With the rapid growth of blockchain-operating organizations, there's a rising demand for robust
financial accounting systems to manage cryptocurrency transactions. Traditional financial
institutions often restrict opening and operating bank accounts for such businesses,
necessitating enterprise-grade financial solutions within the blockchain ecosystem.

## Background and History

Here it will be explaining the various forms of accounting and bookkeeping methods and how
they have evolved over the years.

### Single-Entry Accounting

The single-entry accounting system is a simplified bookkeeping method where each financial
transaction is recorded with a single entry. It is akin to maintaining a checkbook. This system
captures only one side of a transaction, typically tracking cash inflows and outflows, which
makes it straightforward but less comprehensive than double-entry accounting.

#### Key Features

* Simple and Easy to Maintain: Suitable for small businesses or individuals with
straightforward financial activities.
* Limited Information: Only records cash receipts and disbursements.
* Less Accurate: Prone to errors and lacks the ability to fully track all financial
transactions, assets, and liabilities.

#### Advantages

* Cost-Effective: Requires less effort and expertise to maintain.
* Sufficient for Small Businesses: Adequate for entities with limited transactions.
  
#### Disadvantages

* Lack of Detail: Doesn't provide a complete financial picture.
* Error Detection: More difficult to detect and correct errors.
* No Comprehensive Financial Statements: Cannot easily generate detailed financial
statements like a balance sheet or income statement.

### Double-Entry Accounting

The double-entry accounting system is a comprehensive method where every financial
transaction is recorded in at least two accounts: one debit and one credit. This system ensures
the accounting equation (Assets = Liabilities + Equity) stays balanced.

#### Key Features

* Two Entries per Transaction: Every transaction affects two or more accounts.
* Balances Accounting Equation: Ensures assets always equal liabilities plus equity.
* Tracks Financial Position: Provides a complete picture of the business’s financial health.

#### Advantages

* Accuracy and Error Detection: Reduces errors and makes it easier to find and correct
them.
* Detailed Financial Statements: Generates comprehensive reports like the balance sheet
and income statement.
* Enhanced Financial Control: Offers better control and understanding of financial
activities.

### Triple-Entry Accounting

The triple-entry accounting system is an advanced method that enhances the traditional
double-entry system by adding a third component: cryptographic verification. Each transaction
involves three entries:

* Debit Entry: In the payer’s account.
* Credit Entry: In the payee’s account.
* Cryptographic Entry: A verified entry on a blockchain or distributed ledger.

#### Key Features

* Enhanced Transparency: Transactions are publicly verifiable.
* Improved Security: Cryptographic verification reduces fraud.
* Increased Trust: Provides an immutable and shared record of transactions.

#### Advantages
* Reduced Errors: Automatic verification and recording.
* Decentralization: Eliminates the need for intermediaries.
* Enhanced Auditability: Easy tracking and verification of financial transactions.

**Example:**

A company pays $500 to a supplier:

_Debit:_ Company’s Cash Account $500

_Credit:_ Supplier’s Sales Account $500

_Cryptographic Entry:_ Blockchain record of the transaction

This third entry on a blockchain ensures that all parties agree on the transaction's validity,
providing a robust and transparent accounting framework.

Right now the parties doing the business on or around blockchain are keeping the triple entry
aspect of accounting isolated, and could use blockchain in addition to the double entry system
to maintain the records in a triple entry system

## Current State Processes and Technology

These type of projects are also dealing with an added complexity of their on-project token, eg.
$ADA will be the main currency for any project running on Cardano, but they might have their
own tokens like $MIN, $DRIP, $NEWM, etc.

There is a general lack of infrastructure to help a non-crypto native Accountant to help and
develop Financial statements and Tokenomics statements for an organization operating on
Cardano Blockchain, as people familiar with blockchain infrastructure are not familiar with the
general accounting needs, and the people familiar with the Accounting needs are not good with
extracting data from the Blockchain.

Even though blockchains are transparent ledgers, interpreting and extracting data remains
complex, particularly with Cardano's eUTxO (Extended Unspent Transaction Output) model,
which presents significant challenges. If someone is able to Extract the data from Blockchain,
they are rarely in a position to understand it due to a lack of context to the transaction, and with
a general lack of infrastructure, there is no way to draw parallels between the Blockchain
environment, and the traditional financial reporting.

We have not seen any platform where one can export these transactions in one go, in a CSV
format where they get the full details of a transaction including the ADA amount sent to various
addresses in a single transaction, Token transaction details with the name of the token available
in human-readable form separation of blockchain identifiable transactions like reward, fee and
stake pool income, structured in a way that can be used for preparation of financial statements.

## Product Clarification and Obstacles

### What the Product Is

The project aims to develop a tool that helps projects categorize and structure transactions to
produce:

* Main Report/Trial Balance
* Balance Sheet
* Profit and Loss Statement

### What the Product Is Not

The product is a proof of concept, demonstrating the capabilities of such a tool on the
blockchain. It does not solve every accounting problem and primarily addresses on-chain data.
Conversion of ADA or tokens into USD or ADA equivalents, as well as handling complex UTXO
models, are not covered in this POC.

#### Establishing Clear Boundaries and Expectations

* **Limitations:** The tool can only convert the information available with your wallet into a
limited form of financials and Trial Balance.
* **Manual Adjustments:** Users need to manually adjust and integrate non-blockchain data
to create comprehensive financial statements.
* **No Integration with Oracles:** Special treatment for conversion of ADA or tokens into
USD or ADA equivalent is not included and may come in later stages.
* **Complexity of UTXO Models:** Handling multiple addresses and accounts related to a
wallet seed phrase for comprehensive financial data is complex and not fully addressed.
  * The rewards accrued by an wallet are not residing on a Utxo and the people have
to manually collect them in a Utxo through a transaction, we need to know the
time period in which the the rewards accrued in the wallet, rather then when the
rewards were collected in a Utxo.

## Dependencies

The project's success depends on the blockchain's functionality and proper record maintenance
by the project. Financial statements generated using this POC need to be reviewed and
potentially adjusted by a financial accountant or auditor to comply with local accounting
standards.

As the project incubator Mercury Team will be helping us with the technical and Smart Contract
Aspects of the Project

A project which do not maintain records for the transactions they have conducted will find it
difficult to translate the wallet directly into the financial statements.

At the current stage, only a small batch of transactions can be identified automatically on the
blockchain, with a more robust triple entry system, it will become easier and the data will
become automatically populated.

* Functionality of the blockchain
* Proper record maintenance by the project
* Technical and smart contract support from the Mercury team

## Implementation Timeline

* **Milestone 1: Product Requirement Document (September)**
  * https://milestones.projectcatalyst.io/projects/1200146/milestones/1
* **Milestone 2: UX/UI Design Draft and Report (October)**
  * https://milestones.projectcatalyst.io/projects/1200146/milestones/2
* **Milestone 3: Proof of Concept Development (November)**
  * https://milestones.projectcatalyst.io/projects/1200146/milestones/3
* **Milestone 4: Project Closeout (December)**
  * https://milestones.projectcatalyst.io/projects/1200146/milestones/4

## Future Directions and Upgrades

We will continue our attempt to provide a tool that can help a project make financial statements.
In the next phase, we will attempt to provide the project with cash flow statements, tokenomics
statements, and more customization options in the balance sheet.

## Target User

Projects and individual wallets that need to convert single-entry data into a balance sheet, P&L,
and Trial Balance.

## UserFlow/Workflow for Tool Development

### Requirements from End User

1. **Entity or Person Name**
2. **Duration for Financials:** Typically quarter ends, semi-annually, calendar year-end, or
financial year-end. Since It is POC we might not give an option for the period and that can come in MVP,
and people can test the product for the period or duration selected by the team
3. **Stake key/ADA Hande or a receiving address**
4. **Wallet Details:** Stake key/ADA handle or receiving address, team members' addresses,
related parties, stake pool details. For easier identifications
5. **Transaction Identification:** Automated terms for on-chain transactions, with dropdown
lists for unidentified transactions.

### Process/Flow

_Note:_ the process Flow will only explain the process in the written form as the main Figma or
graphical representation of the flow will be delivered in the Milestone 2

* Step 1: the user enters the preferred Name,
* Step 2: user Fills in the name of all the parties they have regular dealings so as to identify them
with ease in later stages
* Step 3: Identification of the transactions that the user have records of
* Step 4: Check of the TB Export Provided
* Step 5: Check of the Balance Sheet
* Step 6: Check of the Profit and Loss statement
* Step 7: Export the financials and TB

### Output/Features

A trial balance that users can utilize to generate:

* Balance Sheet
* Profit and Loss Statement
* **TB Export:** Full transaction details in CSV or Excel format.

Please check the basic process flow in the diagrammatic presentation:
[Basic Process Flow](https://www.figma.com/board/URiaNXgbXKQiDCRNjRC7XU/Mercury-Financials-%26-TB-Export?node-id=0-1)

A proper Figma File will be presented in the Milestone 2

## Legal Requirements

Compliance with various accounting standards is necessary. The financial statements generated
using this POC need to be reviewed by a financial accountant or auditor to ensure they meet
local legal requirements.

There are many forms of accounting standards applicable in various jurisdictions, although
similar there will always be a difference in the treatment of a transaction in multiple legal
jurisdictions and a Trial balance will give somewhat different financial statements depending on
the jurisdiction of the project and estimates taken by the project,

This POC in no way assures that the financial statements prepared using this POC will be
accepted in your Accounting jurisdiction, it is the work of your financial accountant and Auditor
to make the received Financials or Trial Balance in a form acceptable by the law.
