<script setup>
import {Head} from "@inertiajs/vue3";
import applicationLogo from "@/media/mercury-logo-full.png";

defineProps({
    title: String,
});
</script>
<template>
    <v-app>
        <Head :title="title"/>
        <v-app-bar color="white" elevation="0" class="px-8">
            <img :src="applicationLogo" alt="Mercury: Invoice" height="48"
                 width="151"/>
            <v-spacer/>
            <div v-if="$page.url === '/'">
                <v-btn size="large" variant="text" href="#features">Features
                </v-btn>
                <v-btn size="large" variant="text" href="#reviews">Reviews
                </v-btn>
                <v-btn size="large" variant="text" href="#pricing">Pricing
                </v-btn>
            </div>
            <v-spacer/>
            <template v-if="$page.url === '/'">
                <v-btn color="primary" variant="flat" size="large"
                       :href="route('dashboard')"
                       prepend-icon="mdi-greater-than">Launch App
                </v-btn>
            </template>
            <template v-else>
                <v-btn variant="text" size="large"
                       :href="route('home')">
                    Back to Homepage
                </v-btn>
            </template>

        </v-app-bar>
        <v-main>
            <slot/>
        </v-main>
        <v-footer app>
            <v-container class="text-center">
                Cardano Mercury: Financials v{{ $page.props.appVersion }}
            </v-container>
        </v-footer>
    </v-app>
</template>
