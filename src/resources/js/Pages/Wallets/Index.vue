<script setup>
import AppLayout from "@/Layouts/AppLayout.vue";
import {useForm} from "@inertiajs/vue3";

defineProps({
    wallets: {
        type: Array,
    }
});

const form = useForm({});

const deleteWallet = (wallet) => {
    form.delete(route('wallets.destroy', wallet));
}
</script>
<template>
    <app-layout title="Wallets">
        <template #header>
            <h2>Wallets</h2>
        </template>

        <div>
            <v-btn color="primary" :href="route('wallets.create')" class="mb-4">
                Create New
            </v-btn>
            <v-list v-if="wallets.length">
                <v-list-item v-for="wallet in wallets" :key="wallet.id">
                    <v-list-item-title>{{ wallet.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ wallet.address.bech32 }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                        <v-btn color="primary" variant="flat"
                               :href="route('wallets.show', wallet)"
                               class="me-2">
                            View
                        </v-btn>
                        <v-btn color="error" variant="flat"
                               @click="deleteWallet(wallet)">
                            Delete
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
            <!--            <pre>{{wallets}}</pre>-->
        </div>
    </app-layout>
</template>
