<script setup>
import AppLayout from "@/Layouts/AppLayout.vue";
import moment from "moment";
import {computed, onMounted, reactive} from "vue";
import {Buffer} from "buffer";

const props = defineProps({
    wallet: Object
});

const transaction_headers = [
    {
        title: 'Hash', key: 'txhash', value: item => {
            return item.hash.substring(0, 8) + '...' + item.hash.slice(-8);
        }
    },
    {
        title: 'Time', key: 'blocktime', value: item => {
            return moment.unix(item.block_time).format('YYYY-MM-DD HH:mm')
        }
    },
    {
        title: 'Change', key: 'diff', value: item => item.diff ?? []
    },
    {
        title: 'Fees', key: 'txfee', value: item => (item.fees / 1000000) + ' ₳'
    },
    {
        title: 'Tags', key: 'tags'
    }
]

const getDiff = async (tx) => {
    if (tx.diff) {
        return tx.diff
    }
    const balance = getBalance(tx);
    const diff = [];
    for (const [unit, quantity] of Object.entries(balance.diff)) {
        const ticker_data = await getTheTicker(unit);
        diff.push({
            ticker: ticker_data.ticker,
            decimals: ticker_data.decimals,
            unit,
            quantity
        });
    }
    tx.diff = diff;
}

const getBalance = (tx) => {
    const utxo = JSON.parse(tx.utxo_detail);
    const withdrawals = JSON.parse(tx.withdrawals);

    const wallet_address = props.wallet.address.bech32.trim();
    const stake_address = props.wallet.address.stake_key.trim();

    const balance = {
        hash: tx.hash,
        input: {
            lovelace: 0,
        },
        output: {
            lovelace: 0,
        },
        diff: {
            lovelace: 0,
        },
        spends: [],
        receives: [],
        withdrawals: [],
        mode: null
    };

    utxo.inputs.forEach((input) => {
        if (input.address == wallet_address) {
            input.amount.forEach((amount) => {
                if (amount.unit === 'lovelace') {
                    balance.input.lovelace += parseInt(amount.quantity);
                } else {
                    if (balance.input[amount.unit] === undefined) {
                        balance.input[amount.unit] = 0;
                    }
                    balance.input[amount.unit] += parseInt(amount.quantity);
                }
            })
        }
    });

    utxo.outputs.forEach((output) => {
        if (output.address == wallet_address) {
            output.amount.forEach((amount) => {
                if (amount.unit === 'lovelace') {
                    balance.output.lovelace += parseInt(amount.quantity);
                } else {
                    if (balance.output[amount.unit] === undefined) {
                        balance.output[amount.unit] = 0;
                    }
                    balance.output[amount.unit] += parseInt(amount.quantity);
                }
            })
        }
    });

    if (withdrawals.length) {
        console.log(`Has withdrawal?`, withdrawals);
        withdrawals.forEach((withdrawal) => {
            if (withdrawal.address === stake_address) {
                console.log("Withdrawal is for this address?", withdrawal);
                balance.withdrawals.push(withdrawal);
                balance.input.lovelace += parseInt(withdrawal.amount);
            }
        })
    }

    balance.diff.lovelace = balance.output.lovelace - balance.input.lovelace;

    for (const [unit, amount] of Object.entries(balance.input)) {
        // console.log("Parsing inputs", unit, amount);
        if (balance.output[unit] === undefined) {
            balance.output[unit] = 0;

        }
        if (balance.diff[unit] === undefined) {
            balance.diff[unit] = 0;
        }
    }

    for (const [unit, amount] of Object.entries(balance.output)) {
        // console.log("Parsing outputs", unit, amount);
        if (balance.input[unit] === undefined) {
            balance.input[unit] = 0;
        }
        if (balance.diff[unit] === undefined) {
            balance.diff[unit] = 0;
        }
    }

    for (const [unit, amount] of Object.entries(balance.diff)) {
        balance.diff[unit] = balance.output[unit] - balance.input[unit];
        if (balance.diff[unit] === 0) {
            delete balance.diff[unit];
            continue;
        }

        let diff = balance.diff[unit];


        if (amount < 0) {
            // console.log("This is a spend!", unit, amount);
        } else {
            let receives = [];
            // console.log("This is a receive!", unit, diff);
            utxo.inputs.forEach((input) => {
                input.amount.forEach((amount) => {
                    if (amount.unit !== unit) {
                        return;
                    }

                    // console.log(amount);


                    if (amount.quantity <= diff) {
                        // console.log("Eligible input for receive?", input);
                        receives.push({
                            hash: input.tx_hash,
                            index: input.output_index,
                            unit: unit,
                            quantity: Math.min(amount.quantity, diff),
                            from: input.address,
                            to: wallet_address
                        });

                        diff -= amount.quantity;
                    }
                })
            });
            if (receives.length) {
                receives.forEach((receipt) => {
                    balance.receives.push(receipt);
                })
            }
        }
    }

    if (balance.diff.lovelace > 0) {
        // We are receiving lovelace here...

    } else if (balance.diff.lovelace < 0) {
        // We are spending lovelace here...
        // console.log("We spent lovelace!");
        let diff = balance.diff.lovelace * -1;
        diff -= tx.fees;
        // console.log("Diff before fees!", diff);
        const sends = [];
        utxo.outputs.forEach((output) => {
            if (output.address === wallet_address) {
                return;
            }

            if (diff <= 0) {
                return;
            }

            // console.log("We sent something to somebody?", output);
            let sent = 0;
            output.amount.forEach((amount) => {
                if (amount.unit !== 'lovelace') {
                    return;
                }

                sent = Math.min(diff, amount.quantity);
            });

            if (sent) {
                sends.push({
                    hash: tx.hash,
                    index: output.output_index,
                    unit: 'lovelace',
                    quantity: sent,
                    to: output.address,
                    from: wallet_address
                });
                diff -= sent;
            }
        });

        if (sends.length) {
            sends.forEach((receipt) => {
                balance.spends.push(receipt);
            })
        }
    }

    if (balance.spends.length && balance.receives.length) {
        balance.mode = 'mixed';
    } else if (balance.spends.length && !balance.receives.length) {
        balance.mode = 'output';
    } else if (!balance.spends.length && balance.receives.length) {
        balance.mode = 'input';
    }

    return balance;
}

const colorValue = (quantity) => {
    return (quantity > 0) ? 'success' : 'error';
}

onMounted(() => {
    props.wallet.transactions.forEach(async (tx) => {
        await getDiff(tx);
    });
});

const queryingTicker = reactive({});

const getTheTicker = (unit) => {
    if (unit === 'lovelace') {
        return {
            ticker: '₳',
            decimals: 6
        }
    }

    if (queryingTicker[unit]) {
        return queryingTicker[unit];
    }

    const tickerPromise = new Promise(async (resolve) => {
        const metadata_endpoint = 'https://tokens.cardano.org/metadata';
        let token_data;
        console.log("Getting the ticker for...", unit);
        if (queryingTicker[unit]) {
            console.log("We're already querying for this one... Return the promise!");
            return queryingTicker[unit];
        }

        try {
            token_data = JSON.parse(localStorage.getItem(unit));
        } catch (e) {
            token_data = null;
        }

        if (token_data === null) {
            try {
                console.log("Fetching token data...");
                const token_response = await fetch(`${metadata_endpoint}/${unit}`);
                console.log(token_response);
                if (!token_response.ok || token_response.status !== 200) {
                    console.log("The response was not good?", token_response);
                    throw new Error(`Response status: ${response.status}`, {
                        cause: token_response
                    });
                }

                const token_data = await token_response.json();
                const asset_data = {
                    ticker: token_data.ticker.value,
                    decimals: token_data.decimals.value
                };
                localStorage.setItem(unit, JSON.stringify(asset_data));
                // queryingTicker[unit].resolve(asset_data);
                resolve(asset_data);
            } catch (error) {
                console.error(error.message);
                console.info(error.cause);
                const policy_id = unit.substring(0, 55);
                let asset_id = unit.substring(56);
                if (asset_id.startsWith('000de140') || asset_id.startsWith('0014df10')) {
                    asset_id = asset_id.substring(8);
                }

                const asset_decoded = Buffer.from(asset_id, 'hex').toString('UTF-8');
                const simple_asset_name = /[A-z0-9 -]/gi;
                if (simple_asset_name.test(asset_decoded)) {
                    asset_id = asset_decoded
                }
                // console.log("Decoded asset...", asset_decoded, /[A-z0-9 -]/gi.test(asset_decoded));

                const asset_data = {
                    policy_id,
                    ticker: asset_id,
                    decimals: 0,
                    registry_status: false
                };

                localStorage.setItem(unit, JSON.stringify(asset_data));
                resolve(asset_data);
            }
        } else {
            // console.log("We already got the token data here somehow?");
            resolve(token_data);
        }
    });
    queryingTicker[unit] = tickerPromise;
    return tickerPromise;


}

const formatQuantity = (entry) => {
    if (entry.quantity && entry.decimals >= 0) {
        return Number(
            entry.quantity / Math.pow(10, entry.decimals)
        ).toLocaleString({}, {
            signDisplay: "exceptZero",
            notation: "standard",
            maximumFractionDigits: entry.decimals ?? 0
        });
    }

    console.log("Bad entry?", entry);

    return 0;

}
</script>

<template>
    <app-layout title="View Wallet">
        <template #header>
            <h2>Wallet Details</h2>
            <p class="text-body-1">{{ wallet.name }}</p>
            <p class="text-body-2">{{ wallet.address.bech32 }}</p>
        </template>
        <div>
            <!-- Show details here -->
            <v-toolbar class="mb-4">
                <v-toolbar-title>Last Updated: {{
                        moment(wallet.updated_at).format("YYYY-MM-DD HH:mm:ss")
                    }}
                </v-toolbar-title>
                <template v-slot:append>
                    <v-btn color="primary" variant="flat" :href="route('wallet.transactions', wallet)">Update</v-btn>
                </template>
            </v-toolbar>
            <v-data-table :items="wallet.transactions" :headers="transaction_headers" v-if="wallet.transactions">
                <!--                <template v-slot:item.diff="{ value }">
                                    <pre>{{value}}</pre>
                                    <v-chip v-for="entry in value" :key="entry.unit" size="small" class="me-2 my-2"
                                            :color="colorValue(quantity)">
                                        {{ entry.quantity / Math.pow(10, entry.decimals ?? 0) }} {{ entry.ticker }}
                                    </v-chip>
                                </template>-->
                <template v-slot:item.diff="{ value }">
                    <v-chip v-for="entry in value" :key="entry.unit" size="small" class="me-2"
                            :color="colorValue(entry.quantity)">
                        {{ formatQuantity(entry) }} {{ entry.ticker }}
                    </v-chip>
                    <!--                    <pre v-for="entry in value" :key="entry.unit" v-if="formatQuantity(entry) == 0">{{ entry }}</pre>-->
                    <!--                    <pre>{{ value }}</pre>-->
                </template>
                <template v-slot:item.tags="{ value }">
                    <v-chip v-for="tag in value" :key="tag.id" size="small" class="me-2">{{ tag.name }}</v-chip>
                </template>
            </v-data-table>
            <pre>{{ wallet }}</pre>
        </div>
    </app-layout>
</template>
