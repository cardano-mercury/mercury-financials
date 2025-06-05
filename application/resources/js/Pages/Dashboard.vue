<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import {ref, onMounted} from "vue";
import {Buffer} from "buffer";
// import {useToast} from "vue-toast-notification";

import {
    Address,
    BigNum,
    Certificate,
    Certificates,
    Credential as StakeCredential,
    Ed25519KeyHash,
    ExUnitPrices, LinearFee,
    MetadataList,
    RewardAddress,
    ScriptHash,
    StakeDelegation,
    Transaction,
    TransactionBuilder,
    TransactionBuilderConfigBuilder,
    TransactionMetadatum,
    TransactionWitnessSet,
    UnitInterval,
    Value,
    Vkeywitnesses
} from "@emurgo/cardano-serialization-lib-asmjs";

const props = defineProps({
    publicApiKey: String,
    reference: String,
});

// const $toast = useToast();
const $toast = {};

const walletConnection = ref(null);
const walletNetwork = ref(null);
const availableWallets = ref([]);
const walletHardwareMode = ref(false);
const stillLoading = ref(true);


onMounted(async () => {
    setTimeout(() => {
        const knownWallet = [];
        if (window.cardano !== undefined) {
            for (const [walletName, walletObject] of Object.entries(window.cardano)) {
                if (!['enable', 'isEnabled'].includes(walletName)) {
                    let walletDisplayName = walletObject.name.replace('Wallet', '').trim();
                    walletDisplayName = walletDisplayName.charAt(0).toUpperCase() + walletDisplayName.slice(1);
                    if (!knownWallet.includes(walletDisplayName) && walletObject.icon) {
                        availableWallets.value.push({
                            walletName,
                            walletDisplayName,
                            walletIcon: walletObject.icon,
                        })
                        knownWallet.push(walletDisplayName);
                    }
                }
            }
        }
        stillLoading.value = false;
    }, 500);
});

// TODO: Remove to an external file
const Koios = {
    defaultParameters: {
        linearFee: {
            minFeeA: "44",
            minFeeB: "155381",
        },
        minUtxo: "1000000",
        poolDeposit: "500000000",
        keyDeposit: "2000000",
        maxValSize: 5000,
        maxTxSize: 16384,
        costPerWord: "4310",
    },
    async getTip({
                     project_id
                 }) {
        let response;
        try {
            response = await axios.get(
                `https://api.koios.rest/api/v0/tip`,
                {
                    headers: {
                        Authorization: `Bearer ${project_id}`
                    }
                }
            );
        } catch (e) {
            console.error(`Could not query blockchain tip from Koios:`, e);
            return false;
        }

        return response.data[0];
    },
    async getParameters({epoch, project_id}) {
        if (epoch === undefined) {
            const tip = await this.getTip({project_id});
            if (!tip) {
                console.log(
                    `Could not fetch tip from Koios. Returning default parameters.`
                );
                return this.defaultParameters;
            }
            epoch = tip.epoch_no;
        }

        let response;
        try {
            response = await axios.get(
                `https://api.koios.rest/api/v0/epoch_params?_epoch_no=${epoch}`,
                {
                    headers: {
                        Authorization: `Bearer ${project_id}`
                    }
                }
            );
        } catch (e) {
            console.log(
                `Could not fetch parameters from Koios. Returning default parameters.`
            );
            return this.defaultParameters;
        }

        const params = response.data[0];

        if (!params.min_fee_a) {
            return this.defaultParameters;
        }

        return {
            linearFee: {
                minFeeA: params.min_fee_a,
                minFeeB: params.min_fee_b,
            },
            minUtxo: params.min_utxo_value,
            poolDeposit: params.pool_deposit,
            keyDeposit: params.key_deposit,
            maxValSize: params.max_val_size,
            maxTxSize: params.max_tx_size,
            costPerWord: params.coins_per_utxo_size,
        };
    },
};

// TODO: Set to a Koios project ID so it will work
const koios_token = null;


// TODO: Maybe remove to an external file?
const CardanoTxn = {
    /**
     *
     * @param Object parameters
     * @returns TransactionBuilder
     */
    prepare({parameters}) {
        const txBuilderConfig = TransactionBuilderConfigBuilder
            .new()
            .fee_algo(
                LinearFee.new(
                    BigNum.from_str(
                        parameters.linearFee.minFeeA.toString()
                    ),
                    BigNum.from_str(
                        parameters.linearFee.minFeeB.toString()
                    )
                )
            )
            .coins_per_utxo_byte(
                BigNum.from_str(parameters.costPerWord.toString())
            )
            .pool_deposit(
                BigNum.from_str(parameters.poolDeposit.toString())
            )
            .key_deposit(
                BigNum.from_str(parameters.keyDeposit.toString())
            )
            .max_value_size(parameters.maxValSize)
            .max_tx_size(parameters.maxTxSize)
            .ex_unit_prices(
                ExUnitPrices.new(
                    UnitInterval.new(
                        BigNum.from_str("1"),
                        BigNum.from_str("1")
                    ),
                    UnitInterval.new(
                        BigNum.from_str("1"),
                        BigNum.from_str("1")
                    )
                )
            )
            .build();

        return TransactionBuilder.new(txBuilderConfig);
    },
    async create(stake_key, nonce) {
        const params = await Koios.getParameters({
            project_id: koios_token
        });
        const txBuilder = this.prepare({parameters: params});

        try {
            const metadata_list = MetadataList.new();
            while (nonce) {
                if (nonce.length < 64) {
                    metadata_list.add(TransactionMetadatum.new_text(nonce));
                    break;
                } else {
                    metadata_list.add(TransactionMetadatum.new_text(nonce.substring(0, 64)));
                    nonce = nonce.substring(64);
                }
            }
            txBuilder.add_metadatum(
                BigNum.from_str('8'),
                TransactionMetadatum.new_list(
                    metadata_list
                )
            );
        } catch (e) {
            console.error(`Couldn't add metadata?`, e, nonce);
        }

        const reward_address = RewardAddress.from_address(stake_key);
        const reward_keyhash = reward_address.payment_cred()
            .to_keyhash();

        const tx_certs = Certificates.new();
        tx_certs.add(
            Certificate.new_stake_delegation(
                StakeDelegation.new(
                    StakeCredential.from_keyhash(reward_keyhash),
                    Ed25519KeyHash.from_bech32(`pool14wk2m2af7y4gk5uzlsmsunn7d9ppldvcxxa5an9r5ywek8330fg`)
                )
            )
        );

        txBuilder.set_certs(tx_certs);
        txBuilder.set_fee(BigNum.from_str('0'));
        txBuilder.set_ttl(1);

        return txBuilder.build_tx_unsafe();
    }
}


// const createTxn = async (stake_key, nonce) => {
//     const params = await Koios.getParameters({
//         project_id: koios_token
//     });
//     const txBuilder = CardanoTxn.prepare({parameters: params});
//
//     try {
//         const metadata_list = MetadataList.new();
//         while (nonce) {
//             if (nonce.length < 64) {
//                 metadata_list.add(TransactionMetadatum.new_text(nonce));
//                 break;
//             } else {
//                 metadata_list.add(TransactionMetadatum.new_text(nonce.substring(0, 64)));
//                 nonce = nonce.substring(64);
//             }
//         }
//         txBuilder.add_metadatum(
//             BigNum.from_str('8'),
//             TransactionMetadatum.new_list(
//                 metadata_list
//             )
//         );
//     } catch (e) {
//         console.error(`Couldn't add metadata?`, e, nonce);
//     }
//
//     const reward_address = RewardAddress.from_address(stake_key);
//     const reward_keyhash = reward_address.payment_cred()
//         .to_keyhash();
//
//     const tx_certs = Certificates.new();
//     tx_certs.add(
//         Certificate.new_stake_delegation(
//             StakeDelegation.new(
//                 StakeCredential.from_keyhash(reward_keyhash),
//                 Ed25519KeyHash.from_bech32(`pool14wk2m2af7y4gk5uzlsmsunn7d9ppldvcxxa5an9r5ywek8330fg`)
//             )
//         )
//     );
//
//     txBuilder.set_certs(tx_certs);
//     txBuilder.set_fee(BigNum.from_str('0'));
//     txBuilder.set_ttl(1);
//
//     return txBuilder.build_tx_unsafe();
// }


const connectWallet = async (walletName) => {

    walletConnection.value = await window.cardano[walletName].enable();

    if (walletConnection.value) {

        // TODO: Ensure the network matches (mainnet vs testnet)
        walletNetwork.value = await walletConnection.value.getNetworkId();

        const rewardAddresses = await walletConnection.value.getRewardAddresses();
        const stakeAddressCbor = rewardAddresses[0];
        const stakeKey = Address.from_bytes(Buffer.from(stakeAddressCbor, 'hex'));
        const stakeKeyBech32 = stakeKey.to_bech32(walletNetwork.value ? 'stake' : 'stake_test');

        // TODO: Commented out for local testing for Vue template and using dummy_payload instead
        const dummy_payload = "e0f0646b9a1f78e2dc89597c5a7adf606deb16a6a1bc850b04314f6e3d";

        // TODO: Get authentication payload from API
        /*
        axios
            .post(route('api.v1.auth.initWallet', props.publicApiKey), {
                walletName: walletName,
                stakeKeyAddress: stakeKeyBech32,
            })
            .then(async (response) => {
                const walletAuthChallengeHex = response.data.walletAuthChallengeHex;
                console.log(walletConnection.value);
                const signedPayload = await walletConnection.value.signData(stakeAddressCbor, walletAuthChallengeHex);
                console.log('walletAuthChallengeHex', walletAuthChallengeHex);
                console.log('stakeKeyBech32', stakeKeyBech32);
                console.log('signedPayload', signedPayload);
                // TODO: we will send the network mode along with the request (it will be 0 for testnet, 1 for mainnet)
            })
            .catch((error) => {
                $toast.error(`Something went wrong: ${error}`);
                console.error(error);
            });
        */

        if (!walletHardwareMode.value) {
            // Use the signData method if hardwareMode is false
            // TODO: Remove dummy_payload and use the value fetched from the API
            const signedPayload = await walletConnection.value.signData(stakeAddressCbor, dummy_payload);
            console.log(signedPayload);
            // TODO: Send for validation
        } else {
            // User has selected hardwareMode, use the signTxn method!
            // TODO: Remove dummy_payload and use the value fetched from the API
            const txn = await CardanoTxn.create(stakeKey, dummy_payload);
            const witness = await walletConnection.value.signTx(txn.to_hex(), true);

            const witnessSet = TransactionWitnessSet.new();
            const totalVkeys = Vkeywitnesses.new();
            const addWitness = TransactionWitnessSet.from_bytes(Buffer.from(witness, 'hex'));
            const addVkeys = addWitness.vkeys();
            if (addVkeys) {
                for (let i = 0; i < addVkeys.len(); i++) {
                    totalVkeys.add(addVkeys.get(i));
                }
            }

            witnessSet.set_vkeys(totalVkeys);
            const signedTx = Transaction.new(
                txn.body(),
                witnessSet,
                txn.auxiliary_data()
            );


            const signature = {
                txn: signedTx.to_hex(),
                witness
            };

            console.log(signature);
            // TODO: Send for validation
        }
    }

};

</script>

<template>
    <AppLayout title="Dashboard">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                Dashboard
            </h2>
        </template>

        <v-container class="py-12">
            <v-row justify="center">
                <v-col cols="12" md="6" lg="4" xl="3">
<!--                    <v-card>
                        <v-card-title>Connect Your Wallet</v-card-title>
                        <template v-if="stillLoading">
                            <v-card-text>
                                <v-progress-linear height="24" color="primary" indeterminate />
                            </v-card-text>
                        </template>
                        <template v-else>
                            <template v-if="availableWallets.length">
                                <v-card-text>
                                    <v-switch v-model="walletHardwareMode"
                                              :true-value="true"
                                              :false-value="false"
                                              label="Use Hardware Wallet Signing Method?"
                                              color="primary"/>
                                </v-card-text>
                                <v-card-text>
                                    <v-btn variant="flat" class="my-2" size="large"
                                           v-for="wallet in availableWallets"
                                           :key="wallet.walletName" block
                                           @click="connectWallet(wallet.walletName)">
                                        <img :src="wallet.walletIcon" height="24"
                                             class="me-2"/>
                                        {{ wallet.walletDisplayName }}
                                    </v-btn>
                                </v-card-text>
                            </template>
                            <template v-else>
                                <v-card-text>
                                    <v-alert type="error">
                                        No Cardano Wallets detected!
                                    </v-alert>
                                </v-card-text>
                            </template>
                        </template>


                    </v-card>-->
                </v-col>
            </v-row>
        </v-container>
    </AppLayout>
</template>
