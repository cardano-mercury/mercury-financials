<script setup>
import AppLayout from "@/Layouts/AppLayout.vue";
import {useForm} from "@inertiajs/vue3";

defineProps({});

const form = useForm({
    name: null,
    address: null,
})
</script>
<template>
    <app-layout title="Create New Wallet">
        <template #header>
            <h2>
                Create New Wallet
            </h2>
        </template>

        <div>
            <v-form @submit.prevent="form.post(route('wallets.store'))">
                <v-text-field v-model="form.name" required label="Name"
                              :error="form.errors.name"
                              :error-messages="form.errors.name"
                              class="mb-2"/>
                <v-text-field v-model="form.address" required label="Address"
                              :error="form.errors.address"
                              :error-messages="form.errors.address"
                              class="mb-2"/>
                <v-btn type="submit" color="primary">
                    Create
                </v-btn>
            </v-form>
        </div>
    </app-layout>
</template>
