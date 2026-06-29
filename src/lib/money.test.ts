import { describe, it, expect } from 'vitest';
import { formatAda } from './money';

describe('formatAda', () => {
	it('formats whole and fractional ADA with grouping', () => {
		expect(formatAda(1_200_000n)).toBe('1.200000');
		expect(formatAda(1_234_567_000_000n)).toBe('1,234,567.000000');
	});

	it('handles negatives and custom decimals', () => {
		expect(formatAda(-650_000n, { decimals: 2 })).toBe('-0.65');
		expect(formatAda(170_000n, { decimals: 2, group: false })).toBe('0.17');
	});

	it('rounds nothing, truncates to the requested decimals', () => {
		expect(formatAda(1_999_999n, { decimals: 2 })).toBe('1.99');
	});
});
