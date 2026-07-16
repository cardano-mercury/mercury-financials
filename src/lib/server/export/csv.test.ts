import { describe, expect, it } from 'vitest';
import {
	balanceSheetCsv,
	profitAndLossCsv,
	toCsv,
	transactionRegisterCsv,
	trialBalanceCsv
} from './csv';
import type { Account } from '$lib/server/db/schema';
import type { BalanceSheet, ProfitAndLoss, TrialBalance } from '$lib/server/reports';
import type { RegisterRow } from '$lib/server/transactions';

const account = (over: Partial<Account> = {}): Account => ({
	id: 1,
	statement: 'balance_sheet',
	section: 'Assets',
	subgroups: [],
	name: 'Cash and cash equivalents',
	path: 'Balance Sheet > Assets > Cash and cash equivalents',
	normalBalance: 'debit',
	isCash: true,
	isInternalTransfer: false,
	sortOrder: 0,
	...over
});

/** A CSV line, split back into fields, honouring quoting. Deliberately not the code under test. */
function fields(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (quoted) {
			if (c === '"' && line[i + 1] === '"') {
				cur += '"';
				i++;
			} else if (c === '"') quoted = false;
			else cur += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') {
			out.push(cur);
			cur = '';
		} else cur += c;
	}
	out.push(cur);
	return out;
}

describe('toCsv', () => {
	it('leaves ordinary values unquoted', () => {
		expect(
			toCsv([
				['a', 'b'],
				[1, 2]
			])
		).toBe('a,b\n1,2');
	});

	it('quotes a field containing a comma, and a reader gets one field back', () => {
		const line = toCsv([['Property, plant and equipment', '1.0']]);
		expect(line).toBe('"Property, plant and equipment",1.0');
		expect(fields(line)).toEqual(['Property, plant and equipment', '1.0']);
	});

	it('doubles an embedded quote so it survives a round trip', () => {
		const line = toCsv([['She said "hi"', 'x']]);
		expect(line).toBe('"She said ""hi""",x');
		expect(fields(line)).toEqual(['She said "hi"', 'x']);
	});

	it('quotes a field containing a newline, keeping it inside one field', () => {
		const line = toCsv([['two\nlines', 'x']]);
		expect(line).toBe('"two\nlines",x');
	});

	it('renders an empty row as an empty line', () => {
		expect(toCsv([['a'], [], ['b']])).toBe('a\n\nb');
	});

	/**
	 * A cell that opens with =, +, - or @ is treated as a formula by Excel and Google Sheets, not as
	 * text, and it runs when the file is opened. Counterparty names, tags and the entity name are all
	 * free text, and an export can be shared onward (say, with an accountant), so the values in them
	 * can reach other people's spreadsheets. Prefix the cell so it is read as text.
	 */
	it.each(['=1+1', '+1', '-1+1', '@SUM(A1)', "=cmd|'/c calc'!A0"])(
		'neutralises the formula %s',
		(payload) => {
			const line = toCsv([[payload]]);
			expect(line.startsWith('=')).toBe(false);
			expect(line.startsWith('+')).toBe(false);
			expect(line.startsWith('@')).toBe(false);
			// The value is still readable, just no longer executable.
			expect(fields(line)[0]).toContain(payload);
		}
	);

	it('does not mangle a negative number, which is not a formula', () => {
		expect(toCsv([[-42]])).toBe('-42');
		expect(toCsv([['-42.5']])).toBe('-42.5');
	});
});

describe('trialBalanceCsv', () => {
	const tb: TrialBalance = {
		rows: [
			{ account: account(), debit: 1_500_000n, credit: 0n },
			{
				account: account({
					id: 2,
					name: 'Other income',
					statement: 'profit_loss',
					section: 'Income'
				}),
				debit: 0n,
				credit: 1_500_000n
			}
		],
		totalDebit: 1_500_000n,
		totalCredit: 1_500_000n
	};

	it('writes a header, a row per account, and a total that balances', () => {
		const file = trialBalanceCsv(tb);
		expect(file.filename).toBe('trial-balance.csv');
		const lines = file.content.split('\n');
		expect(fields(lines[0])).toEqual([
			'Account',
			'Statement',
			'Section',
			'Debit (ADA)',
			'Credit (ADA)'
		]);
		expect(lines).toHaveLength(4);
		const total = fields(lines[3]);
		expect(total[0]).toBe('Total');
		expect(total[3]).toBe(total[4]);
	});

	it('renders a null statement and section as empty rather than the string "null"', () => {
		const file = trialBalanceCsv({
			rows: [{ account: account({ statement: null, section: null }), debit: 0n, credit: 0n }],
			totalDebit: 0n,
			totalCredit: 0n
		});
		const row = fields(file.content.split('\n')[1]);
		expect(row[1]).toBe('');
		expect(row[2]).toBe('');
	});

	it('exports amounts ungrouped, so a spreadsheet reads them as numbers', () => {
		const file = trialBalanceCsv({
			rows: [{ account: account(), debit: 1_234_567_000_000n, credit: 0n }],
			totalDebit: 1_234_567_000_000n,
			totalCredit: 0n
		});
		const row = fields(file.content.split('\n')[1]);
		expect(row[3]).not.toContain(',');
		expect(row[3]).toBe('1234567.000000');
	});

	it('handles a trial balance with no rows at all', () => {
		const file = trialBalanceCsv({ rows: [], totalDebit: 0n, totalCredit: 0n });
		expect(file.content.split('\n')).toHaveLength(2);
	});
});

describe('profitAndLossCsv', () => {
	const pl: ProfitAndLoss = {
		income: [{ account: account({ name: 'Other income' }), amount: 1_000_000n }],
		expenses: [{ account: account({ name: 'Other expenses' }), amount: 400_000n }],
		tax: [{ account: account({ name: 'Income tax' }), amount: 100_000n }],
		totalIncome: 1_000_000n,
		totalExpenses: 400_000n,
		totalTax: 100_000n,
		profitBeforeTax: 600_000n,
		profitForPeriod: 500_000n
	};

	it('heads the statement with the entity name and carries every total', () => {
		const file = profitAndLossCsv(pl, 'Acme Foundation');
		expect(file.filename).toBe('profit-and-loss.csv');
		const lines = file.content.split('\n');
		expect(fields(lines[0])[0]).toBe('Acme Foundation');
		expect(lines[1]).toBe('Statement of Profit and Loss');
		expect(file.content).toContain('Total income,1.000000');
		expect(file.content).toContain('Total expenses,0.400000');
		expect(file.content).toContain('Profit before tax,0.600000');
		expect(file.content).toContain('Profit for the period,0.500000');
	});

	it('quotes an entity name that contains a comma', () => {
		const file = profitAndLossCsv(pl, 'Cardano Mercury, Inc.');
		expect(fields(file.content.split('\n')[0])[0]).toBe('Cardano Mercury, Inc.');
	});
});

describe('balanceSheetCsv', () => {
	const bs: BalanceSheet = {
		assets: [{ account: account(), amount: 1_000_000n }],
		equity: [{ account: account({ name: 'Share capital' }), amount: 600_000n }],
		liabilities: [{ account: account({ name: 'Trade payables' }), amount: 300_000n }],
		totalAssets: 1_000_000n,
		totalEquity: 700_000n,
		totalLiabilities: 300_000n,
		periodResult: 100_000n
	};

	it('balances: total assets equals total equity and liabilities', () => {
		const file = balanceSheetCsv(bs, 'Acme');
		expect(file.filename).toBe('balance-sheet.csv');
		expect(file.content).toContain('Total assets,1.000000');
		expect(file.content).toContain('Total equity and liabilities,1.000000');
	});
});

describe('transactionRegisterCsv', () => {
	const row = (over: Partial<RegisterRow> = {}): RegisterRow =>
		({
			hash: 'abc123',
			blockTime: 1_700_000_000,
			sent: 0n,
			received: 5_000_000n,
			fees: 170_000n,
			counterparties: [{ label: 'Alice' }],
			accountPath: 'Profit & Loss > Income > Other income',
			tags: ['receive'],
			...over
		}) as RegisterRow;

	it('writes a header and one row per transaction, dated from the block time', () => {
		const file = transactionRegisterCsv([row()]);
		expect(file.filename).toBe('transaction-register.csv');
		const lines = file.content.split('\n');
		expect(fields(lines[0])[0]).toBe('Date');
		expect(fields(lines[1])[0]).toBe('2023-11-14');
	});

	it('leaves the unused side of a transaction blank rather than writing a zero', () => {
		const received = fields(transactionRegisterCsv([row()]).content.split('\n')[1]);
		expect(received[3]).toBe('');
		expect(received[4]).toBe('5.000000');

		const sent = fields(
			transactionRegisterCsv([row({ sent: 2_000_000n, received: 0n })]).content.split('\n')[1]
		);
		expect(sent[3]).toBe('2.000000');
		expect(sent[4]).toBe('');
	});

	it('joins several counterparties into one field, quoted, so the column count holds', () => {
		const file = transactionRegisterCsv([
			row({ counterparties: [{ label: 'Alice' }, { label: 'Bob' }] } as Partial<RegisterRow>)
		]);
		const cells = fields(file.content.split('\n')[1]);
		expect(cells).toHaveLength(8);
		expect(cells[2]).toBe('Alice; Bob');
	});

	it('keeps the column count when a counterparty label contains a comma', () => {
		const file = transactionRegisterCsv([
			row({ counterparties: [{ label: 'Mercury, Inc.' }] } as Partial<RegisterRow>)
		]);
		expect(fields(file.content.split('\n')[1])).toHaveLength(8);
	});

	it('renders an uncategorised transaction with an empty purpose', () => {
		const file = transactionRegisterCsv([row({ accountPath: null })]);
		expect(fields(file.content.split('\n')[1])[6]).toBe('');
	});

	it('handles an empty register', () => {
		expect(transactionRegisterCsv([]).content.split('\n')).toHaveLength(1);
	});
});
